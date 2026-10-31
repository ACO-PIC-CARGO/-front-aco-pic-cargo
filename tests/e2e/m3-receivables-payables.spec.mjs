import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const RECEIVABLES = "/home/folderRequest/accountsReceivable";
const PAYABLES = "/home/folderRequest/debstopay";
const DEPOSITS = "/home/folderRequest/checkDebs";
const PAYMENT_WITHOUT_REQUEST = "/home/folderRequest/controlPaymentFile";
const PAYMENT_REQUESTS = "/home/folderRequest/controlRequest";
const INVOICE_URL = "https://facturas.example.test/factura-e2e.pdf";

const json = (body) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
const accepted = (data, mensaje = null) => json({ status: 200, statusBol: true, estadoflag: true, mensaje, tipomensaje: null, data });
const refusal = (mensaje) => json({ status: 200, statusBol: true, estadoflag: false, mensaje, tipomensaje: "TMSGADV", data: [] });
const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });

const endpoint = (name) => new RegExp(`/${name}(\\?|$)`);

async function openPage(page, path, answer) {
  const loaded = page.waitForResponse((r) => answer.test(r.url()), { timeout: 90_000 });
  await page.goto(path);
  await loaded;
  await waitForPageToSettle(page, { spinnerClears: false });
}

const receivableClient = (details) => ({
  estadoflag: true,
  id_consigner: 990001,
  nameconsigner: "CLIENTE E2E L3D",
  total_llegada: "100.00",
  total_no_llegada: "0",
  total_pagar: "100.00",
  comentarios: [],
  details,
});

test.describe("accounts receivable report", () => {
  test.setTimeout(240_000);

  test("the screen, the Excel and the PDF ask for the same filters through the session", async ({ page }) => {
    await openPage(page, RECEIVABLES, endpoint("getReporteCXC"));
    await page.getByRole("button", { name: "FILTRAR" }).click();
    await page.getByRole("textbox", { name: "Fecha Hasta" }).fill("2026-10-30");
    const screen = page.waitForRequest((r) => endpoint("getReporteCXC").test(r.url()));
    await page.getByRole("button", { name: "Aceptar" }).click();
    const screenUrl = new URL((await screen).url());
    await waitForPageToSettle(page, { spinnerClears: false });

    await page.route(endpoint("reportcxcexcel"), (route) => route.fulfill(refusal("Excel de prueba: no se generó.")));
    const excel = page.waitForRequest((r) => endpoint("reportcxcexcel").test(r.url()));
    await page.getByRole("button", { name: "EXCEL" }).click();
    const excelRequest = await excel;
    await expect(dialogWith(page, "Excel de prueba: no se generó.")).toBeVisible();
    await page.locator(".swal2-confirm").click();

    await page.route(endpoint("exportarPDFCXC"), (route) => route.fulfill(refusal("PDF de prueba: no se generó.")));
    const pdf = page.waitForRequest((r) => endpoint("exportarPDFCXC").test(r.url()));
    await page.getByRole("button", { name: "PDF" }).click();
    await page.getByText("Generar PDF por Cliente").click();
    await page.getByRole("button", { name: "Generar" }).click();
    const pdfRequest = await pdf;
    await expect(dialogWith(page, "PDF de prueba: no se generó.")).toBeVisible();

    expect(screenUrl.searchParams.get("fechahasta")).toBe("2026-10-30");
    for (const exported of [excelRequest, pdfRequest]) {
      const url = new URL(exported.url());
      expect(exported.headers()["auth-token"]).toBeTruthy();
      expect(url.searchParams.get("id_branch")).toBeNull();
      expect(url.searchParams.get("fechahasta")).toBe("2026-10-30");
    }
  });

  test("the administrative total adds the tax only once", async ({ page }) => {
    await page.route(endpoint("getReporteCXCAdmin"), (route) =>
      route.fulfill(
        accepted([
          {
            estadoflag: true,
            id_consigner: 990002,
            nameconsigner: "CLIENTE ADMIN E2E",
            total_pagar: "118.00",
            details: [{ id: 1, symbol: "USD", concepto: "F-E2E", nameconsigner: "CLIENTE ADMIN E2E", monto: "118.00", igv: "18.00", total_pagar: "118.00" }],
          },
        ]),
      ),
    );
    await openPage(page, RECEIVABLES, endpoint("getReporteCXCAdmin"));

    const usd = page.getByRole("row").filter({ hasText: "USD" }).filter({ hasText: "18.00" });
    await expect(usd).toContainText("118.00");
    await expect(usd).not.toContainText("136.00");
  });

  test("a client's invoices download without sending the session to the other site", async ({ page }) => {
    await page.route(endpoint("getReporteCXC"), (route) =>
      route.fulfill(
        accepted([
          receivableClient([
            {
              id: 1,
              id_house: 1,
              symbol: "USD",
              total_pagar: "100.00",
              llegada: 1,
              nro_master: "E2E",
              facturas: [{ nro_factura: "F001-1", url_documento: INVOICE_URL }],
            },
          ]),
        ]),
      ),
    );
    await page.route(endpoint("getReporteCXCAdmin"), (route) => route.fulfill(accepted([])));
    await page.route(endpoint("reportcxcexcel"), (route) => route.fulfill(refusal("Excel de prueba: no se generó.")));
    const invoiceHeaders = [];
    await page.route(INVOICE_URL, (route) => {
      invoiceHeaders.push(route.request().headers());
      return route.fulfill({ status: 200, contentType: "application/pdf", body: "%PDF-1.4", headers: { "access-control-allow-origin": "*" } });
    });
    await openPage(page, RECEIVABLES, endpoint("getReporteCXC"));

    await page.getByRole("button", { name: "FILTRAR" }).click();
    await page.getByRole("combobox", { name: "Clientes" }).click();
    await page.getByRole("option").first().click();
    await page.getByRole("heading", { name: "FILTRO PAGOS" }).click();
    await expect(page.getByRole("listbox")).toBeHidden();
    await page.getByRole("button", { name: "Aceptar" }).click();
    await waitForPageToSettle(page, { spinnerClears: false });
    await page.getByRole("button", { name: "EXCEL" }).click();
    await page.getByRole("button", { name: "Descargar Facturas" }).click();

    await expect.poll(() => invoiceHeaders.length).toBe(1);
    expect(invoiceHeaders[0]["auth-token"]).toBeUndefined();
    expect(invoiceHeaders[0]["x-branch-id"]).toBeUndefined();
  });
});

