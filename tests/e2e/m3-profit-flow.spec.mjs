import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const PROFIT_STATEMENT = "/home/folderReports/balanceGanancia";
const CASH_FLOW = "/home/folderRequest/listFlujoMensual";
const PROGRAMMED_PAYMENTS = "/home/folderReports/listProgrammedPayment";
const STATEMENT_ENDPOINTS = [
  "/resumen_ganancia",
  "/detalle_ganancia",
  "/detalle_gastos",
  "/resumen_gastos",
  "/resumen_ingreso_tipo",
  "/resumen_gastos_tipogasto",
  "/flujo_gasto_pre_post_mes",
];
const NOT_FOUND = { status: 200, statusBol: true, estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [] };
const ENGLISH_MONTH = /\b(Jan|Apr|Aug|Dec)\b/;

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });

test.describe("profit statement", () => {
  test.setTimeout(240_000);

  test("Generar reads every statement piece through the session, with no branch in the URL, and none is refused", async ({ page }) => {
    await page.goto(PROFIT_STATEMENT);
    await waitForPageToSettle(page, { spinnerClears: false });
    const answers = STATEMENT_ENDPOINTS.map((endpoint) =>
      page.waitForResponse((r) => r.url().includes(endpoint) && r.request().method() === "GET", { timeout: 180_000 }),
    );

    await page.getByRole("button", { name: "Generar" }).click();
    const responses = await Promise.all(answers);

    for (const response of responses) {
      expect(response.request().headers()["auth-token"]).toBeTruthy();
      expect(response.url()).not.toContain("id_branch");
      const body = await response.json();
      expect(body.estadoflag || body.tipomensaje === "TMSGINF").toBe(true);
    }
    await expect(page.locator(".swal2-popup")).toHaveCount(0);
  });

  test("Exportar downloads the Excel through the session", async ({ page }) => {
    await page.goto(PROFIT_STATEMENT);
    await waitForPageToSettle(page, { spinnerClears: false });
    const sent = page.waitForRequest((r) => r.url().includes("/excel_reporte"));
    const download = page.waitForEvent("download", { timeout: 180_000 });

    await page.getByRole("button", { name: "Exportar" }).click();

    expect((await sent).headers()["auth-token"]).toBeTruthy();
    expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test("a refused Excel shows the server's reason instead of downloading an error", async ({ page }) => {
    await page.route(/\/excel_reporte(\?|$)/, (route) =>
      route.fulfill({ status: 400, json: { estadoflag: false, mensaje: "No tienes acceso a esa sucursal.", tipomensaje: "TMSGADV" } }),
    );
    await page.goto(PROFIT_STATEMENT);
    await waitForPageToSettle(page, { spinnerClears: false });

    await page.getByRole("button", { name: "Exportar" }).click();

    await expect(dialogWith(page, "No tienes acceso a esa sucursal.")).toBeVisible();
  });
});

test.describe("cash flow by month", () => {
  test.setTimeout(240_000);

  test("loads the session company's weeks with Spanish labels", async ({ page }) => {
    const answer = page.waitForResponse((r) => r.url().includes("/flujo_dinero_por_mes") && r.request().method() === "GET", { timeout: 180_000 });
    await page.goto(CASH_FLOW);
    const response = await answer;
    const body = await response.json();

    expect(response.url()).not.toContain("id_branch");
    expect(body.estadoflag).toBe(true);
    expect(body.data[0].fechahasta.join(" ")).not.toMatch(ENGLISH_MONTH);
    await expect(page.locator("thead")).toContainText(body.data[0].fechahasta[0]);
  });

  test("an empty month leaves the screen usable instead of breaking it", async ({ page }) => {
    await page.route(/\/flujo_dinero_por_mes(\?|$)/, (route) => route.fulfill({ json: NOT_FOUND }));
    await page.goto(CASH_FLOW);
    await waitForPageToSettle(page, { spinnerClears: false });

    await expect(page.getByRole("button", { name: "Filtrar" }).first()).toBeVisible();
    await expect(page.locator(".swal2-popup")).toHaveCount(0);
  });
});

test.describe("programmed payments", () => {
  test("lists the session company's programmings through the session API", async ({ page }) => {
    const answer = page.waitForResponse((r) => /\/ListProgrammedPayment(\?|$)/.test(r.url()) && r.request().method() === "GET", {
      timeout: 60_000,
    });
    await page.goto(PROGRAMMED_PAYMENTS);
    const response = await answer;

    expect(response.status()).toBe(200);
    expect(response.request().headers()["auth-token"]).toBeTruthy();
    expect((await response.json()).estadoflag).toBe(true);
    await waitForPageToSettle(page, { spinnerClears: false });
    await expect(page.locator(".swal2-popup")).toHaveCount(0);
  });
});
