import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const uniqueName = (label) => `E2E N100 ${label} ${Date.now()}`;
const randomLetters = (length) =>
  Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");

const openDrawer = (page, title) => outsideInert(page, page.getByRole("navigation").filter({ hasText: title }));
const rowWith = (page, text) => page.getByRole("row").filter({ hasText: text });

const TYPES = [
  { screen: "Tipos de gastos", route: "/home/gastos/list", menu: "TIPOS DE GASTOS", sibling: "SUB TIPO DE GASTO", newTitle: "Nuevo Tipo de Gasto", noun: "tipo de gasto" },
  { screen: "Tipos de ingresos", route: "/home/ingreso/list", menu: "TIPOS DE INGRESOS", sibling: "SUB TIPO DE INGRESOS", newTitle: "Nuevo Tipo de Ingreso", noun: "tipo de ingreso" },
];
const SUB_TYPES = [
  { screen: "Sub tipo de gasto", route: "/home/sub_gasto/list", parentLabel: "Tipo de Gasto (*)", parent: "GASTOS FIJOS", newTitle: "Nuevo Tipo de Subgasto", editTitle: "Modificar Tipo Subgasto", noun: "subtipo de gasto" },
  { screen: "Sub tipo de ingresos", route: "/home/sub_ingreso/listado", parentLabel: "Tipo de Ingreso (*)", parent: "OTROS INGRESOS", newTitle: "Nuevo Tipo de Subingreso", editTitle: "Modificar Tipo de Subingreso", noun: "subtipo de ingreso" },
];

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

async function openFromMenu(page, group, link) {
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("treeitem", { name: group.module }).click();
  await page.getByRole("treeitem", { name: group.name }).click();
  await page.getByRole("link", { name: link, exact: true }).click();
  await waitForPageToSettle(page);
}

const ACCOUNTS_AND_BANKS = { module: "FICHEROS", name: "CUENTAS Y BANCOS" };

async function leaveThroughMenuAndComeBack(page, { to, backTo }) {
  await openFromMenu(page, ACCOUNTS_AND_BANKS, to);
  await page.getByRole("link", { name: backTo, exact: true }).click();
  await waitForPageToSettle(page);
}

async function createType(page, type, { code, description, active = true }) {
  await page.getByRole("button", { name: "Nuevo" }).click();
  const drawer = openDrawer(page, type.newTitle);
  await drawer.getByLabel("Código (*)", { exact: true }).fill(code);
  await drawer.getByLabel("Descripción (*)", { exact: true }).fill(description);
  if (!active) await drawer.getByRole("checkbox", { name: "Estado: Activo" }).uncheck();
  await drawer.getByRole("button", { name: "Aceptar" }).click();
  await acknowledge(page, /registro correcto/i);
  await expect(drawer).toBeHidden();
  return drawer;
}

for (const type of TYPES) {
  test.describe(type.screen, () => {
    test("Nuevo starts empty after viewing a type and leaving the screen, and saves", async ({ page }) => {
      const description = uniqueName("tipo");
      await page.goto(type.route);
      await waitForPageToSettle(page);
      await page.getByRole("row").nth(1).locator(".mdi-eye").click();
      const viewDrawer = openDrawer(page, "Ver:");
      await expect(viewDrawer.getByLabel("Código", { exact: true })).not.toHaveValue("");
      await viewDrawer.getByRole("button", { name: "Cerrar" }).click();

      await leaveThroughMenuAndComeBack(page, { to: type.sibling, backTo: type.menu });
      await expect(page).toHaveURL(new RegExp(`${type.route}$`));
      await page.getByRole("button", { name: "Nuevo" }).click();

      const drawer = openDrawer(page, type.newTitle);
      await expect(drawer.getByLabel("Código (*)", { exact: true })).toHaveValue("");
      await expect(drawer.getByLabel("Descripción (*)", { exact: true })).toHaveValue("");
      await expect(drawer.getByRole("checkbox", { name: "Estado: Activo" })).toBeChecked();
      await drawer.getByLabel("Código (*)", { exact: true }).fill(randomLetters(5));
      await drawer.getByLabel("Descripción (*)", { exact: true }).fill(description);
      await drawer.getByRole("button", { name: "Aceptar" }).click();
      await acknowledge(page, /registro correcto/i);
      await expect(drawer).toBeHidden();

      await page.getByRole("textbox", { name: "Buscar" }).fill(description);
      await expect(rowWith(page, description)).toContainText("Activo");
    });

    test("a code the company already uses is refused with a message naming it", async ({ page }) => {
      const code = randomLetters(5);
      await page.goto(type.route);
      await waitForPageToSettle(page);
      await createType(page, type, { code, description: uniqueName("original") });

      await page.getByRole("button", { name: "Nuevo" }).click();
      const drawer = openDrawer(page, type.newTitle);
      await drawer.getByLabel("Código (*)", { exact: true }).fill(code.toLowerCase());
      await drawer.getByLabel("Descripción (*)", { exact: true }).fill(uniqueName("repetido"));
      await drawer.getByRole("button", { name: "Aceptar" }).click();

      await expect(drawer).toContainText(`Ya existe un ${type.noun} con el código ${code}`);
      await expect(drawer).toBeVisible();
    });
  });
}

