import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const WELCOME = "Hola, queremos conocer tu negocio.";

test("finishing the onboarding opens the dashboard instead of restarting it", async ({ page }) => {
  await page.route("**/omitir_config_cost", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await page.goto("/home/main/configuracion_inicial");
  await waitForPageToSettle(page);

  await page.getByRole("button", { name: "Comenzar" }).click();
  await page.getByRole("button", { name: "Omitir", exact: true }).click();
  for (const step of ["proveedores", "clientes"]) {
    await test.step(step, () => page.getByRole("button", { name: /CONTINUAR\s*LO HARÉ DESPUÉS/ }).click());
  }
  await expect(page.getByRole("heading", { name: "Tu empresa ha sido configurada" })).toBeVisible();
  await page.getByRole("button", { name: /INGRESAR Y EXPLORAR/ }).click();

  await expect(page).toHaveURL(/\/home\/main$/, { timeout: 15_000 });
  await waitForPageToSettle(page);
  await expect(page.getByText(WELCOME)).toBeHidden();
});
