import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const uniqueName = (label) => `E2E N18 ${label} ${Date.now()}`;
const randomLetters = (length) =>
  Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");

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

async function leaveThroughMenuAndComeBack(page, { to, backTo }) {
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("treeitem", { name: "FICHEROS" }).click();
  await page.getByRole("treeitem", { name: "CLIENTES Y PROVEEDORES" }).click();
  await page.getByRole("link", { name: to, exact: true }).click();
  await waitForPageToSettle(page);
  await page.getByRole("link", { name: backTo, exact: true }).click();
  await waitForPageToSettle(page);
}

async function fillContainer(drawer, name) {
  await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
  await drawer.getByLabel("Largo (*)", { exact: true }).fill("5.5");
  await drawer.getByLabel("Ancho (*)", { exact: true }).fill("2.3");
  await drawer.getByLabel("Altura (*)", { exact: true }).fill("2.4");
  await drawer.getByLabel("Peso Máximo (*)", { exact: true }).fill("20");
  await drawer.getByLabel("Volumen Máximo (*)", { exact: true }).fill("30");
}

async function saveNewContainerAndFindIt(page, drawer, name) {
  await drawer.getByRole("button", { name: "Aceptar" }).click();
  await acknowledge(page, /registro correcto/i);
  await drawer.getByRole("button", { name: "Cerrar" }).click();
  await searchList(page, name);
  await expect(rowWith(page, name)).toContainText("Activo");
}

async function createMultiplicador(page, name) {
  await page.getByRole("button", { name: "Nuevo" }).click();
  const drawer = openDrawer(page, "Nuevo Registro");
  await pickOption(page, "Tipo de Carga (*)", /^LCL$/);
  await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
  await drawer.getByLabel("Valor (*)", { exact: true }).fill("0.35");
  await drawer.getByRole("button", { name: "Nuevo" }).click();
  await acknowledge(page, /registro correcto/i);
  await drawer.getByRole("button", { name: "Cerrar" }).click();
  await searchList(page, name);
}

test.describe("Contenedores", () => {
  test("a new container is saved and listed", async ({ page }) => {
    const name = uniqueName("contenedor");
    await page.goto("/home/containers/list");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "Nuevo" }).click();
    const drawer = openDrawer(page, "Nuevo Contenedor");
    await fillContainer(drawer, name);

    await saveNewContainerAndFindIt(page, drawer, name);
  });

  test("Nuevo starts empty after viewing a container and leaving the screen", async ({ page }) => {
    const name = uniqueName("contenedor");
    await page.goto("/home/containers/list");
    await waitForPageToSettle(page);
    const viewed = rowWith(page, "20' Standard");
    await viewed.locator(".mdi-eye").click();
    const viewDrawer = openDrawer(page, "Ver: 20' Standard");
    await expect(viewDrawer.getByLabel("Nombre", { exact: true })).toHaveValue("20' Standard");
    await viewDrawer.getByRole("button", { name: "Cerrar" }).click();

    await leaveThroughMenuAndComeBack(page, { to: "MULTIPLICADORES", backTo: "CONTENEDORES" });
    await expect(page).toHaveURL(/\/home\/containers\/list$/);
    await page.getByRole("button", { name: "Nuevo" }).click();

    const drawer = openDrawer(page, "Nuevo Contenedor");
    for (const label of ["Nombre (*)", "Descripción", "Largo (*)", "Ancho (*)", "Altura (*)", "Peso Máximo (*)", "Volumen Máximo (*)"]) {
      await expect(drawer.getByLabel(label, { exact: true }), label).toHaveValue("");
    }
    await expect(drawer.getByRole("checkbox", { name: "Estado: Activo" })).toBeChecked();
    await fillContainer(drawer, name);
    await saveNewContainerAndFindIt(page, drawer, name);
  });
});

