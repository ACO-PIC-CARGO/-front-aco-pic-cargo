import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickFirstOption, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const LOADING_TEXT = "Cargando Datos, espere un momento por favor...";

const incotermRow = (page, name) =>
  page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) });

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

const inputsWithValue = (page, value) =>
  page.locator("input").evaluateAll((inputs, text) => inputs.filter((input) => input.value === text).length, value);

async function openCostsOf(page, incoterm) {
  await incotermRow(page, incoterm).locator(".mdi-pencil").click();
  await expect(page.getByText(`ACTUALIZAR COSTOS - Importación | Marítimo / LCL | ${incoterm}`)).toBeVisible();
  await expect(page.getByText(LOADING_TEXT).first()).toBeHidden();
}

test.describe("Costos predefinidos", () => {
  test("a cost added to an incoterm is listed when the incoterm is opened again", async ({ page }) => {
    const concept = `E2E N101 COSTO ${Date.now()}`;
    await page.goto("/home/configuracion/costos");
    await waitForPageToSettle(page);
    await pickOption(page, "Modalidad", "Importación");
    await pickOption(page, "Tipo Mercancía", /\/ LCL$/);
    await page.getByRole("button", { name: "Obtener Datos" }).click();
    await expect(incotermRow(page, "CPT"), "an incoterm with no costs is listed too").toBeVisible();

    await openCostsOf(page, "CFR");
    await page.getByRole("button", { name: /^Añadir Costo/ }).first().click();
    const newCost = outsideInert(page, page.getByRole("dialog").filter({ hasText: "Nuevo Costo" }));
    await pickFirstOption(page, "Servicio Asociado");
    await pickFirstOption(page, "Proveedor");
    await pickFirstOption(page, "Multiplicador");
    await newCost.getByLabel("Concepto", { exact: true }).fill(concept);
    await newCost.getByLabel("Precio", { exact: true }).fill("12");
    const minimum = newCost.getByLabel("Valor Mínimo", { exact: true });
    if (await minimum.isVisible()) await minimum.fill("0");
    await newCost.getByRole("button", { name: "Aceptar" }).click();
    await expect(newCost).toBeHidden();
    await page.getByRole("button", { name: "Guardar" }).click();
    await acknowledge(page, "Guardamos los costos del incoterm.");

    await openCostsOf(page, "CFR");
    await expect.poll(() => inputsWithValue(page, concept)).toBe(1);

    await page.evaluate((text) => {
      const input = [...document.querySelectorAll("input")].find((element) => element.value === text);
      input.closest("tr").querySelector(".mdi-delete").closest("button").click();
    }, concept);
    await page.getByRole("button", { name: "Sí, eliminar para siempre" }).click();
    await acknowledge(page, "Registro Eliminado.");
    await expect.poll(() => inputsWithValue(page, concept)).toBe(0);
  });

  test("Cancelar can be reached with the mouse wheel and closes the costs dialog", async ({ page }) => {
    await page.goto("/home/configuracion/costos");
    await waitForPageToSettle(page);
    await pickOption(page, "Modalidad", "Importación");
    await pickOption(page, "Tipo Mercancía", /\/ LCL$/);
    await page.getByRole("button", { name: "Obtener Datos" }).click();
    await openCostsOf(page, "CFR");

    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 20000);
    const cancel = page.getByRole("button", { name: "Cancelar" });
    await expect(cancel).toBeInViewport();
    await cancel.click();
    await expect(page.getByText("ACTUALIZAR COSTOS - Importación | Marítimo / LCL | CFR")).toBeHidden();
  });
});

test.describe("Profit de costos", () => {
  test("choosing Sentido after Tipo de Embarque shows the incoterms and leaves the screen usable", async ({ page }) => {
    await page.goto("/home/pricing/profit/registro");
    await waitForPageToSettle(page);

    await pickOption(page, "Tipo de Embarque", /\/ LCL$/);
    await pickOption(page, "Sentido", "Importación");

    const fob = page.getByRole("row").filter({ hasText: /^FOB - / });
    await expect(fob).toBeVisible();
    await expect(page.getByText(LOADING_TEXT).first()).toBeHidden();
    await fob.locator(".mdi-pencil").click();
    await expect(page.getByRole("tab", { name: /Individual/ })).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
  });
});

test.describe("Estatus por defecto", () => {
  const LABEL = "Estatus por defecto para cotizaciones";
  const currentStatus = (page) => page.locator(".v-chip").filter({ hasText: "Estatus actual:" }).textContent();

  async function chooseAndSave(page, name) {
    await pickOption(page, LABEL, name);
    await page.getByRole("button", { name: "Guardar Configuración" }).click();
    await acknowledge(page, "Guardamos el estatus por defecto.");
    await expect(page.getByText(`Estatus actual: ${name}`)).toBeVisible();
  }

  test("the company's statuses are listed and the chosen one is saved as the default", async ({ page }) => {
    await page.goto("/home/folderConfig/estatus_defecto");
    await waitForPageToSettle(page);
    const original = (await currentStatus(page)).replace("Estatus actual:", "").trim();

    await outsideInert(page, page.getByRole("combobox", { name: LABEL, exact: true })).click({ force: true });
    const options = outsideInert(page, page.getByRole("option"));
    await expect(options.first()).toBeVisible();
    const names = (await options.allTextContents()).map((name) => name.trim());
    await page.keyboard.press("Escape");
    const other = names.find((name) => name !== original);

    try {
      await chooseAndSave(page, other);
    } finally {
      await chooseAndSave(page, original);
    }
  });
});

test.describe("Texto WhatsApp", () => {
  test("saving the LCL text and then the FCL text keeps both", async ({ page }) => {
    const marker = `E2E N101 ${Date.now()}`;
    const lclField = () => page.getByRole("textbox", { name: "Texto para envío de PDF - INDIVIDUAL" });
    const fclField = () => page.getByRole("textbox", { name: /^Texto para envío de PDF \|.*\| INDIVIDUAL$/ }).first();
    const saveVisibleTab = async () => {
      await page.locator(".v-window-item--active").getByRole("button", { name: "Guardar" }).click();
      await acknowledge(page, "Actualización Correcta.");
    };
    const openTab = async (name) => {
      await page.getByRole("tab", { name }).click();
      await expect(name === "LCL" ? lclField() : fclField()).toBeVisible();
    };
    await page.goto("/home/configuracion/texto_whatsapp_cotizacion");
    await waitForPageToSettle(page);
    await openTab("LCL");
    const originalLcl = await lclField().inputValue();
    await openTab("FCL");
    const originalFcl = await fclField().inputValue();

    try {
      await openTab("LCL");
      await lclField().fill(`${marker} LCL`);
      await saveVisibleTab();
      await openTab("FCL");
      await fclField().fill(`${marker} FCL`);
      await saveVisibleTab();

      await page.reload();
      await waitForPageToSettle(page);
      await openTab("LCL");
      await expect(lclField()).toHaveValue(`${marker} LCL`);
      await openTab("FCL");
      await expect(fclField()).toHaveValue(`${marker} FCL`);
    } finally {
      await openTab("LCL");
      await lclField().fill(originalLcl);
      await saveVisibleTab();
      await openTab("FCL");
      await fclField().fill(originalFcl);
      await saveVisibleTab();
    }
  });
});
