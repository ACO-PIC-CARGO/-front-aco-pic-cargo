import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickFirstOption, pickOption, searchAndPick } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const PASSWORD = "Clave-E2e-2026";
const uniqueEmail = (label) => `e2e.m8.${label}.${Date.now()}@example.com`;
const uniqueDocument = () => String(Date.now()).slice(-8);

const rowWith = (page, text) => page.getByRole("row").filter({ hasText: text });
const tab = (page, name) => page.getByRole("tab", { name });

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

async function fillNewUserData(page, { email, password, confirmation = password }) {
  await pickFirstOption(page, "Tipo de Documento (*)");
  await page.getByLabel("Documento (*)", { exact: true }).fill(uniqueDocument());
  await page.getByLabel("Nombres (*)", { exact: true }).fill("Usuario");
  await page.getByLabel("Apellido Paterno (*)", { exact: true }).fill("Prueba");
  await page.getByLabel("Apellido Materno (*)", { exact: true }).fill("Ocho");
  await page.getByLabel("Teléfono (*)", { exact: true }).fill("999888777");
  await page.getByLabel("Correo (*)", { exact: true }).fill(email);
  await page.getByLabel("Clave*", { exact: true }).fill(password);
  await page.getByLabel("Confirmar Clave*", { exact: true }).fill(confirmation);
  await pickOption(page, "Sexo (*)", "Masculino");
  await searchAndPick(page, "Pais (*)", "Peru");
  await page.getByLabel("Dirección (*)", { exact: true }).fill("Av. Prueba 123");
}

async function addRole(page, label, role) {
  await pickOption(page, label, role);
  await page.getByRole("button", { name: "Agregar" }).click();
}

async function createUser(page, email, roles) {
  await page.goto("/home/usuarios/nuevo");
  await waitForPageToSettle(page);
  await fillNewUserData(page, { email, password: PASSWORD });
  await page.getByRole("button", { name: "Siguiente" }).click();
  for (const role of roles) await addRole(page, "Módulo", role);
  await page.getByRole("button", { name: "Guardar" }).click();
  await acknowledge(page, /registro correcto/i);
  await expect(page).toHaveURL(/\/home\/usuarios\/listado$/);
}

async function openEditor(page, email) {
  await waitForPageToSettle(page);
  await page.getByRole("textbox", { name: "Buscar" }).fill(email);
  await rowWith(page, email).locator(".mdi-pencil").click();
  await expect(page).toHaveURL(/\/home\/usuarios\/editar\/\d+$/);
  await waitForPageToSettle(page);
  return page.url();
}

async function saveEditor(page) {
  await page.getByRole("button", { name: "Guardar" }).click();
  await acknowledge(page, /actualización correcta/i);
  await expect(page).toHaveURL(/\/home\/usuarios\/listado$/);
}

test("filtering the list by e-mail shows only the users of the session company", async ({ page }) => {
  await page.goto("/home/usuarios/listado");
  await waitForPageToSettle(page);

  await page.getByRole("button", { name: "FILTRAR" }).click();
  const drawer = outsideInert(page, page.getByRole("navigation").filter({ hasText: "Filtrar Registros" }));
  await drawer.getByLabel("Email", { exact: true }).fill("@");
  await drawer.getByRole("button", { name: "Aceptar" }).click();
  await expect(drawer).toBeHidden();

  const search = page.getByRole("textbox", { name: "Buscar" });
  await search.fill("intercontinentalkargo");
  await expect(page.getByText("No data available")).toBeVisible();
  await search.fill("pic-vzla");
  await expect(page.getByText("No data available")).toBeVisible();
  await search.fill("e2e");
  await expect(rowWith(page, "e2e")).not.toHaveCount(0);
});

test("Nuevo refuses a short password and a different confirmation, then moves on to Módulos", async ({ page }) => {
  const email = uniqueEmail("clave");
  await page.goto("/home/usuarios/nuevo");
  await waitForPageToSettle(page);

  await fillNewUserData(page, { email, password: "1234567" });
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByText("La clave debe tener al menos 8 caracteres.")).toBeVisible();
  await expect(tab(page, "Datos del Usuario")).toHaveAttribute("aria-selected", "true");

  await page.getByLabel("Clave*", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar Clave*", { exact: true }).fill(`${PASSWORD}x`);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByText(/las claves no coinciden/i)).toBeVisible();
  await expect(tab(page, "Datos del Usuario")).toHaveAttribute("aria-selected", "true");

  await page.getByLabel("Confirmar Clave*", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(tab(page, "Módulos a Usar")).toHaveAttribute("aria-selected", "true");
  await addRole(page, "Módulo", "MASTER PRICING");
  await page.getByRole("button", { name: "Guardar" }).click();
  await acknowledge(page, /registro correcto/i);
  await expect(page).toHaveURL(/\/home\/usuarios\/listado$/);
});

test("Editar switches a user off and back on", async ({ page }) => {
  const email = uniqueEmail("estado");
  await createUser(page, email, ["MASTER PRICING"]);
  const editorUrl = await openEditor(page, email);

  const activeSwitch = page.getByRole("checkbox", { name: "Activo" });
  await expect(activeSwitch).toBeChecked();
  await activeSwitch.uncheck();
  await expect(page.getByRole("checkbox", { name: "Inactivo" })).not.toBeChecked();
  await saveEditor(page);

  await page.goto(editorUrl);
  await waitForPageToSettle(page);
  const inactiveSwitch = page.getByRole("checkbox", { name: "Inactivo" });
  await expect(inactiveSwitch).not.toBeChecked();
  await inactiveSwitch.check();
  await saveEditor(page);

  await page.getByRole("textbox", { name: "Buscar" }).fill(email);
  await expect(rowWith(page, email)).toContainText("Activo");
});

test("removing a role in Editar removes that role and keeps the others", async ({ page }) => {
  const email = uniqueEmail("roles");
  await createUser(page, email, ["MASTER PRICING", "MASTER OPERATIVO"]);
  const editorUrl = await openEditor(page, email);
  const roleRows = (name) => rowWith(page, name);

  await tab(page, "Módulos a Usar").click();
  await addRole(page, "Posición", "MASTER ADMINISTRATIVO");
  await roleRows("MASTER PRICING").getByRole("button").click();
  await roleRows("MASTER ADMINISTRATIVO").getByRole("button").click();

  await expect(roleRows("MASTER OPERATIVO")).toHaveCount(1);
  await expect(roleRows("MASTER PRICING")).toHaveCount(0);
  await expect(roleRows("MASTER ADMINISTRATIVO")).toHaveCount(0);
  await saveEditor(page);

  await page.goto(editorUrl);
  await waitForPageToSettle(page);
  await tab(page, "Módulos a Usar").click();
  await expect(roleRows("MASTER OPERATIVO")).toHaveCount(1);
  await expect(roleRows("MASTER PRICING")).toHaveCount(0);
  await expect(roleRows("MASTER ADMINISTRATIVO")).toHaveCount(0);
});
