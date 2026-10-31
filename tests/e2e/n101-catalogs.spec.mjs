import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickFirstOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const LAST_SYSTEM_STATUS_CODE = 16;

const uniqueName = (label) => `E2E N101 ${label} ${Date.now()}`;
const randomLetters = (length) =>
  Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");

const openDrawer = (page, title) => outsideInert(page, page.getByRole("navigation").filter({ hasText: title }));
const rowWith = (page, text) => page.getByRole("row").filter({ hasText: text });

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  const text = await alert.textContent();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
  return text;
}

async function searchList(page, text) {
  await page.getByRole("textbox", { name: "Buscar" }).fill(text);
}

test.describe("Estados de cotización", () => {
  test("a new status gets a code after the ones quotes rely on and keeps its temperature after an edit", async ({ page }) => {
    const name = uniqueName("estado");
    await page.goto("/home/quote_status/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "NUEVO" }).click();
    const drawer = openDrawer(page, "Nuevo estado");
    await drawer.getByLabel("Nombre (*)", { exact: true }).fill(name);
    await pickFirstOption(page, "Temperatura de Lead");
    await drawer.getByRole("button", { name: "Aceptar" }).click();

    const answer = await acknowledge(page, /registro correcto/i);
    expect(Number(/código: (\d+)/i.exec(answer)[1])).toBeGreaterThan(LAST_SYSTEM_STATUS_CODE);
    await expect(drawer).toBeHidden();
    await searchList(page, name);
    const temperature = (await rowWith(page, name).getByRole("cell").nth(2).textContent()).trim();
    expect(temperature).not.toBe("");

    await rowWith(page, name).locator(".mdi-pencil").click();
    const editDrawer = openDrawer(page, `Modificar Estado: ${name}`);
    await editDrawer.getByLabel("Descripción", { exact: true }).fill("Editado por E2E");
    await editDrawer.getByRole("button", { name: "Aceptar" }).click();

    await acknowledge(page, /actualización correcta/i);
    await expect(editDrawer).toBeHidden();
    await expect(rowWith(page, name).getByRole("cell").nth(2)).toHaveText(temperature);
  });
});

test.describe("Aerolíneas", () => {
  test("a double click on Aceptar creates the airline once", async ({ page }) => {
    const name = uniqueName("aerolínea");
    await page.goto("/home/airlines/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "NUEVO" }).click();
    const drawer = openDrawer(page, "Nueva Aerolínea");
    await pickFirstOption(page, "Pais (*)");
    await drawer.getByLabel("Código IATA (*)", { exact: true }).fill(`E${randomLetters(4)}`);
    await drawer.getByLabel("Código ICAO (*)", { exact: true }).fill(`E${randomLetters(5)}`);
    await drawer.getByLabel("Nombre", { exact: true }).fill(name);
    await drawer.getByRole("button", { name: "Aceptar" }).dblclick();

    await acknowledge(page, /registro correcto/i);
    await expect(drawer).toBeHidden();
    await searchList(page, name);
    await expect(rowWith(page, name)).toHaveCount(1);
  });
});

test.describe("Motonaves", () => {
  test("a filter cleared with the X still lists the motonaves", async ({ page }) => {
    await page.goto("/home/motonave/listado");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "FILTRAR" }).click();
    const filter = openDrawer(page, "Filtrar Registros");
    await filter.getByLabel("Nombre", { exact: true }).fill("msc");
    await filter.locator(".v-input").filter({ hasText: "Nombre" }).locator(".v-field__clearable .v-icon").click({ force: true });

    const listed = page.waitForResponse((response) => response.url().includes("listar_motonave"));
    await filter.getByRole("button", { name: "Aceptar" }).click();
    const response = await listed;

    expect(response.url()).not.toContain("null");
    expect((await response.json()).estadoflag).toBe(true);
    await expect(filter).toBeHidden();
    await expect(page.getByRole("row")).not.toHaveCount(1);
  });
});

test.describe("Tipos de marketing", () => {
  test("Exportar with every status downloads the workbook", async ({ page }) => {
    await page.goto("/home/marketing/list");
    await waitForPageToSettle(page);
    await page.getByRole("button", { name: "Filtrar" }).click();
    const filter = openDrawer(page, "Filtrar Registros");
    await filter.getByRole("radio", { name: "Todos", exact: true }).check();
    await filter.getByRole("button", { name: "Aceptar" }).click();
    await expect(filter).toBeHidden();

    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar" }).click();
    const download = await downloading;

    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    expect(readFileSync(await download.path()).subarray(0, 2).toString()).toBe("PK");
  });
});
