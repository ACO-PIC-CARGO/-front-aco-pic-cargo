import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { credentials, SESSION_FILE } from "./support/env.mjs";
import { loginThroughUi, submitLogin } from "./support/login.mjs";
import { waitForPageToSettle } from "./support/page.mjs";
import { lockModuleInAccess, moduleIdForRoute } from "./support/plan-access.mjs";

const WRONG_PASSWORD_MESSAGE = "Datos Incorrectos";

test.describe("login", () => {
  test.use({ authenticated: false });

  test("signs in with a branch and lands on the dashboard", async ({ page }) => {
    await loginThroughUi(page, credentials());
    await expect(page.getByText("INICIO", { exact: true })).toBeVisible();
  });

  test("keeps the user on the login screen after a wrong password", async ({ page }) => {
    await submitLogin(page, { user: credentials().user, password: "wrong-password-e2e" });
    await expect(page.getByText(WRONG_PASSWORD_MESSAGE)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("navigation", () => {
  test("opens Mi plan from the side menu", async ({ page }) => {
    await page.goto("/home/historial-facturacion");
    await waitForPageToSettle(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByText("CONFIGURACIÓN", { exact: true }).click();
    await page.getByText("INFORMACIÓN PLAN", { exact: true }).click();
    await page.getByRole("link", { name: "Mi plan" }).click();
    await expect(page).toHaveURL(/\/home\/mi-plan$/);
    await expect(page.getByRole("heading", { name: "Mi plan" })).toBeVisible();
  });

  test("signs out from the account menu", async ({ page }) => {
    await page.goto("/home/historial-facturacion");
    await waitForPageToSettle(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("button", { name: "Cuenta" }).click();
    await page.getByText("Cerrar Sesión", { exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Iniciar Sesión" })).toBeVisible();
  });

  test("sends a module outside the plan to Mi plan with an upgrade prompt", async ({ page }) => {
    const { session } = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
    const moduleId = moduleIdForRoute(JSON.parse(session.menu), "lstQuote");
    await page.route(/\/branch_subscription\/access(\?|$)/, async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, json: lockModuleInAccess(await response.json(), moduleId) });
    });
    await page.goto("/home/folderPricing/lstQuote");
    await expect(page).toHaveURL(/\/home\/mi-plan$/);
    await expect(page.getByText(/no está (en tu plan|disponible)/)).toBeVisible();
    await page.getByRole("button", { name: "Ahora no" }).click();
  });
});
