import { test, expect } from "./fixtures.mjs";
import { credentials } from "./support/env.mjs";
import { submitLogin } from "./support/login.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const WRONG_PASSWORD_MESSAGE = "Datos Incorrectos";
const TOO_MANY_ATTEMPTS_MESSAGE = "Hiciste demasiados intentos";
const RECOVERY_NEEDS_EMAIL_MESSAGE = "Escribe el correo de tu cuenta";
const EXPIRED_LINK_MESSAGE = "venció o ya se usó";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const SESSION_KEYS = ["security", "auth-token", "dataUser", "dataBranch", "iso_pais", "menu", "ConfigEmpresa"];

test.describe("login and recovery", () => {
  test.use({ authenticated: false });

  test("a wildcard user name opens no account", async ({ page }) => {
    await submitLogin(page, { user: "%", password: credentials().password });

    await expect(page.getByText(WRONG_PASSWORD_MESSAGE)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("the login refuses an account after 10 attempts", async ({ page }) => {
    const account = `e2e.limit.${Date.now()}@example.com`;
    for (let attempt = 0; attempt < 10; attempt++) {
      await submitLogin(page, { user: account, password: "wrong-password-e2e" });
      await expect(page.getByText(WRONG_PASSWORD_MESSAGE)).toBeVisible();
    }

    await submitLogin(page, { user: account, password: "wrong-password-e2e" });

    await expect(page.getByText(TOO_MANY_ATTEMPTS_MESSAGE)).toBeVisible();
  });

  test("forgot password asks for the e-mail before sending anything", async ({ page }) => {
    const recoveryRequests = [];
    page.on("request", (request) => {
      if (request.url().includes("recuperar_clave")) recoveryRequests.push(request.url());
    });
    await page.goto("/");

    await page.getByText("Olvidé Contraseña").click();

    await expect(page.getByText(RECOVERY_NEEDS_EMAIL_MESSAGE)).toBeVisible();
    expect(recoveryRequests).toEqual([]);
  });

  test("a recovery request never returns the reset link", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Usuario o Email").fill(credentials().user);
    const recovery = page.waitForResponse((response) => response.url().includes("recuperar_clave"));

    await page.getByText("Olvidé Contraseña").click();

    expect(JSON.stringify(await (await recovery).json())).not.toMatch(UUID);
  });

  test("an unknown reset link explains itself and leads back to the login", async ({ page }) => {
    await page.goto("/reestablecer_clave/not-a-real-token");

    await expect(page.getByText(EXPIRED_LINK_MESSAGE)).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("sign out", () => {
  test("leaves no session data behind for a new tab to restore", async ({ page }) => {
    await page.goto("/home/historial-facturacion");
    await waitForPageToSettle(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("button", { name: "Cuenta" }).click();

    await page.getByText("Cerrar Sesión", { exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    const leftovers = await page.evaluate(
      (keys) => keys.filter((key) => localStorage.getItem(key) !== null || sessionStorage.getItem(key) !== null),
      SESSION_KEYS,
    );
    expect(leftovers).toEqual([]);
  });
});
