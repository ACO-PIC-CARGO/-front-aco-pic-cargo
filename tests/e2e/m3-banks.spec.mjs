import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickFirstOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const EXPENSES = "/home/FolderBanks/listadoPagosPorProveedor";
const INCOMES = "/home/FolderBanks/listadoPagosPorCliente";
const REFUSED = "El monto para la factura supera su saldo pendiente. Corrige el monto y vuelve a intentarlo.";
const UPDATED = "Actualizamos la salida N° E2E.";

const cents = (value) => Math.round(Number(value || 0) * 100);
const filterDrawer = (page, title) => outsideInert(page, page.getByRole("navigation").filter({ hasText: title }));

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

async function openExpenseList(page) {
  const listed = page.waitForResponse((response) => response.url().includes("listado_egresos"));
  await page.goto(EXPENSES);
  const rows = (await (await listed).json()).data;
  await waitForPageToSettle(page);
  return rows;
}

const balancedExpense = (rows) =>
  rows.find(
    (row) =>
      row.detalles.length > 0 &&
      row.detalles.reduce((sum, detail) => sum + cents(detail.montomonedalocal), 0) +
        row.table_comisionbancaria.reduce((sum, fee) => sum + cents(fee.monto), 0) ===
        cents(row.totalmonedalocal),
  );

test.describe("Bancos - Entradas y Salidas", () => {
  test("the income filter reaches the list with the keys the server reads", async ({ page }) => {
    await page.goto(INCOMES);
    await waitForPageToSettle(page);
    await page.getByRole("button", { name: "Filtrar" }).first().click();
    const drawer = filterDrawer(page, "Filtrar Ingresos");
    await pickFirstOption(page, "Cuenta Bancaria Destino (PIC)");
    await drawer.getByLabel("Monto", { exact: true }).fill("123.45");

    const listed = page.waitForRequest((request) => request.url().includes("listado_ingresos"));
    await drawer.getByRole("button", { name: "Aceptar" }).click();
    const query = new URL((await listed).url()).searchParams;

    expect(query.get("monto_factura")).toBe("123.45");
    expect(Number(query.get("id_cuenta_destino"))).toBeGreaterThan(0);
    expect(query.has("monto")).toBe(false);
    expect(query.has("id_cuenta")).toBe(false);
  });

  test("the expense Excel comes back in the response with the list's dates", async ({ page }) => {
    await openExpenseList(page);
    const exported = page.waitForResponse((response) => response.url().includes("exportar_listado_reporte_egresos"));
    const downloaded = page.waitForEvent("download");

    await page.getByRole("button", { name: /excel/i }).click();
    const response = await exported;

    expect(response.headers()["content-type"]).toContain("spreadsheetml");
    expect(new URL(response.url()).searchParams.get("desde")).toMatch(/^\d{4}-01-01$/);
    expect((await downloaded).suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test("an expense voucher downloads as a PDF from the response", async ({ page }) => {
    const [expense] = await openExpenseList(page);
    await page.goto(`/home/FolderBanks/verPagosPorProveedor/${expense.id}`);
    await waitForPageToSettle(page);
    const downloaded = page.waitForEvent("download");

    await page.getByRole("button", { name: "Imprimir" }).click();

    expect((await downloaded).suggestedFilename()).toBe(`Comprobante de salida ${expense.id}.pdf`);
  });

  test("an expense edit shows the server's reason when refused and opens the list only once accepted", async ({ page }) => {
    const expense = balancedExpense(await openExpenseList(page));
    expect(expense, "an expense whose bank amount equals its payments plus commission").toBeTruthy();
    const answers = [
      { estadoflag: false, mensaje: REFUSED, tipomensaje: "TMSGADV", data: [] },
      { estadoflag: true, mensaje: UPDATED, tipomensaje: "TMSGINF", data: [] },
    ];
    const sent = [];
    await page.route(/\/actualizar_egresos$/, async (route) => {
      sent.push(route.request().postDataJSON());
      await route.fulfill({ json: answers.shift() });
    });
    await page.goto(`/home/FolderBanks/editarPagosPorProveedor/${expense.id}`);
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "Actualizar Operación" }).first().click();
    await acknowledge(page, REFUSED);
    await expect(page).toHaveURL(new RegExp(`editarPagosPorProveedor/${expense.id}$`));

    await page.getByRole("button", { name: "Actualizar Operación" }).first().click();
    await acknowledge(page, UPDATED);
    await expect(page).toHaveURL(/listadoPagosPorProveedor$/);
    expect(sent.map((body) => String(body.id))).toEqual([String(expense.id), String(expense.id)]);
  });
});
