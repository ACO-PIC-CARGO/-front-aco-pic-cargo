import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const LIST = "/home/lstQuoteAduanaAduana";
const NOT_FOUND = "No encontramos esta cotización de aduana. Vuelve al listado e inténtalo de nuevo.";
const APPROVED = "Esta cotización de aduana ya está aprobada y no se puede modificar. Puedes verla desde el listado.";
const NO_DELETE = "Por ahora las cotizaciones de aduana no se pueden eliminar desde aquí.";
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
  await page.route(/\/(delQuote|setCalls|quote_note_insert|insert_monto_finales_aduana|insert_monto_finales_quote|setQuote)(\?|$)/, (route) => {
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

  test("the list never deletes a Pricing quote and saves calls on the aduana", async ({ page }) => {
    const writes = await refuseWrites(page);
    await page.route(/\/listar_aduana(\?|$)/, (route) => route.fulfill(answer(route, [LIST_ROW])));
    const calls = [];
    await page.route(/\/set_calls_aduana(\?|$)/, (route) => {
      calls.push(route.request().postDataJSON());
      return route.fulfill(answer(route, []));
    });
    await page.goto(LIST);
    await waitForPageToSettle(page);
    const row = page.locator("tbody tr").filter({ hasText: LIST_ROW.codigo }).first();

    await row.locator("button").filter({ has: page.locator(".mdi-delete") }).click();
    await expect(dialogWith(page, NO_DELETE)).toBeVisible();
    await page.locator(".swal2-confirm").click();

    await row.locator("button").filter({ has: page.locator(".mdi-phone-plus") }).click();
    await page.getByLabel("Descripcion").fill("QA L49 llamada");
    await page.getByRole("button", { name: "Aceptar" }).click();

    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toMatchObject({ id_quote: MISSING_ID, comentario: "QA L49 llamada" });
    expect(writes).toEqual([]);
  });
});
