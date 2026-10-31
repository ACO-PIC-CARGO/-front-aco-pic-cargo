import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { SESSION_FILE } from "./support/env.mjs";
import { pickFirstOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const API = process.env.E2E_API_URL ?? "http://localhost:9200/";
const PAYABLES = "/home/folderModulesPays/controlAccountPays";
const RECEIVABLES = "/home/folderModulesPays/moduleAccountReceivable";
const PROJECTIONS = "/home/folderModulesPays/lstProyeccion";
const REFUSED = "Cuenta de prueba: no se guardó.";

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });
const json = (body) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
const refusal = (mensaje) => json({ status: 200, statusBol: true, estadoflag: false, mensaje, tipomensaje: "TMSGADV", data: [] });
const accepted = (data, mensaje = null) => json({ status: 200, statusBol: true, estadoflag: true, mensaje, tipomensaje: null, data });

function apiHeaders() {
  const { session } = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
  return { "auth-token": session["auth-token"], "x-branch-id": String(JSON.parse(session.dataUser)[0].id_branch) };
}

async function apiRows(request, path) {
  const body = await (await request.get(API + path, { headers: apiHeaders(), timeout: 60_000 })).json();
  return body.estadoflag ? body.data : [];
}

async function openPage(page, path, answer) {
  const loaded = page.waitForResponse((r) => r.url().includes(answer), { timeout: 60_000 });
  await page.goto(path);
  await loaded;
  await waitForPageToSettle(page);
}

const payableRow = (changes = {}) => ({
  id: 999001,
  status: 1,
  paymentname: "Administrativa",
  namecoins: "PEN",
  symbol: "S/",
  nro_factura: "E2E-USD",
  total: "370.00",
  tipocambio: "3.70",
  totaldolar: "100.00",
  detalle: [],
  ...changes,
});

test.describe("accounts payable", () => {
  test.setTimeout(120_000);

  test("the USD column shows the account's USD total", async ({ page }) => {
    await page.route(/\/getInvoiceAdmin\?/, (route) => route.fulfill(accepted([payableRow()])));
    await openPage(page, PAYABLES, "/getInvoiceAdmin");

    const row = page.getByRole("row").filter({ hasText: "E2E-USD" });
    await expect(row).toContainText("USD 100.00");
    await expect(row).not.toContainText("USD 370.00");
  });

  test("editing a USD account adds concepts without an exchange rate and sends only what changed", async ({ page, request }) => {
    const usd = (await apiRows(request, "getInvoiceAdmin?fechapagodesde=2000-01-01")).find((row) => row.status == 1 && row.symbol === "USD");
    test.skip(!usd, "no pending USD payable in the session branch");
    let sent = null;
    await page.route(/\/setUpdateInvoiceAdmin$/, (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill(refusal(REFUSED));
    });
    await openPage(page, `/home/folderModulesPays/EditAccountPays/${usd.id}`, "/getVerInvoiceAdmin/");

    const lines = page.locator("table tbody tr");
    const before = await lines.count();
    for (const [name, amount] of [["E2E uno", "10"], ["E2E dos", "20"]]) {
      await page.getByRole("button", { name: "Añadir Concepto de Pago" }).click();
      const concept = page.getByRole("dialog").filter({ hasText: "Cargar Conceptos a Pagar" });
      await expect(concept).toBeVisible();
      await concept.getByLabel("Producto/ Concepto").fill(name);
      await concept.getByLabel("Monto").fill(amount);
      await concept.getByText("No Afecto").click();
      await concept.getByRole("button", { name: "Aceptar" }).click();
      await expect(concept).toBeHidden();
    }
    await expect(dialogWith(page, "Tipo de Cambio")).toHaveCount(0);
    await expect(lines).toHaveCount(before + 2);

    await lines.nth(before - 1).getByRole("button").first().click();
    await expect(lines).toHaveCount(before + 1);
    await lines.nth(before - 1).locator("input[type=number]").fill("25");

    const save = page.getByRole("button", { name: "GUARDAR CAMBIOS" });
    await save.click();
    await expect(dialogWith(page, REFUSED)).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(save).toBeEnabled();

    const concepts = sent.detalle.map((line) => [line.concepto, Number(line.total)]);
    expect(concepts).toContainEqual(["E2E dos", 25]);
    expect(concepts.map(([name]) => name)).not.toContain("E2E uno");
    expect(sent.detalle.every((line) => line.status === 1)).toBe(true);
    expect(sent).not.toHaveProperty("status");
    expect(sent.id_coins).toBe(usd.id_coins);
    expect(["number", "object"]).toContain(typeof sent.id_proformance);
    expect(sent.id_proformance?.id).toBeUndefined();
  });
});

test.describe("accounts receivable", () => {
  test.setTimeout(120_000);

  test("deleting explains a failed admin check and a refused delete, and keeps the account", async ({ page, request }) => {
    const pending = (await apiRows(request, "getInvoiceAdminCxC?fechapagodesde=2000-01-01")).find((row) => row.status == 1 && row.nro_factura);
    test.skip(!pending, "no pending receivable in the session branch");
    let deletes = 0;
    let adminValid = false;
    await page.route(/\/validar_usuario_admin$/, (route) =>
      route.fulfill(adminValid ? accepted([]) : refusal("Usuario o clave de administrador incorrectos.")),
    );
    await page.route(/\/delProCxC$/, (route) => {
      deletes += 1;
      return route.fulfill(refusal("No puedes eliminar esta cuenta porque ya tiene pagos registrados."));
    });
    await openPage(page, RECEIVABLES, "/getInvoiceAdminCxC");
    await page.getByLabel("Buscar", { exact: true }).fill(pending.nro_factura);
    const row = page.getByRole("row").filter({ hasText: pending.nro_factura }).filter({ has: page.locator(".mdi-delete") }).first();

    const askAdmin = async () => {
      await row.locator(".mdi-delete").click();
      await page.locator("#swal-input1").fill("admin");
      await page.locator("#swal-input2").fill("clave");
      await page.getByRole("button", { name: "Aceptar" }).click();
    };

    await askAdmin();
    await expect(dialogWith(page, "Usuario o clave de administrador incorrectos.")).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    expect(deletes).toBe(0);

    adminValid = true;
    await askAdmin();
    await expect(dialogWith(page, "ya tiene pagos registrados")).toBeVisible();
    expect(deletes).toBe(1);
  });
});

