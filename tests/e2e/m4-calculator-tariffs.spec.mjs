import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures.mjs";
import { outsideInert } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const OPTIONS_SCREEN = "/home/calculadora/configuracion_opciones";
const TARIFFS_SCREEN = "/home/ServiciosCostosFijosLCL";

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const alertWith = (page, text) => page.getByRole("dialog").filter({ hasText: text });

async function acknowledge(page, text) {
  const alert = alertWith(page, text);
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

async function openBulkUpload(page) {
  await page.goto(TARIFFS_SCREEN);
  await waitForPageToSettle(page);
  await page.getByRole("tab", { name: "Carga Masiva Flete" }).click();
}

async function processSheet(page, name) {
  await outsideInert(page, page.getByLabel("Excel", { exact: true })).setInputFiles(fixture(name));
  await page.getByRole("button", { name: "Procesar" }).click();
}

test.describe("Configuración de opciones (S745)", () => {
  test("a volume limit above the top freight bracket is refused with the reason and the edit stays open", async ({ page }) => {
    await page.goto(OPTIONS_SCREEN);
    await waitForPageToSettle(page);
    const individual = page.getByRole("row").filter({ has: page.getByText("Individual", { exact: true }) });
    await individual.getByRole("button", { name: "Editar" }).click();
    const volume = individual.getByLabel("Volumen máximo");
    await volume.fill("30");
    await individual.getByRole("button", { name: "Guardar" }).click();

    await acknowledge(page, "no puede pasar de 15 m³");
    await expect(volume).toHaveValue("30");
    await expect(individual.getByRole("button", { name: "Guardar" })).toBeVisible();
  });
});

test.describe("Carga masiva de fletes (S734)", () => {
  test("every processed row shows its own verdict, whatever the column order", async ({ page }) => {
    test.setTimeout(90_000);
    await openBulkUpload(page);
    const validation = page.waitForResponse(/calc\/val_data_lcl/);
    await processSheet(page, "fletes-lcl-observados.xlsx");
    await validation;

    const rowFor = (port) => page.getByRole("row").filter({ hasText: port });
    await expect(rowFor("NINGBO").first()).toContainText("Correcto");
    await expect(page.getByText("Fila 3: no reconocemos el país de origen «Narnia».")).toBeVisible();
    await expect(page.getByText("Fila 4: el flete de 5.01 a 10 m³ debe ser un número mayor que 0.")).toBeVisible();
    await expect(page.getByText("Fila 5: el flete de 0.1 a 5 m³ debe ser un número mayor que 0.")).toBeVisible();
    await expect(page.getByText("Fila 6: la vigencia 01/03/2001 ya pasó; usa una fecha de hoy en adelante.")).toBeVisible();
  });

  test("a file without the required headers is refused naming them, before anything is sent", async ({ page }) => {
    await openBulkUpload(page);
    let validated = false;
    page.on("request", (request) => {
      if (request.url().includes("calc/val_data_lcl")) validated = true;
    });

    await processSheet(page, "fletes-lcl-sin-vigencia.xlsx");

    await acknowledge(page, "Agrega las columnas flete_5_10, vigencia");
    expect(validated).toBe(false);
  });
});

test.describe("Fletes grupales (S734)", () => {
  test("deleting a sale tariff deactivates the sale tariff and never touches the purchase one", async ({ page }) => {
    const sent = [];
    // Both endpoints are answered here so the shared local data stays as it was.
    await page.route(/calc\/flete\/grupal(_venta)?\/actualizar$/, async (route) => {
      sent.push({ url: route.request().url(), body: route.request().postDataJSON() });
      await route.fulfill({ json: { status: 200, estadoflag: true, mensaje: "Actualización Correcta", tipomensaje: "TMSGINF", data: [] } });
    });
    await page.goto(TARIFFS_SCREEN);
    await waitForPageToSettle(page);
    await page.getByRole("tab", { name: "Listado Fletes Grupal" }).click();
    await page.getByRole("tab", { name: "Venta" }).click();

    await page.getByRole("button", { name: "Eliminar tarifa de venta" }).first().click();
    await alertWith(page, "¿Deseas eliminar esta tarifa?").getByRole("button", { name: "Sí, eliminar" }).click();
    await acknowledge(page, "Actualización Correcta");

    expect(sent).toHaveLength(1);
    expect(sent[0].url).toMatch(/calc\/flete\/grupal_venta\/actualizar$/);
    expect(sent[0].body).toMatchObject({ estado: false });
  });
});
