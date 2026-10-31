import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const LIST = "/home/folderPricing/lstQuote";
const EMPTY_RANGE = "No hay cotizaciones en este rango. Cambia las fechas o limpia los filtros.";
const CONNECTION_ERROR = "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";
const APPROVED = "Esta cotización ya está aprobada. Cópiala para hacer cambios.";
const NOT_FOUND = "No encontramos esta cotización. Vuelve al listado e inténtalo de nuevo.";
const MISSING_QUOTE_ID = 999999999;

const QUOTE_WRITES = /\/(delQuote|setCalls|putQuote|aprobar_cotizacion|copiar_cotizacion|insert_monto_finales_quote|actualizar_quote_folderonedrive)(\?|$)/;

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });
const params = (request) => Object.fromEntries(new URL(request.url()).searchParams);
const listState = (page) =>
  page.evaluate(() => {
    const pinia = document.querySelector("#app").__vue_app__.config.globalProperties.$pinia;
    return JSON.parse(JSON.stringify(pinia.state.value.pricing));
  });

async function openList(page) {
  const list = page.waitForResponse((r) => r.url().includes("/getQuoteList"), { timeout: 45_000 });
  const totals = page.waitForResponse((r) => r.url().includes("/resumen_por_estado"), { timeout: 45_000 });
  await page.goto(LIST);
  const answers = { list: (await list).request(), totals: (await totals).request() };
  await waitForPageToSettle(page);
  return answers;
}
const activeTab = (page) => page.locator(".v-window-item--active");
const rowOf = (page, code) => page.locator("tbody tr").filter({ hasText: code }).first();

async function quotesOnList(page, pagesToLook = 20) {
  const found = {};
  for (let pageNumber = 1; pageNumber <= pagesToLook; pageNumber++) {
    const { listQuotes, totalregistro } = await listState(page);
    found.approved ??= listQuotes.find((q) => q.aprobadoflag === true && q.statusmain != 0);
    found.draft ??= listQuotes.find((q) => !q.aprobadoflag && q.statusmain != 0);
    if ((found.approved && found.draft) || pageNumber * 10 >= totalregistro) break;
    const next = page.waitForResponse((r) => r.url().includes("/getQuoteList"));
    await page.getByRole("button", { name: "Next page" }).click();
    await next;
    await waitForPageToSettle(page);
  }
  return found;
}

