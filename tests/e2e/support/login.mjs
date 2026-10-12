import { expect } from "@playwright/test";

export async function submitLogin(page, { user, password }) {
  await page.goto("/");
  await page.getByPlaceholder("Usuario o Email").fill(user);
  await page.getByPlaceholder("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
}

export async function loginThroughUi(page, { user, password, branch }) {
  await submitLogin(page, { user, password });
  // Vuetify 4 select inputs ignore pointer events: wait for the branch slide to settle, then click through to the field.
  await page.getByRole("button", { name: "Continuar" }).click({ trial: true });
  await page.getByLabel("Sucursal", { exact: true }).click({ force: true });
  await page.getByRole("option", { name: branch }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/home\/main$/, { timeout: 30_000 });
}