for (const subType of SUB_TYPES) {
  test.describe(subType.screen, () => {
    test("a saved sub type closes the panel and its code cannot be used again", async ({ page }) => {
      const code = randomLetters(5);
      const description = uniqueName("subtipo");
      await page.goto(subType.route);
      await waitForPageToSettle(page);

      await page.getByRole("button", { name: "NUEVO" }).click();
      const drawer = openDrawer(page, subType.newTitle);
      await pickOption(page, subType.parentLabel, subType.parent);
      await drawer.getByLabel("Código (*)", { exact: true }).fill(code);
      await drawer.getByLabel("Descripción (*)", { exact: true }).fill(description);
      await drawer.getByRole("button", { name: "Aceptar" }).click();
      await acknowledge(page, /registro correcto/i);
      await expect(drawer).toBeHidden();
      await page.getByRole("textbox", { name: "Buscar" }).fill(description);
      await expect(rowWith(page, description)).toHaveCount(1);

      await page.getByRole("button", { name: "NUEVO" }).click();
      await pickOption(page, subType.parentLabel, subType.parent);
      await drawer.getByLabel("Código (*)", { exact: true }).fill(code.toLowerCase());
      await drawer.getByLabel("Descripción (*)", { exact: true }).fill(uniqueName("repetido"));
      await drawer.getByRole("button", { name: "Aceptar" }).click();

      await expect(drawer).toContainText(`Ya existe un ${subType.noun} con el código ${code}`);
      await expect(drawer).toBeVisible();
    });

    test("editing a sub type cannot move it to another type", async ({ page }) => {
      await page.goto(subType.route);
      await waitForPageToSettle(page);

      await page.getByRole("row").nth(1).locator(".mdi-pencil").click();
      const drawer = openDrawer(page, subType.editTitle);

      await expect(drawer.getByRole("combobox", { name: subType.parentLabel, exact: true })).not.toBeEditable();
    });
  });
}

test.describe("Proyección de gastos", () => {
  test("Nueva proyección offers active expense types only", async ({ page }) => {
    const active = uniqueName("activo");
    const inactive = uniqueName("inactivo");
    await page.goto("/home/gastos/list");
    await waitForPageToSettle(page);
    await createType(page, TYPES[0], { code: randomLetters(5), description: active });
    await createType(page, TYPES[0], { code: randomLetters(5), description: inactive, active: false });

    await page.goto("/home/folderModulesPays/nuevaProyeccion");
    await waitForPageToSettle(page);
    await page.getByRole("textbox", { name: "Tipo Cambio" }).fill("3.7");
    const expenseTypes = outsideInert(page, page.getByRole("listbox"));
    await expect(async () => {
      if (!(await expenseTypes.isVisible())) await page.locator(".v-data-table tbody .v-field").first().click();
      await expect(expenseTypes).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    // The select renders a virtual list: newest types sit at the end, so scroll to it before looking.
    await expect(async () => {
      await expenseTypes.evaluate((list) => list.scrollTo(0, list.scrollHeight));
      await expect(page.getByRole("option", { name: active })).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByRole("option", { name: inactive })).toHaveCount(0);
  });
});

test.describe("Cuentas por pagar", () => {
  test("its Sub Gasto filter ignores the filter left on the Sub tipo de gasto catalog", async ({ page }) => {
    await page.goto("/home/sub_gasto/list");
    await waitForPageToSettle(page);
    await page.getByRole("button", { name: "FILTRAR" }).click();
    const filter = openDrawer(page, "Filtrar Registros");
    await filter.getByLabel("Código", { exact: true }).fill(randomLetters(5));
    await filter.getByRole("button", { name: "Aceptar" }).click();
    await acknowledge(page, /no se encontraron registros/i);

    // In-app navigation keeps the Pinia stores, as moving through the menu does.
    await page.evaluate(() => {
      history.pushState(null, "", "/home/folderRequest/debstopay");
      dispatchEvent(new PopStateEvent("popstate", { state: null }));
    });
    await expect(page).toHaveURL(/debstopay$/);
    await waitForPageToSettle(page);
    await page.getByRole("button", { name: /FILTRAR/ }).click();
    await page.getByRole("combobox", { name: "Sub Gasto", exact: true }).click({ force: true });

    await expect(page.getByRole("option", { name: "PLANILLA INTERNA" })).toBeVisible();
  });
});
