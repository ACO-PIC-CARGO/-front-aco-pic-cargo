import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const uniqueName = (label) => `E2E N100 ${label} ${Date.now()}`;

const openDrawer = (page, title) => outsideInert(page, page.getByRole("navigation").filter({ hasText: title }));
const rowWith = (page, text) => page.getByRole("row").filter({ hasText: text });
const openDialog = (page) => page.locator(".v-overlay--active .v-card").last();

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

async function searchList(page, text) {
  await page.getByRole("textbox", { name: "Buscar" }).fill(text);
}

async function leaveThroughMenuAndComeBack(page, { to, backTo }) {
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("treeitem", { name: "FICHEROS" }).click();
  await page.getByRole("treeitem", { name: "CUENTAS Y BANCOS" }).click();
  await page.getByRole("link", { name: to, exact: true }).click();
  await waitForPageToSettle(page);
  await page.getByRole("link", { name: backTo, exact: true }).click();
  await waitForPageToSettle(page);
}

async function acknowledgeAndReloadBanks(page, message) {
  const reloaded = page.waitForResponse((response) => response.url().includes("listar_bank"));
  await acknowledge(page, message);
  await reloaded;
}

async function createBank(page, name) {
  await page.getByRole("button", { name: "Nuevo" }).click();
  const drawer = openDrawer(page, "Nuevo Banco");
  await drawer.getByLabel("Acrónimo (*)", { exact: true }).fill("E2E");
  await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
  await drawer.getByRole("button", { name: "Aceptar" }).click();
  await acknowledge(page, /registro correcto/i);
  await expect(drawer).toBeHidden();
  await searchList(page, name);
  await expect(rowWith(page, name)).toHaveCount(1);
}

test.describe("Bancos", () => {
  test("Nuevo starts empty after viewing a bank and leaving the screen, and a double click saves it once", async ({ page }) => {
    const name = uniqueName("banco");
    await page.goto("/home/bank/list");
    await waitForPageToSettle(page);
    await rowWith(page, "Banco de Comercio").locator(".mdi-eye").click();
    const viewDrawer = openDrawer(page, "Ver: Banco de Comercio");
    await expect(viewDrawer.getByLabel("Nombre", { exact: true })).toHaveValue("Banco de Comercio");
    await viewDrawer.getByRole("button", { name: "Cerrar" }).click();

    await leaveThroughMenuAndComeBack(page, { to: "MONEDAS", backTo: "BANCOS" });
    await expect(page).toHaveURL(/\/home\/bank\/list$/);
    await page.getByRole("button", { name: "Nuevo" }).click();

    const drawer = openDrawer(page, "Nuevo Banco");
    for (const label of ["Acrónimo (*)", "Nombre (*)", "Descripción"]) {
      await expect(drawer.getByLabel(label, { exact: true }), label).toHaveValue("");
    }
    await expect(drawer.getByRole("checkbox", { name: "Estado: Activo" })).toBeChecked();
    await drawer.getByLabel("Acrónimo (*)", { exact: true }).fill("E2E");
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
    await drawer.getByRole("button", { name: "Aceptar" }).dblclick();

    await acknowledge(page, /registro correcto/i);
    await expect(drawer).toBeHidden();
    await expect(page.getByText(/Ya existe un banco/)).toHaveCount(0);
    await searchList(page, name);
    await expect(rowWith(page, name)).toHaveCount(1);
  });

  test("Eliminar cuenta switches the account off", async ({ page }) => {
    const name = uniqueName("banco cuenta");
    const accountNumber = String(Date.now());
    await page.goto("/home/bank/list");
    await waitForPageToSettle(page);
    await createBank(page, name);

    await rowWith(page, name).locator(".mdi-bank").click();
    await page.getByRole("button", { name: "Nueva Cuenta" }).click();
    const accountForm = openDialog(page);
    await pickOption(page, "Moneda", /^USD$/);
    await accountForm.getByLabel("Nro Cuenta", { exact: true }).fill(accountNumber);
    await accountForm.getByRole("button", { name: "Guardar" }).click();
    await acknowledgeAndReloadBanks(page, /registro correcto/i);

    await rowWith(page, name).locator(".mdi-bank").click();
    await openDialog(page).getByRole("row").filter({ hasText: accountNumber }).locator(".mdi-delete").click();
    const question = page.getByRole("dialog").filter({ hasText: `¿Quieres eliminar la cuenta ${accountNumber}?` });
    await question.getByRole("button", { name: /^ok$/i }).click();
    await acknowledgeAndReloadBanks(page, /actualización correcta/i);

    await rowWith(page, name).locator(".mdi-bank").click();
    await openDialog(page).getByRole("row").filter({ hasText: accountNumber }).locator(".mdi-pencil").click();
    await expect(openDialog(page).getByRole("checkbox", { name: "Inactivo", exact: true })).not.toBeChecked();
  });
});