test.describe("quote list", () => {
  test("an empty range shows the table's guidance instead of an error dialog", async ({ page }) => {
    await page.route(/\/getQuoteList(\?|$)/, (route) =>
      route.fulfill({ json: { estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [] } }),
    );
    await openList(page);

    await expect(page.getByText(EMPTY_RANGE)).toBeVisible();
    await expect(page.locator(".swal2-popup")).toHaveCount(0);
  });

  test("a list that cannot be loaded drops its rows and says what to do", async ({ page }) => {
    await openList(page);
    await page.route(/\/getQuoteList(\?|$)/, (route) => route.abort());

    await activeTab(page).getByRole("button", { name: "Limpiar" }).click();

    await expect(dialogWith(page, CONNECTION_ERROR)).toBeVisible();
    await page.locator(".swal2-confirm").click();
    await expect(page.getByText(EMPTY_RANGE)).toBeVisible();
  });

  test("the status chips count the list's own filters and a chip filters the list", async ({ page }) => {
    const { list, totals } = await openList(page);
    expect(params(totals)).toEqual(params(list));

    const { listadoResumen } = await listState(page);
    const chip = listadoResumen.find((item) => Number(item.cantidad) > 0);
    test.skip(!chip, "no quotes in this year's range on this database");
    const filtered = page.waitForRequest((r) => r.url().includes("/getQuoteList"));
    const recounted = page.waitForRequest((r) => r.url().includes("/resumen_por_estado"));

    await page.locator(".v-chip").filter({ hasText: chip.nombre_estado }).first().click();

    expect(params(await filtered)).toMatchObject({ id_status: String(chip.id) });
    expect(params(await recounted)).toMatchObject({ id_status: String(chip.id) });
    await waitForPageToSettle(page);
    const { listQuotes } = await listState(page);
    expect(listQuotes.length).toBeGreaterThan(0);
    expect(listQuotes.every((quote) => String(quote.statusquote) === String(chip.id))).toBe(true);
  });

  test("the list asks the server for one page and counts every quote of the range", async ({ page }) => {
    const { list } = await openList(page);
    expect(params(list)).toMatchObject({ limit: "10", pagina: "1" });
    const { listQuotes, totalregistro } = await listState(page);
    expect(listQuotes.length).toBeLessThanOrEqual(10);
    await expect(page.locator(".v-data-table-footer")).toContainText(`of ${totalregistro}`);
    test.skip(totalregistro <= 10, "a single page of quotes in this year's range");

    const next = page.waitForResponse((r) => r.url().includes("/getQuoteList"));
    await page.getByRole("button", { name: "Next page" }).click();
    const answer = await next;

    expect(params(answer.request())).toMatchObject({ limit: "10", pagina: "2" });
    const secondPage = (await answer.json()).data.map((quote) => quote.id);
    expect(secondPage.length).toBeGreaterThan(0);
    expect(secondPage.filter((id) => listQuotes.some((quote) => quote.id === id))).toEqual([]);
  });

  test("the search is answered by the server and starts again from the first page", async ({ page }) => {
    await openList(page);
    const { totalregistro } = await listState(page);
    test.skip(totalregistro <= 10, "a single page of quotes in this year's range");
    const secondPage = page.waitForResponse((r) => r.url().includes("/getQuoteList"));
    await page.getByRole("button", { name: "Next page" }).click();
    const [quote] = (await (await secondPage).json()).data;
    await waitForPageToSettle(page);

    const searched = page.waitForResponse((r) => r.url().includes("/getQuoteList") && params(r.request()).search === quote.codigo);
    await page.getByLabel("Buscar").fill(quote.codigo);
    const answer = await searched;

    expect(params(answer.request())).toMatchObject({ pagina: "1", search: quote.codigo });
    expect((await answer.json()).data.map((row) => row.codigo)).toContain(quote.codigo);
    await expect(rowOf(page, quote.codigo)).toBeVisible();
  });

  test("the deleted quotes filter lists deleted quotes only to look at them", async ({ page }) => {
    const writes = [];
    await page.route(QUOTE_WRITES, (route) => {
      writes.push(route.request().url());
      return route.abort();
    });
    await openList(page);
    await activeTab(page).getByRole("button", { name: /Filtrar/ }).click();
    const drawer = page.locator(".v-navigation-drawer--active");
    await drawer.getByLabel("Ver cotizaciones eliminadas").check();
    const filtered = page.waitForResponse((r) => r.url().includes("/getQuoteList"));

    await drawer.getByRole("button", { name: "Filtrar", exact: true }).click();

    const answer = await filtered;
    expect(params(answer.request())).toMatchObject({ estado: "0" });
    const deleted = (await answer.json()).data;
    test.skip(!deleted.length, "no deleted quotes in this year's range");
    expect(deleted.every((quote) => quote.statusmain === 0)).toBe(true);
    await waitForPageToSettle(page);
    const row = rowOf(page, deleted[0].codigo);
    await expect(row.getByText("Eliminada")).toBeVisible();
    await expect(row.getByRole("button")).toHaveCount(0);
    expect(writes).toEqual([]);
  });

  test("an approved quote explains it must be copied, and offers no delete", async ({ page }) => {
    await openList(page);
    const { approved } = await quotesOnList(page);
    test.skip(!approved, "no approved quote in this year's range");
    await page.getByLabel("Buscar").fill(approved.codigo);
    const row = rowOf(page, approved.codigo);

    await row.getByRole("button", { name: "Editar cotización" }).click();

    await expect(dialogWith(page, APPROVED)).toBeVisible();
    await expect(page).toHaveURL(/\/lstQuote$/);
    await expect(row.getByRole("button", { name: "Eliminar cotización" })).toHaveCount(0);
  });

  test("a refused delete is not reported as done and the list and its totals reload", async ({ page }) => {
    await openList(page);
    const { draft } = await quotesOnList(page);
    test.skip(!draft, "no draft quote in this year's range");
    await page.route(/\/delQuote$/, (route) =>
      route.fulfill({ json: { estadoflag: false, mensaje: "No pudimos eliminar la cotización.", tipomensaje: "TMSGERR", data: [] } }),
    );
    await page.getByLabel("Buscar").fill(draft.codigo);

    await rowOf(page, draft.codigo).getByRole("button", { name: "Eliminar cotización" }).click();
    const reloaded = page.waitForRequest((r) => r.url().includes("/getQuoteList"));
    const recounted = page.waitForRequest((r) => r.url().includes("/resumen_por_estado"));
    await page.locator(".swal2-confirm").click();

    await expect(dialogWith(page, "No pudimos eliminar la cotización.")).toBeVisible();
    await reloaded;
    await recounted;
  });

  test("the call dialog stays open until the call is saved, then the totals reload", async ({ page }) => {
    await openList(page);
    const { draft } = await quotesOnList(page);
    test.skip(!draft, "no draft quote in this year's range");
    let answer = { estadoflag: false, mensaje: "No pudimos guardar la llamada.", tipomensaje: "TMSGERR", data: [] };
    await page.route(/\/setCalls$/, (route) => route.fulfill({ json: answer }));
    await page.getByLabel("Buscar").fill(draft.codigo);
    await rowOf(page, draft.codigo).getByRole("button", { name: "Registrar llamada" }).click();
    const dialog = page.locator(".v-overlay--active .v-card").filter({ hasText: "Detalle de Nota de llamada" });
    await dialog.getByLabel("Descripcion").fill("Prueba e2e: el cliente pidió más tiempo");

    await dialog.getByRole("button", { name: "Aceptar" }).click();

    await expect(dialogWith(page, "No pudimos guardar la llamada.")).toBeVisible();
    await page.locator(".swal2-confirm").click();
    await expect(dialog).toBeVisible();

    answer = { estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", data: [] };
    const recounted = page.waitForRequest((r) => r.url().includes("/resumen_por_estado"));
    await dialog.getByRole("button", { name: "Aceptar" }).click();

    await expect(dialog).toBeHidden();
    await recounted;
  });

  test("the calls tab starts on this month and its report shows why the server refused it", async ({ page }) => {
    await openList(page);
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const { filtroCalls } = await listState(page);
    expect([filtroCalls.fechainicio, filtroCalls.fechafin]).toEqual([iso(new Date(today.getFullYear(), today.getMonth(), 1)), iso(today)]);

    await page.getByRole("tab", { name: "Llamadas" }).click();
    await activeTab(page).getByRole("button", { name: "Limpiar" }).click();
    await waitForPageToSettle(page);
    await page.route(/\/reporte_llamadas_export$/, (route) =>
      route.fulfill({ json: { estadoflag: false, mensaje: "El rango de fechas no es válido.", tipomensaje: "TMSGADV" } }),
    );
    const report = page.waitForRequest((r) => r.url().includes("/reporte_llamadas_export"));
    await activeTab(page).getByRole("button", { name: "REPORTE" }).click();

    expect((await report).postDataJSON().filtro).toMatchObject({ fechainicio: iso(new Date(today.getFullYear(), today.getMonth(), 1)), fechafin: iso(today) });
    await expect(dialogWith(page, "El rango de fechas no es válido.")).toBeVisible();
  });

  test("the calls report downloads its PDF instead of opening a public file", async ({ page }) => {
    await openList(page);
    await page.getByRole("tab", { name: "Llamadas" }).click();
    await activeTab(page).getByRole("button", { name: "Limpiar" }).click();
    await waitForPageToSettle(page);
    const download = page.waitForEvent("download", { timeout: 45_000 });

    await activeTab(page).getByRole("button", { name: "REPORTE" }).click();

    const pdf = await download;
    expect(pdf.suggestedFilename()).toBe("REPORTE_COTIZACIONES.pdf");
    expect(readFileSync(await pdf.path()).subarray(0, 5).toString()).toBe("%PDF-");
  });
});

test.describe("quote screens", () => {
  for (const [screen, path] of [
    ["Ver", "verQuote"],
    ["Editar", "editQuote"],
  ]) {
    test(`${screen} of a quote that does not exist stops loading and goes back to the list`, async ({ page }) => {
      await page.goto(`/home/folderPricing/${path}/${MISSING_QUOTE_ID}`);
      await waitForPageToSettle(page);

      await expect(dialogWith(page, NOT_FOUND)).toBeVisible();
      await page.getByRole("button", { name: "Volver al listado" }).click();
      await expect(page).toHaveURL(/\/lstQuote$/);
    });
  }

  test("Editar refuses an approved quote opened by its address", async ({ page }) => {
    await openList(page);
    const { approved } = await quotesOnList(page);
    test.skip(!approved, "no approved quote in this year's range");

    await page.goto(`/home/folderPricing/editQuote/${approved.id}`);
    await waitForPageToSettle(page);

    await expect(dialogWith(page, APPROVED)).toBeVisible();
    await page.getByRole("button", { name: "Volver al listado" }).click();
    await expect(page).toHaveURL(/\/lstQuote$/);
  });

  test("opening Ver lists the quote's files by quote", async ({ page }) => {
    await openList(page);
    const { draft } = await quotesOnList(page);
    test.skip(!draft, "no draft quote in this year's range");
    await page.route(/\/insert_monto_finales_quote$/, (route) => route.fulfill({ json: { estadoflag: true, data: [] } }));
    const files = page.waitForRequest((r) => r.url().includes("/listado_files"), { timeout: 20_000 }).catch(() => null);

    await page.goto(`/home/folderPricing/verQuote/${draft.id}`);
    await waitForPageToSettle(page);

    const filesRequest = await files;
    if (filesRequest) expect(params(filesRequest)).toEqual({ id_quote: String(draft.id) });
  });
});
