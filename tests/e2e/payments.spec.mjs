import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures.mjs";
import { pickFirstOption, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const PAYMENT_DATA = {
  supplier: "ALEXIS DÍAZ (1)",
  expenseGroup: "GASTOS FIJOS",
  subExpense: "LUZ DEL SUR",
  currency: "USD",
  bankAccount: "USD-BCP, CUENTA EN: Dólares, N° CUENTA: 192-2190795-1-50",
  client: "RAMIREZ CARLOS (6)",
};
const SUPPORT_FILE = fileURLToPath(new URL("./fixtures/soporte.pdf", import.meta.url));

const isSave = (endpoint, method) => (response) =>
  response.url().endsWith(`/${endpoint}`) && response.request().method() === method;

async function captureSaveResponse(page, endpoint) {
  let resolveBody;
  const body = new Promise((resolve) => (resolveBody = resolve));
  await page.route(new RegExp(`/${endpoint}$`), async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const response = await route.fetch();
    resolveBody({ ok: response.ok(), json: await response.json() });
    await route.fulfill({ response });
  });
  return body;
}

async function pickToday(page, label) {
  await page.getByLabel(label).click();
  await page.getByRole("grid").getByText(String(new Date().getDate()), { exact: true }).click();
}

async function uploadSupport(page) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByText("Arrastra y suelta el archivo aquí o haz clic para seleccionar").click();
  await (await chooser).setFiles(SUPPORT_FILE);
  await expect(page.getByText("Archivo Cargado:")).toBeVisible();
}

