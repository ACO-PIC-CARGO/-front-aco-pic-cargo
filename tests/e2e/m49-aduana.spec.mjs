import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const LIST = "/home/lstQuoteAduanaAduana";
const NOT_FOUND = "No encontramos esta cotización de aduana. Vuelve al listado e inténtalo de nuevo.";
const APPROVED = "Esta cotización de aduana ya está aprobada y no se puede modificar. Puedes verla desde el listado.";
const CONFIRM_DELETE = "DESEA ELIMINAR LA COTIZACIÓN CON CÓDIGO: 00000001";
const MISSING_ID = 999999999;
const ADUANA = {
  id: MISSING_ID,
  quote: "1-A",
  statusmain: 1,
  idtipocarga: 3,
  containers: [],
  servicios: [],
  opcioncostos: [],
};
const LIST_ROW = {
  id: MISSING_ID,
  index: 0,
  codigo: "00000001",
  status: "COTIZANDO PROSPECTO",
  statusmain: 1,
  aprobadoflag: false,
  created: "01-Ene-2026 10:00",
  details: [],
};

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });
// The screens store the answer's token as the session token, so a fake answer echoes the current one.
const answer = (route, data) => ({
  json: { estadoflag: true, mensaje: null, tipomensaje: null, data, token: route.request().headers()["auth-token"] },
});

async function refuseWrites(page) {
  const writes = [];
  const refused =
    /\/(delQuote|setCalls|quote_note_insert|setQuote|export_list_quote|export_list_quote_xls|listado_cotizacion_mercadeo|reporte_llamadas_export|insert_monto_finales_aduana|insert_monto_finales_quote)(\?|$)/;
  await page.route(refused, (route) => {
    writes.push(new URL(route.request().url()).pathname);
    return route.abort();
  });
  return writes;
}

test.describe("aduana", () => {
  test("Ver of an aduana that cannot be opened returns to the aduana list", async ({ page }) => {
    const writes = await refuseWrites(page);

    await page.goto(`/home/VerAduana/${MISSING_ID}`);

    await expect(dialogWith(page, NOT_FOUND)).toBeVisible({ timeout: 30_000 });
    await page.locator(".swal2-confirm").click();
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    expect(writes).toEqual([]);
  });

  test("Editar of an approved aduana returns to the list without saving", async ({ page }) => {
    const writes = await refuseWrites(page);
    await page.route(/\/ver_aduana(\?|$)/, (route) => route.fulfill(answer(route, [{ ...ADUANA, aprobadoflag: true }])));
    await page.route(/\/actualizar_aduana(\?|$)/, (route) => {
      writes.push("actualizar_aduana");
      return route.abort();
    });

    await page.goto(`/home/EditarAduana/${MISSING_ID}`);

    await expect(dialogWith(page, APPROVED)).toBeVisible({ timeout: 30_000 });
    await page.locator(".swal2-confirm").click();
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    expect(writes).toEqual([]);
  });

  test("the list deletes the aduana itself, never a Pricing quote, and saves calls on the aduana", async ({ page }) => {
    const writes = await refuseWrites(page);
    await page.route(/\/listar_aduana(\?|$)/, (route) => route.fulfill(answer(route, [LIST_ROW])));
    const deletes = [];
    await page.route(/\/delete_aduana(\?|$)/, (route) => {
      deletes.push(route.request().postDataJSON());
      return route.fulfill(answer(route, []));
    });
    const calls = [];
    await page.route(/\/set_calls_aduana(\?|$)/, (route) => {
      calls.push(route.request().postDataJSON());
      return route.fulfill(answer(route, []));
    });
    await page.goto(LIST);
    await waitForPageToSettle(page);
    const row = page.locator("tbody tr").filter({ hasText: LIST_ROW.codigo }).first();

    await row.locator("button").filter({ has: page.locator(".mdi-delete") }).click();
    await expect(dialogWith(page, CONFIRM_DELETE)).toBeVisible();
    await page.locator(".swal2-confirm").click();
    await expect.poll(() => deletes).toEqual([{ id: MISSING_ID }]);
    await waitForPageToSettle(page);

    await row.locator("button").filter({ has: page.locator(".mdi-phone-plus") }).click();
    await page.getByLabel("Descripcion").fill("QA L49 llamada");
    await page.getByRole("button", { name: "Aceptar" }).click();

    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toMatchObject({ id_quote: MISSING_ID, comentario: "QA L49 llamada" });
    expect(writes).toEqual([]);
  });

  test("REPORTE, Excel, MERCADEO and the calls Imprimir print aduana data, never Pricing's", async ({ page }) => {
    test.setTimeout(240_000);
    const writes = await refuseWrites(page);
    const answered = [];
    page.on("response", (response) => {
      const path = new URL(response.url()).pathname.split("/").pop();
      if (/^(export_list_aduana|export_list_aduana_xls|listado_aduana_mercadeo|reporte_llamadas_aduana_export)$/.test(path)) {
        answered.push([path, response.status(), response.headers()["content-type"] ?? ""]);
      }
    });
    await page.goto(LIST);
    await waitForPageToSettle(page);
    const closeDialog = async () => {
      await expect(page.locator(".swal2-confirm")).toBeEnabled({ timeout: 60_000 });
      await page.locator(".swal2-confirm").click();
    };

    await page.getByRole("button", { name: "REPORTE" }).first().click();
    await expect.poll(() => answered.length, { timeout: 60_000 }).toBe(1);
    await closeDialog();
    await page.getByRole("button", { name: "REPORTE" }).nth(1).click();
    await expect.poll(() => answered.length, { timeout: 60_000 }).toBe(2);
    await page.getByRole("button", { name: "MERCADEO" }).click();
    await expect.poll(() => answered.length, { timeout: 60_000 }).toBe(3);
    await closeDialog();
    await page.getByRole("tab", { name: "Llamadas" }).click();
    await waitForPageToSettle(page);
    if (await page.locator(".swal2-popup").isVisible()) await page.locator(".swal2-confirm").click();
    await page.getByRole("button", { name: "Imprimir" }).click();
    await expect.poll(() => answered.length, { timeout: 60_000 }).toBe(4);
    await closeDialog();

    expect(answered.map(([path, status]) => [path, status])).toEqual([
      ["export_list_aduana", 200],
      ["export_list_aduana_xls", 200],
      ["listado_aduana_mercadeo", 200],
      ["reporte_llamadas_aduana_export", 200],
    ]);
    expect(answered[0][2]).toContain("application/pdf");
    expect(answered[1][2]).toContain("spreadsheetml");
    expect(writes).toEqual([]);
  });
});