test.describe("expense projections", () => {
  test.setTimeout(120_000);

  const projectionRow = {
    proyeccion_id: 999001,
    proyeccion_correlativo: "999001",
    month_description: "ENERO",
    year_description: "2030",
    proyeccion_total_proyectado_ext: "10.00",
    entitie_namelong: "E2E",
    proyeccion_estado: true,
    proyeccion_aprobadoflag: false,
  };

  test("deleting asks first and reloads the list without undefined filters", async ({ page }) => {
    const lists = [];
    let deletes = 0;
    await page.route(/\/list_proyeccion\?/, (route) => {
      lists.push(route.request().url());
      return route.fulfill(accepted([projectionRow]));
    });
    await page.route(/\/eliminar_proyeccion$/, (route) => {
      deletes += 1;
      return route.fulfill(accepted([], "Proyección eliminada."));
    });
    await openPage(page, PROJECTIONS, "/list_proyeccion");
    const trash = page.getByRole("row").filter({ hasText: "999001" }).locator(".mdi-trash-can");

    const confirm = dialogWith(page, "eliminar esta proyección");
    await trash.click();
    await confirm.getByRole("button", { name: "Cancelar" }).click();
    expect(deletes).toBe(0);

    await trash.click();
    await confirm.getByRole("button", { name: "Eliminar" }).click();
    await expect(dialogWith(page, "Proyección eliminada.")).toBeVisible();
    await expect.poll(() => lists.length).toBe(2);
    expect(deletes).toBe(1);
    expect(lists[1]).not.toContain("undefined");
  });

  test("copy and generate ask for the month and year and keep the dialog open when refused", async ({ page }) => {
    let copies = 0;
    let generated = 0;
    await page.route(/\/list_proyeccion\?/, (route) => route.fulfill(accepted([projectionRow])));
    await page.route(/\/copiar_proyeccion$/, (route) => {
      copies += 1;
      return route.fulfill(refusal(REFUSED));
    });
    await page.route(/\/generar_primerar_proyeccion$/, (route) => {
      generated += 1;
      return route.fulfill(refusal(REFUSED));
    });
    await openPage(page, PROJECTIONS, "/list_proyeccion");

    await page.getByRole("row").filter({ hasText: "999001" }).locator(".mdi-content-copy").click();
    const copy = page.getByRole("dialog").filter({ hasText: "Copiar Proyección" });
    await copy.getByRole("button", { name: "Copiar" }).click();
    await expect(copy.getByText("Dato requerido").first()).toBeVisible();
    expect(copies).toBe(0);
    await pickFirstOption(page, "Mes");
    await pickFirstOption(page, "Año");
    await copy.getByRole("button", { name: "Copiar" }).click();
    await expect(dialogWith(page, REFUSED)).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(copy).toBeVisible();
    expect(copies).toBe(1);
    await copy.getByRole("button", { name: "Cancelar" }).click();

    await page.unroute(/\/list_proyeccion\?/);
    await page.route(/\/list_proyeccion\?/, (route) => route.fulfill(refusal("No se encontraron registros")));
    await openPage(page, PROJECTIONS, "/list_proyeccion");
    await page.getByRole("button", { name: "OK" }).click();
    await page.getByRole("button", { name: "GENERAR", exact: true }).click();
    const generate = page.getByRole("dialog").filter({ hasText: "REALIZAR PRIMERA PROYECCIÓN" });
    await generate.getByRole("button", { name: "Generar" }).click();
    await expect(generate.getByText("Dato requerido").first()).toBeVisible();
    expect(generated).toBe(0);
  });

  test("approving warns before replacing the approved projection", async ({ page, request }) => {
    const draft = (await apiRows(request, "list_proyeccion")).find((row) => !row.proyeccion_aprobadoflag && row.proyeccion_estado);
    test.skip(!draft, "no active draft projection in the session company");
    let approvals = 0;
    await page.route(/\/validate_proyeccion_aprobacion/, (route) =>
      route.fulfill(json({ status: 200, statusBol: true, estadoflag: true, mensaje: "Ya existe un programación aprobada.", tipomensaje: "TMSGINF", data: [] })),
    );
    await page.route(/\/aprobar_proyeccion$/, (route) => {
      approvals += 1;
      return route.fulfill(refusal(REFUSED));
    });
    await openPage(page, `/home/folderModulesPays/editarProyeccion/${draft.proyeccion_id}`, "/ver_proyeccion");
    await page.waitForTimeout(2_500);

    await page.getByRole("button", { name: "APROBAR" }).click();
    await expect(dialogWith(page, "Ya existe un programación aprobada.")).toBeVisible();
    await page.getByRole("button", { name: "No", exact: true }).click();
    expect(approvals).toBe(0);
  });
});
