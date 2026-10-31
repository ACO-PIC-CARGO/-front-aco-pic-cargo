import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const CONTROL_FILE = "/home/folderReports/list";
const DETAILED_CONTROL_FILE = "/home/folderReports/listDetails";
const PROFIT = "/home/reporte/ReporteGanancia";
const CONNECTION_ERROR = "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";
const PRINT_FAILED = "No pudimos completar la operación. Intenta de nuevo en unos minutos.";
const PDF_TIMEOUT = 180_000;

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });
const footerCount = async (page, label) =>
  Number((await page.getByText(label).first().innerText()).replace(/\D+/g, ""));

async function openPage(page, path, answer) {
  const loaded = page.waitForResponse((r) => r.url().includes(answer), { timeout: 60_000 });
  await page.goto(path);
  await loaded;
  await waitForPageToSettle(page, { spinnerClears: false });
}

async function downloadFrom(page, click, endpoint) {
  const sent = page.waitForRequest((r) => r.url().includes(endpoint));
  const download = page.waitForEvent("download", { timeout: PDF_TIMEOUT });
  await click();
  const request = await sent;
  const file = await download;
  await expect(page.locator(".swal2-popup")).toHaveCount(0);
  return { headers: request.headers(), url: request.url(), body: request.postDataJSON?.() ?? null, file };
}

test.describe("control file report", () => {
  test.setTimeout(PDF_TIMEOUT + 60_000);

  test("the footer sorts every listed master into arrived, arriving or other and no date reads Invalid date", async ({ page }) => {
    await openPage(page, CONTROL_FILE, "/getControlFile");

    const total = await footerCount(page, "Total de Expedientes Master:");
    const arrived = await footerCount(page, "Total Llegados:");
    const arriving = await footerCount(page, "Total por Llegar:");
    const others = await footerCount(page, "Total de Otras:");

    expect(total).toBeGreaterThan(0);
    expect(arrived + arriving + others).toBe(total);
    await expect(page.getByText("Invalid date")).toHaveCount(0);
  });

  test("GENERAR PDF downloads the PDF of the last search with the session, not from a public link", async ({ page }) => {
    await openPage(page, CONTROL_FILE, "/getControlFile");
    await page.getByRole("button", { name: "FILTRAR" }).click();
    await page.getByLabel("Estado de Expediente Operativo").click();
    await page.getByRole("option", { name: "Cerrado" }).click();
    await page.getByRole("button", { name: "Cerrar" }).click();

    const { headers, body, file } = await downloadFrom(page, () => page.getByRole("button", { name: "GENERAR PDF" }).click(), "/createdPDF");

    expect(headers["auth-token"]).toBeTruthy();
    expect(body.status_op).toBe("0");
    expect(file.suggestedFilename()).toBe("REPORTE_CONTROL_FILE.pdf");
  });
});

test.describe("detailed control file report", () => {
  test.setTimeout(PDF_TIMEOUT + 60_000);

  test("a search that cannot reach the server says so and lets the user search again", async ({ page }) => {
    await page.goto(DETAILED_CONTROL_FILE);
    await waitForPageToSettle(page, { spinnerClears: false });
    await page.route(/\/getReportFileDetails(\?|$)/, (route) => route.abort());

    await page.getByRole("button", { name: "Buscar", exact: true }).click();

    await expect(dialogWith(page, CONNECTION_ERROR)).toBeVisible();
    await page.locator(".swal2-confirm").click();
    await expect(page.getByRole("button", { name: "Buscar", exact: true })).toBeEnabled();
  });

  test("EXPORTAR PDF downloads the report of the searched dates", async ({ page }) => {
    await page.goto(DETAILED_CONTROL_FILE);
    await waitForPageToSettle(page, { spinnerClears: false });
    const searched = page.waitForResponse((r) => r.url().includes("/getReportFileDetails"));
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    expect((await (await searched).json()).estadoflag).toBe(true);

    const { headers, url, file } = await downloadFrom(page, () => page.getByRole("button", { name: "EXPORTAR PDF" }).click(), "/pdfFD");

    expect(headers["auth-token"]).toBeTruthy();
    expect(url).not.toContain("id_branch");
    expect(file.suggestedFilename()).toMatch(/^REPORTE_FILES_DETALLADO_.+\.pdf$/);
  });
});

test.describe("profit report", () => {
  test.setTimeout(PDF_TIMEOUT + 60_000);

  test("the yearly table lists the twelve months even when some have no files", async ({ page }) => {
    await openPage(page, PROFIT, "/obtener_totales_master_por_mes");

    await expect(page.locator(".tabla-reporte tbody tr:not(.fila-totales)")).toHaveCount(12);
  });

  test("Imprimir PDF downloads the year's report with the session", async ({ page }) => {
    await openPage(page, PROFIT, "/obtener_totales_master_general");

    const { headers, file } = await downloadFrom(page, () => page.getByRole("button", { name: "Imprimir PDF" }).click(), "/imprimir_reporte_ganancia");

    expect(headers["auth-token"]).toBeTruthy();
    expect(file.suggestedFilename()).toBe(`REPORTE_GANANCIA_${new Date().getFullYear()}.pdf`);
  });

  test("a print that fails closes the waiting notice and says what happened", async ({ page }) => {
    await openPage(page, PROFIT, "/obtener_totales_master_general");
    await page.route(/\/imprimir_reporte_ganancia(\?|$)/, (route) =>
      route.fulfill({ status: 500, json: { estadoflag: false, mensaje: PRINT_FAILED, tipomensaje: "TMSGERR", data: [] } }),
    );

    await page.getByRole("button", { name: "Imprimir PDF" }).click();

    await expect(dialogWith(page, PRINT_FAILED)).toBeVisible();
    await page.locator(".swal2-confirm").click();
    await expect(page.locator(".swal2-popup")).toHaveCount(0);
  });
});