test.describe("accounts payable report", () => {
  test.setTimeout(240_000);

  test("an unscheduled administrative account can be added to a payment schedule", async ({ page }) => {
    await page.route(endpoint("getDebsToPayAdmin"), (route) =>
      route.fulfill(
        accepted([
          {
            estadoflag: true,
            nameconsigner: "PROVEEDOR ADMIN E2E",
            pendiente_pago: "50.00",
            id_proveedor: 990003,
            details: [{ id: 77, programado: 0, symbol: "USD", nameconsigner: "PROVEEDOR ADMIN E2E", nro_factura: "FA-E2E", fecha: "2026-10-01", monto: "50.00", igv: 0, total: "50.00" }],
          },
        ]),
      ),
    );
    await openPage(page, PAYABLES, endpoint("getDebsToPayAdmin"));

    await page.getByRole("row").filter({ hasText: "PROVEEDOR ADMIN E2E" }).locator(".mdi-chevron-down").click();
    await page.getByRole("row").filter({ hasText: "FA-E2E" }).locator(".mdi-clock-outline").click();
    await page.getByRole("button", { name: "Crear una Programación Nueva" }).click();

    await expect(page.getByRole("dialog").filter({ hasText: "Programación de Pago del Proveedor" }).getByRole("row").filter({ hasText: "50.00" })).toBeVisible();
  });

  test("the Excel downloads through the session", async ({ page }) => {
    await openPage(page, PAYABLES, endpoint("getReporteCXP"));
    const sent = page.waitForRequest((r) => endpoint("reportcxpexcel").test(r.url()));
    const download = page.waitForEvent("download", { timeout: 180_000 });

    await page.getByRole("button", { name: "EXCEL" }).click();

    expect((await sent).headers()["auth-token"]).toBeTruthy();
    expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
  });
});

