import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickOption, searchAndPick } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const uniqueName = (label) => `E2E N102 ${label} ${Date.now()}`;

const openDrawer = (page, title) => outsideInert(page, page.getByRole("navigation").filter({ hasText: title }));
const rowWith = (page, text) => page.getByRole("row").filter({ hasText: text });

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

async function searchList(page, text) {
  await page.getByRole("textbox", { name: "Buscar" }).fill(text);
}

async function filterByStatus(page, status) {
  await page.getByRole("button", { name: "FILTRAR" }).click();
  const filter = openDrawer(page, "Filtrar Registros");
  await filter.getByRole("radio", { name: status, exact: true }).check();
  await filter.getByRole("button", { name: "Aceptar" }).click();
  await expect(filter).toBeHidden();
}

async function fillNewCity(page, name) {
  await page.getByRole("button", { name: "NUEVO" }).click();
  const drawer = openDrawer(page, "Nuevo ciudades");
  await searchAndPick(page, "Pais (*)", "Peru");
  await searchAndPick(page, "Estado (*)", "Amazonas");
  await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
  return drawer;
}

async function createPort(page, name) {
  await page.getByRole("button", { name: "NUEVO" }).click();
  const drawer = openDrawer(page, "Nuevo Puerto");
  await pickOption(page, "Tipo Transporte (*)", /^Marítimo$/);
  await searchAndPick(page, "Pais (*)", "Peru");
  await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
  await drawer.getByRole("button", { name: "Aceptar" }).click();
  await acknowledge(page, /registro correcto/i);
  await expect(drawer).toBeHidden();
  await searchList(page, name);
  await expect(rowWith(page, name).first()).toContainText("Activo");
}

test.describe("Departamento", () => {
  test("a department without description can be edited and saved", async ({ page }) => {
    const name = uniqueName("depto");
    await page.goto("/home/state/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "NUEVO" }).click();
    const drawer = openDrawer(page, "Nuevo estado");
    await searchAndPick(page, "Pais (*)", "Peru");
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
    await drawer.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, /registro correcto/i);
    await expect(drawer).toBeHidden();

    await searchList(page, name);
    await rowWith(page, name).locator(".mdi-pencil").click();
    const editor = openDrawer(page, `Modificar Estado: ${name}`);
    await expect(editor.getByLabel("Descripción", { exact: true })).toHaveValue("");
    await editor.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, /actualización correcta/i);
    await expect(editor).toBeHidden();
  });
});

test.describe("Ciudades", () => {
  test("a city closes its panel once saved and the same name in that department is refused", async ({ page }) => {
    const name = uniqueName("ciudad");
    await page.goto("/home/city/listado");
    await waitForPageToSettle(page);

    const drawer = await fillNewCity(page, name);
    await drawer.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, /registro correcto/i);
    await expect(drawer).toBeHidden();

    await fillNewCity(page, name.toLowerCase());
    await drawer.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, `Ya existe la ciudad "${name}"`);
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Cerrar" }).click();

    await searchList(page, name);
    await expect(rowWith(page, name)).toHaveCount(1);
  });
});

test.describe("Puertos", () => {
  test("filters cleared with the X still list the ports", async ({ page }) => {
    await page.goto("/home/puertos/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "FILTRAR" }).click();
    const filter = openDrawer(page, "Filtrar Registros");
    await pickOption(page, "Tipo Transporte", /^Marítimo$/);
    await filter.getByLabel("Nombre", { exact: true }).fill("callao");
    for (const label of ["Tipo Transporte", "Nombre"]) {
      await filter.locator(".v-input").filter({ hasText: label }).locator(".v-field__clearable .v-icon").click({ force: true });
    }

    const listed = page.waitForResponse((response) => response.url().includes("listar_puerto"));
    await filter.getByRole("button", { name: "Aceptar" }).click();
    const response = await listed;

    expect(response.url()).not.toContain("null");
    expect((await response.json()).estadoflag).toBe(true);
    await expect(filter).toBeHidden();
  });

  test("an inactive port can be switched back on from Editar", async ({ page }) => {
    const name = uniqueName("puerto");
    await page.goto("/home/puertos/listado");
    await waitForPageToSettle(page);
    await createPort(page, name);

    await rowWith(page, name).first().locator(".mdi-delete").click();
    await page.getByRole("button", { name: "Si, inactivar" }).click();
    await acknowledge(page, /actualización correcta/i);
    await filterByStatus(page, "Inactivo");
    await searchList(page, name);
    await expect(rowWith(page, name).first()).toContainText("Inactivo");

    await rowWith(page, name).first().locator(".mdi-pencil").click();
    const editor = openDrawer(page, `Modificar Puerto: ${name}`);
    await editor.getByRole("checkbox", { name: "Estado: Inactivo" }).check();
    await editor.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, /actualización correcta/i);
    await expect(editor).toBeHidden();

    await filterByStatus(page, "Activo");
    await searchList(page, name);
    await expect(rowWith(page, name)).toHaveCount(2);
    for (const row of await rowWith(page, name).all()) await expect(row).toContainText("Activo");
  });
});
