import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const MASTER_ID = 2701;
const FOREIGN_MASTER_ID = 1812;
const CONNECTION = "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";
const REFUSED_DELETE = "No puedes eliminar este concepto porque ya está facturado. Anula la factura y vuelve a intentarlo.";

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });

async function openExpenseControl(page, masterId = MASTER_ID) {
  const houses = page.waitForResponse((r) => r.url().includes("/control_gastos_listhouses"));
  const providers = page.waitForResponse((r) => r.url().includes("/control_gastos_listmaster"));
  await page.goto(`/home/folderBilling/editControlGastos/view/${masterId}/1`);
  const answers = { houses: await (await houses).json(), providers: await (await providers).json() };
  await waitForPageToSettle(page);
  return answers;
}

test.describe("M1 expense control and invoices", () => {
  test("a master's expense control lists each provider once with its own totals", async ({ page }) => {
    const { houses, providers } = await openExpenseControl(page);

    expect(houses.estadoflag).toBe(true);
    const rows = providers.data[0].lsthouses;
    const keys = rows.map((row) => `${row.id_proveedor}-${row.id_correlativo}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const row of rows) {
      const conceptsTotal = row.detalle.reduce((sum, concept) => sum + Number(concept.total_pr), 0);
      expect(Number(row.total_total_pr)).toBeCloseTo(conceptsTotal, 2);
    }
  });

  test("another company's master shows no houses and the screen keeps working", async ({ page }) => {
    const { houses, providers } = await openExpenseControl(page, FOREIGN_MASTER_ID);

    expect([houses.estadoflag, providers.estadoflag]).toEqual([false, false]);
    expect(houses.data).toEqual([]);
  });

  test("adding an income sends it once even when the button is pressed twice", async ({ page }) => {
    const sent = [];
    await page.route(/\/setIngresos$/, async (route) => {
      sent.push(route.request().postDataJSON());
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.fulfill({ json: { estadoflag: false, mensaje: "Revisa los datos del concepto.", tipomensaje: "TMSGADV", data: [] } });
    });
    await openExpenseControl(page);
    await page.getByRole("button", { name: /^(Nuevo Concepto|Nuevo Control de Gastos Ingresos)$/ }).first().click();
    const service = page.getByRole("dialog").filter({ hasText: "Datos del servicio" });
    await expect(async () => {
      await service.getByLabel("Correlativo").click();
      await page.getByRole("option").first().click({ timeout: 5_000 });
      await page.keyboard.press("Tab");
      await expect(service.getByRole("combobox").filter({ has: page.getByLabel("Correlativo") }).filter({ hasText: /\d{4}/ })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await service.getByLabel("Concepto").fill(`E2E doble clic ${Date.now()}`);
    await service.getByLabel("Moneda de Banco Salida").click();
    await page.getByRole("option", { name: /USD|DÓLAR/i }).first().click();
    await service.getByLabel("Monto").first().pressSequentially("10");

    await service.getByRole("button", { name: "Agregar servicio" }).dblclick();

    await expect(dialogWith(page, "Revisa los datos del concepto.")).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0]).not.toHaveProperty("id_user");
  });

  test("a refused income delete says why and keeps the concept", async ({ page }) => {
    await page.route(/\/delIngresos\/\d+$/, (route) =>
      route.fulfill({ json: { estadoflag: false, mensaje: REFUSED_DELETE, tipomensaje: "TMSGADV", data: [] } }),
    );
    const { houses } = await openExpenseControl(page);
    const house = houses.data[0].lsthouses.find((row) => row.ingresos.some((income) => !income.facturado && !income.pagado));
    test.skip(!house, "no house with a deletable income on this database");
    const income = house.ingresos.find((row) => !row.facturado && !row.pagado);

    await page.getByRole("cell", { name: new RegExp(`\\(\\d+\\) - ${house.correlativo}`) }).first().click();
    const row = page.getByRole("row").filter({ hasText: income.concepto }).first();
    await row.locator(".mdi-delete").click();
    const confirm = dialogWith(page, "¿Desea Eliminar El registro?");
    if (!(await confirm.isVisible())) test.skip(true, "the income has a client payment and asks for the admin key");
    await confirm.getByRole("button", { name: "Si, Eliminar" }).click();

    await expect(dialogWith(page, REFUSED_DELETE)).toBeVisible();
  });

  test("the expense control list stops loading and asks to check the connection when the server does not answer", async ({ page }) => {
    await page.route(/\/getControlList(\?|$)/, (route) => route.abort());
    await page.goto("/home/folderBilling/listControlGastos");

    await expect(dialogWith(page, CONNECTION)).toBeVisible();
    await expect(page.getByText("Cargando informacíon")).toBeHidden();
  });

  test("cancelling an invoice asks for the reason and sends it", async ({ page }) => {
    const sent = [];
    await page.route(/\/anular_factura$/, async (route) => {
      sent.push(route.request().postDataJSON());
      await route.fulfill({ json: { estadoflag: true, mensaje: "Factura anulada.", tipomensaje: "TMSGINF", data: [] } });
    });
    const list = page.waitForResponse((r) => r.url().includes("/listar_Factura/"));
    await page.goto("/home/folderBilling/lstFacturacion");
    const invoices = (await (await list).json()).data;
    await waitForPageToSettle(page);
    const active = invoices.find((invoice) => invoice.estatus);
    test.skip(!active, "no active invoice on this database");

    await page.getByLabel("Buscar....").fill(active.correlativo);
    await page.getByRole("row").filter({ hasText: active.correlativo }).first().getByRole("button", { name: "Anular factura" }).click();
    const prompt = dialogWith(page, "Escribe el motivo");
    await prompt.getByRole("button", { name: "Anular factura" }).click();
    await expect(prompt.getByText("Escribe el motivo de la anulación.")).toBeVisible();
    await prompt.locator("textarea").fill("Datos del cliente errados");
    await prompt.getByRole("button", { name: "Anular factura" }).click();

    await expect(dialogWith(page, "Factura anulada")).toBeVisible();
    expect(sent).toEqual([{ id: active.id, motivo: "Datos del cliente errados" }]);
  });
});
