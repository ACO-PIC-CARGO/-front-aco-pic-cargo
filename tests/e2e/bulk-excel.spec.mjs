import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const isoDate = (daysFromToday) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, "0")).join("-");
};

test("parses a tariff spreadsheet and sends its rows for validation", async ({ page }) => {
  test.setTimeout(90_000);
  // these catalog endpoints never answer on the development DB and their spinner overlay would block every click
  await page.route(/\/cargar_(moneda|sucursal|navieras|contenedores)$/, (route) =>
    route.fulfill({ json: { estadoflag: true, mensaje: "", tipomensaje: "", data: [] } })
  );
  await page.goto("/home/folterCargaMasiva/carga_calculadora");
  await waitForPageToSettle(page);
  await page.getByLabel("LCL").check({ force: true });
  await page.getByLabel("Excel", { exact: true }).setInputFiles(fixture("tarifas-lcl.xlsx"));
  const validation = page.waitForRequest(/validar_registros_lcl/);
  await page.getByRole("button", { name: "Procesar" }).click();
  const sent = (await validation).postDataJSON();
  expect(sent).toMatchObject({
    pais_origen: ["CHINA"],
    puerto_origen: ["SHANGHAI"],
    pais_destino: ["CHILE"],
    puerto_destino: ["VALPARAISO"],
    costo: [40],
    moneda: ["USD"],
    agente: ["E2E AGENTE"],
    vigencia_desde: ["2026-01-01"],
    vigencia_hasta: ["2026-12-31"],
  });
});

test("reads an order spreadsheet into the bulk expense table", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/home/folterCargaMasiva/carga_control_gastos");
  await page.getByRole("button", { name: "Crear un nuevo expediente" }).click();
  await waitForPageToSettle(page);
  await page.getByLabel("Nombre de la campaña").fill(`E2E ${Date.now()}`);
  await page.getByLabel("Porcentaje Cuota-1").fill("34");
  await page.getByLabel("Porcentaje Cuota-2").fill("33");
  await page.getByLabel("Porcentaje Cuota-3").fill("33");
  for (const n of [1, 2, 3]) await page.getByLabel(`Fecha de pago ${n}`).fill(isoDate(n * 30));
  await page.getByRole("button", { name: "Subir Archivo" }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByText("Arrastra y suelta archivos aquí").click();
  await (await chooser).setFiles(fixture("pedido-gastos.xlsx"));
  await expect(page.getByText("Listado de Datos Obtenidos")).toBeVisible();
  const parsedRow = page.getByRole("row").filter({ hasText: "pedido-gastos.xlsx" });
  await expect(parsedRow).toHaveCount(1);
  await expect(parsedRow.getByRole("cell", { name: "Juan", exact: true })).toBeVisible();
  await expect(parsedRow.getByRole("cell", { name: "Perez", exact: true })).toBeVisible();
  await expect(parsedRow.getByRole("cell", { name: "Lopez", exact: true })).toBeVisible();
  await expect(parsedRow.getByRole("cell", { name: "999888777", exact: true })).toBeVisible();
  await expect(parsedRow.getByRole("cell", { name: "150.00", exact: true })).toBeVisible();
  await expect(parsedRow.getByRole("cell", { name: "3", exact: true })).toBeVisible();
});