test("registers an administrative payable and pays it from banks", async ({ page }) => {
  test.setTimeout(300_000);
  const invoice = `E2E${Date.now()}`;

  await page.goto("/home/folderModulesPays/controlAccountPays");
  await waitForPageToSettle(page);
  await page.goto("/home/folderModulesPays/addmodulesAccountPays");
  await waitForPageToSettle(page);
  await page.getByText("Administrativa", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Administrativa" })).toBeChecked();
  await pickFirstOption(page, "Mes del Gasto");
  await pickFirstOption(page, "Año del Gasto");
  await page.getByPlaceholder("Seleccione un Sub Gasto").click();
  await page.getByText(PAYMENT_DATA.expenseGroup, { exact: true }).click();
  await page.getByText(PAYMENT_DATA.subExpense, { exact: true }).click();
  await pickFirstOption(page, "Tipo de Comprobante");
  await pickOption(page, "Proveedor", PAYMENT_DATA.supplier);
  await page.getByLabel("Nro. de Factura").fill(invoice);
  await page.getByLabel("Nro. de Serie").fill("E2E");
  await pickOption(page, "Moneda", PAYMENT_DATA.currency);
  await page.getByRole("button", { name: "Añadir Concepto de Pago" }).click();
  const concept = page.getByRole("dialog").filter({ hasText: "Cargar Conceptos a Pagar" });
  await concept.getByLabel("Producto/ Concepto").fill("Servicio e2e");
  await concept.getByLabel("Monto").fill("100");
  await concept.getByText("No Afecto").click();
  await concept.getByRole("button", { name: "Aceptar" }).click();
  await expect(page.getByRole("button", { name: "GUARDAR CUENTA POR PAGAR" })).toBeEnabled();
  await uploadSupport(page);
  const payableSaved = captureSaveResponse(page, "setInvoiceAdmin");
  await page.getByRole("button", { name: "GUARDAR CUENTA POR PAGAR" }).click();
  const saved = await payableSaved;
  expect(saved.ok, "setInvoiceAdmin response").toBe(true);
  expect(saved.json.data[0].estadoflag, "setInvoiceAdmin estadoflag").toBe(true);

  await expect(page).toHaveURL(/\/home\/folderModulesPays\/controlAccountPays$/);
  await waitForPageToSettle(page);
  await page.getByLabel("Buscar", { exact: true }).fill(invoice);
  await expect(page.getByRole("row").filter({ hasText: invoice })).toHaveCount(1);

  await page.goto("/home/FolderBanks/registroPayForProveedor");
  await waitForPageToSettle(page);
  await pickOption(page, "Proveedor", PAYMENT_DATA.supplier);
  await pickOption(page, "Cuenta de Salida de Banco", PAYMENT_DATA.bankAccount);
  const confirmPayment = page.getByRole("dialog").filter({ hasText: "Confirmar Pago" });
  await confirmPayment.getByLabel("Monto debitado en el banco").fill("100");
  await confirmPayment.getByRole("button", { name: "CONTINUAR" }).click();
  await page.getByLabel("Buscar Expediente").fill(invoice);
  const invoiceRow = page.getByRole("row").filter({ hasText: invoice });
  await expect(invoiceRow).toHaveCount(1);
  const select = invoiceRow.getByRole("checkbox", { name: /Seleccionar factura/ });
  await select.click();
  await expect(select).toBeChecked();
  await expect(page.getByLabel("Total Factura Seleccionada", { exact: true })).toHaveValue("100.00");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  await pickToday(page, "Fecha Operación");
  await page.getByLabel("Número de Operación").fill(invoice);
  await uploadSupport(page);
  await page.getByRole("button", { name: "Continue" }).click();
  const paymentSaved = page.waitForResponse(isSave("registro_egresos", "POST"));
  await page.getByRole("button", { name: "Finalizar Operación" }).click();
  const payment = await paymentSaved;
  expect(payment.ok(), "registro_egresos response").toBe(true);
  const paymentBody = await payment.json();
  expect(paymentBody.data[0].estadoflag, "registro_egresos estadoflag").toBe(true);
  expect(paymentBody.data[0].v_id, "payment id from the save response").toBeTruthy();
  await expect(page.getByRole("button", { name: "Imprimir comprobante" })).toBeVisible({ timeout: 30_000 });
  await page.goto("/home/FolderBanks/listadoPagosPorProveedor");
  await waitForPageToSettle(page);
  await page.getByLabel("Buscar", { exact: true }).fill(invoice);
  await expect(page.getByRole("row").filter({ hasText: invoice })).toHaveCount(1);
});

test("registers an administrative receivable", async ({ page }) => {
  test.setTimeout(90_000);
  const invoice = `E2E${Date.now()}`;

  await page.goto("/home/folderModulesPays/moduleAccountReceivable");
  await waitForPageToSettle(page);
  await page.goto("/home/viewAccountPaysCxC/controlAccountReceivable");
  await waitForPageToSettle(page);
  await expect(page.getByText("NUEVA CUENTA POR COBRAR")).toBeVisible();
  await page.getByText("Administrativa", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Administrativa" })).toBeChecked();
  await pickFirstOption(page, "Mes del Ingreso");
  await pickFirstOption(page, "Año del Ingreso");
  await pickFirstOption(page, "Tipo de Ingreso");
  await pickFirstOption(page, "Subtipo de Ingreso");
  await pickFirstOption(page, "Tipo de Comprobante");
  await pickOption(page, "Cliente", PAYMENT_DATA.client);
  await page.getByLabel("Nro. de Factura").fill(invoice);
  await page.getByLabel("Nro. de Serie").fill("E2E");
  await pickOption(page, "Moneda", PAYMENT_DATA.currency);
  await page.getByRole("button", { name: "Añadir Concepto de Cobro" }).click();
  const concept = page.getByRole("dialog").filter({ hasText: "Añadir Producto/ Concepto" });
  await concept.getByLabel("Producto/ Concepto").fill("Cobro e2e");
  await concept.getByLabel("Monto").fill("100");
  await concept.getByRole("button", { name: "Aceptar" }).click();
  await expect(page.getByRole("button", { name: "GUARDAR CUENTA POR COBRAR" })).toBeEnabled();
  const receivableSaved = captureSaveResponse(page, "setInvoiceAdminCxC");
  await page.getByRole("button", { name: "GUARDAR CUENTA POR COBRAR" }).click();
  const receivable = await receivableSaved;
  expect(receivable.ok, "setInvoiceAdminCxC response").toBe(true);
  expect(receivable.json.data[0].estadoflag, "setInvoiceAdminCxC estadoflag").toBe(true);

  await expect(page).toHaveURL(/\/home\/folderModulesPays\/moduleAccountReceivable$/);
  await waitForPageToSettle(page);
  await page.getByLabel("Buscar", { exact: true }).fill(invoice);
  await expect(page.getByRole("row").filter({ hasText: invoice })).toHaveCount(1);
});