test.describe("Multiplicadores", () => {
  test("a new multiplier with a decimal value and a cargo type is saved and listed", async ({ page }) => {
    const name = uniqueName("mult");
    await page.goto("/home/multiplicador/listado");
    await waitForPageToSettle(page);

    await createMultiplicador(page, name);

    const row = rowWith(page, name);
    await expect(row).toContainText("LCL");
    await expect(row).toContainText("0.35");
    await expect(row).toContainText("Activo");
  });

  test("switching Estado off while editing saves the multiplier as inactive", async ({ page }) => {
    const name = uniqueName("mult");
    await page.goto("/home/multiplicador/listado");
    await waitForPageToSettle(page);
    await createMultiplicador(page, name);

    await rowWith(page, name).locator(".mdi-pencil").click();
    const drawer = openDrawer(page, `Modificar ${name}`);
    await drawer.getByRole("checkbox", { name: "Estado: Activo" }).uncheck();
    await expect(drawer.getByRole("checkbox", { name: "Estado: Inactivo" })).not.toBeChecked();
    await drawer.getByRole("button", { name: "Actualizar" }).click();

    await acknowledge(page, /actualización correcta/i);
    await expect(rowWith(page, name)).toHaveCount(0);
  });
});

test.describe("Tipo de teléfono", () => {
  test("a filter with no matches ends with an empty list", async ({ page }) => {
    await page.goto("/home/tipo_telefono/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "FILTRAR" }).click();
    const drawer = openDrawer(page, "Filtrar Registros");
    await drawer.getByLabel("Nombre", { exact: true }).fill(uniqueName("sin resultados"));
    await drawer.getByRole("radio", { name: "Inactivo" }).check();
    await drawer.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, "No se encontraron registros");
    await expect(drawer).toBeHidden();
    await expect(page.getByText("No data available")).toBeVisible();
  });

  test("a code that already exists is refused and only the first one is saved", async ({ page }) => {
    const code = randomLetters(3);
    const codeRows = page.getByRole("row").filter({ has: page.getByRole("cell", { name: code, exact: true }) });
    await page.goto("/home/tipo_telefono/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "NUEVO" }).click();
    const drawer = openDrawer(page, "Nuevo tipo teléfono");
    await drawer.getByLabel("Código (*)", { exact: true }).fill(code);
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill(uniqueName("tel"));
    await drawer.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, /registro correcto/i);
    await expect(drawer).toBeHidden();
    await expect(codeRows).toHaveCount(1);

    await page.getByRole("button", { name: "NUEVO" }).click();
    await drawer.getByLabel("Código (*)", { exact: true }).fill(code);
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill(uniqueName("tel repetido"));
    await drawer.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, `Ya existe un registro con el código ${code}`);
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Cerrar" }).click();
    await expect(codeRows).toHaveCount(1);
  });
});

test.describe("Tipos de documento", () => {
  test("Nuevo starts empty after viewing a document type and leaving the screen", async ({ page }) => {
    const name = uniqueName("doc");
    await page.goto("/home/document/list");
    await waitForPageToSettle(page);
    await rowWith(page, "Documento Nacional de Identidad").locator(".mdi-eye").click();
    const viewDrawer = openDrawer(page, "Ver: DNI");
    await expect(viewDrawer.getByLabel("Descripción Larga", { exact: true })).toHaveValue("Documento Nacional de Identidad");
    await viewDrawer.getByRole("button", { name: "Cerrar" }).click();

    await leaveThroughMenuAndComeBack(page, { to: "TIPO DE TELEFONO", backTo: "TIPOS DE DOCUMENTOS DE IDENTIDAD" });
    await expect(page).toHaveURL(/\/home\/document\/list$/);
    await page.getByRole("button", { name: "Nuevo" }).click();

    const drawer = openDrawer(page, "Nuevo Tipo de Documento");
    await expect(drawer.getByLabel("Nombre (Descripción Corta) (*)", { exact: true })).toHaveValue("");
    await expect(drawer.getByLabel("Descripción Larga (*)", { exact: true })).toHaveValue("");
    await expect(drawer.getByRole("checkbox", { name: "Estado: Activo" })).toBeChecked();
    await drawer.getByLabel("Nombre (Descripción Corta) (*)", { exact: true }).fill(name);
    await drawer.getByLabel("Descripción Larga (*)", { exact: true }).fill(`${name} descripción`);
    await drawer.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, /registro correcto/i);
    await expect(drawer).toBeHidden();
    await searchList(page, name);
    await expect(rowWith(page, name)).toContainText("Activo");
  });
});