test.describe("hidden payment screens", () => {
  test.setTimeout(180_000);

  test("a client deposit opens the expense control of its master", async ({ page }) => {
    await page.route(/\/getDebsClientList$/, (route) =>
      route.fulfill(accepted([{ id: 5, id_master: 2701, status: 1, name: "BCP - 1 Cuenta en: USD", nro_master: 1, code_master: "E2E", nameconsigner: "CLIENTE E2E" }])),
    );
    await openPage(page, DEPOSITS, endpoint("getDebsClientList"));

    await page.getByRole("row").filter({ hasText: "CLIENTE E2E" }).locator(".mdi-pencil").click();

    await expect(page).toHaveURL(/\/folderBilling\/editControlGastos\/view\/2701\/\d+$/);
  });

  test("approving a deposit shows the server's refusal instead of a success", async ({ page }) => {
    await page.route(/\/getDebsClientList$/, (route) =>
      route.fulfill(accepted([{ id: 5, id_master: 2701, status: 1, name: "BCP", nro_master: 1, code_master: "E2E", nameconsigner: "CLIENTE E2E", monto_letra: "10 USD" }])),
    );
    let sent = null;
    await page.route(/\/setCheckDebsClient$/, (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill(refusal("Abono de prueba: no se aprobó."));
    });
    await openPage(page, DEPOSITS, endpoint("getDebsClientList"));

    await page.getByRole("row").filter({ hasText: "CLIENTE E2E" }).locator(".mdi-check-circle").click();
    await page.getByLabel("Nro operacion en Cuenta de Banco").fill("OP-E2E");
    await page.getByRole("button", { name: "Aprobar Pago" }).click();

    await expect(dialogWith(page, "Abono de prueba: no se aprobó.")).toBeVisible();
    await expect(dialogWith(page, "Abono aprobado")).toHaveCount(0);
    expect(sent).toMatchObject({ id: 5, nro_operacion: "OP-E2E" });
  });

  test("a payment without request sends the chosen concepts and shows the server's answer", async ({ page }) => {
    await page.route(/\/getHouseListAll/, (route) =>
      route.fulfill(accepted([{ id: 4574, code_master: "E2E", code_house: "H-E2E", nro_master: 1, nameconsigner: "CLIENTE E2E" }])),
    );
    await page.route(/\/getEgresosExpediente\/4574$/, (route) =>
      route.fulfill(accepted([{ id: 321, id_egreso: 321, concepto: "FLETE E2E", total_pr: 10, total_op: 10, status: 1, pagado: 0 }])),
    );
    await page.route(/\/uploadAllPath$/, (route) => route.fulfill(accepted([{ insertid: 13 }])));
    let sent = null;
    await page.route(/\/setSPaymentFile$/, (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill(refusal("Pago de prueba: no se guardó."));
    });
    await openPage(page, PAYMENT_WITHOUT_REQUEST, /\/getHouseListAll/);

    await page.getByRole("row").filter({ hasText: "H-E2E" }).locator(".mdi-cash-check").click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Procesar pago para el Expediente" });
    await dialog.getByRole("row").filter({ hasText: "FLETE E2E" }).getByRole("checkbox").check();
    await dialog.locator('input[type="file"]').setInputFiles({ name: "soporte.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    await dialog.getByRole("button", { name: "Subir" }).click();
    await dialog.getByRole("button", { name: "GUARDAR PAGO" }).click();

    await expect(dialogWith(page, "Pago de prueba: no se guardó.")).toBeVisible();
    await expect(dialogWith(page, "Pago procesado")).toHaveCount(0);
    expect(sent).toMatchObject({ id_request: null, expense_ids: [321], id_path: "13" });
  });

  test("the payment requests list loads for the session company", async ({ page }) => {
    const answer = page.waitForResponse((r) => r.url().includes("/getRequestPayment"), { timeout: 90_000 });
    await page.goto(PAYMENT_REQUESTS);
    const response = await answer;

    expect(response.request().headers()["auth-token"]).toBeTruthy();
    const body = await response.json();
    expect(body.estadoflag || body.tipomensaje === "TMSGINF").toBe(true);
  });
});