test.describe("Monedas", () => {
  test("an inactive currency can be listed and switched back on, with its symbol and acronym locked", async ({ page }) => {
    await page.goto("/home/coins/list");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "Filtrar" }).click();
    const filter = openDrawer(page, "Filtrar Registros");
    await filter.getByRole("radio", { name: "Inactivo" }).check();
    await filter.getByRole("button", { name: "Aceptar" }).click();
    await expect(rowWith(page, "Bolivares")).toContainText("Inactivo");

    await rowWith(page, "Bolivares").locator(".mdi-pencil").click();
    let drawer = openDrawer(page, "Modificar: Bolivares");
    await expect(drawer.getByLabel("Símbolo", { exact: true })).toHaveValue("Bs.");
    await expect(drawer.getByLabel("Símbolo", { exact: true })).not.toBeEditable();
    await expect(drawer.getByLabel("Acrónimo", { exact: true })).not.toBeEditable();
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill("Bolivares E2E");
    await drawer.getByRole("checkbox", { name: "Estado: Inactivo" }).check();
    await drawer.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, /actualización correcta/i);
    await expect(drawer).toBeHidden();
    await expect(rowWith(page, "Bolivares E2E")).toContainText("Activo");

    await rowWith(page, "Bolivares E2E").locator(".mdi-pencil").click();
    drawer = openDrawer(page, "Modificar: Bolivares E2E");
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill("Bolivares");
    await drawer.getByRole("checkbox", { name: "Estado: Activo" }).uncheck();
    await drawer.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, /actualización correcta/i);
    await expect(drawer).toBeHidden();
    await expect(rowWith(page, "Bolivares")).toHaveCount(0);
  });

  test("a currency in use cannot be switched off", async ({ page }) => {
    await page.goto("/home/coins/list");
    await waitForPageToSettle(page);

    await rowWith(page, "Dólares").locator(".mdi-pencil").click();
    const drawer = openDrawer(page, "Modificar: Dólares");
    await drawer.getByRole("checkbox", { name: "Estado: Activo" }).uncheck();
    await drawer.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, /No puedes inactivar esta moneda/);
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Cerrar" }).click();
    await expect(rowWith(page, "Dólares")).toContainText("Activo");
  });
});

test.describe("Tipos de pago", () => {
  test("the panel closes after a new type is saved", async ({ page }) => {
    const name = uniqueName("pago").slice(0, 40);
    await page.goto("/home/type_servicio/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "NUEVO" }).click();
    const drawer = openDrawer(page, "Nuevo Tipos de Pago");
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
    await drawer.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, /registro correcto/i);
    await expect(drawer).toBeHidden();
    await searchList(page, name);
    await expect(rowWith(page, name)).toContainText("Activo");
  });

  test("a # in a filter keeps the status filter", async ({ page }) => {
    await page.goto("/home/type_servicio/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "FILTRAR" }).click();
    const drawer = openDrawer(page, "Filtrar Registros");
    await drawer.getByLabel("Nombre", { exact: true }).fill("#");
    await drawer.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, "No se encontraron registros");
    await expect(page.getByText("No data available")).toBeVisible();
  });
});
