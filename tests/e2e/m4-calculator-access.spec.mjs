import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";
import { SESSION_FILE } from "./support/env.mjs";

const API = process.env.E2E_API_URL ?? "http://localhost:9200/";
const LEADS_SCREEN = "/home/folterCalculadora/list_user_calc";

function savedSession() {
  const { session } = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
  return {
    headers: { "auth-token": session["auth-token"], "x-branch-id": String(JSON.parse(session.dataUser)[0].id_branch) },
    isoPais: Number(session.iso_pais),
  };
}

async function listLeads(request) {
  const { headers, isoPais } = savedSession();
  const body = await (await request.post(API + "listar_usuarios_calculadora", { headers, data: { iso_pais: isoPais } })).json();
  expect(body.estadoflag, body.mensaje).toBe(true);
  return body.data;
}

async function setLeadStatus(request, id, idStatusQuote) {
  const { headers } = savedSession();
  await request.put(API + "calc/actualizar/estado/cotizacion", { headers, data: { id, id_status_quote: idStatusQuote } });
}

test.describe("Usuarios Calculadora (S38)", () => {
  test("changing a lead's status is saved and the screen tells the user", async ({ page, request }) => {
    const [lead] = await listLeads(request);
    const { headers } = savedSession();
    const statuses = (await (await request.get(API + "calc/estatus", { headers })).json()).data;
    const current = statuses.findIndex((status) => String(status.id) === String(lead.id_status_quote));
    const hasUniqueName = (status) => statuses.filter((other) => other.name === status.name).length === 1;
    // The open menu scrolls to the current status, so a neighbour is the option in view.
    const nextStatus = [statuses[current - 1], statuses[current + 1]].find((status) => status && hasUniqueName(status));

    await page.goto(LEADS_SCREEN);
    await waitForPageToSettle(page);
    try {
      await page.locator("#tblListUser tbody tr").first().getByRole("button", { name: "Registro Llamada" }).click();
      const dialog = outsideInert(page, page.locator(".v-overlay--active .v-card").filter({ hasText: "Detalle de Nota de llamada" }));
      await dialog.getByLabel("Descripción").fill("E2E M4 llamada de prueba");
      await pickOption(page, "Estado Cotización", nextStatus.name);
      await dialog.getByRole("button", { name: "Guardar" }).click();

      const answer = page.getByRole("dialog").filter({ hasText: "Actualización Correcta." });
      await expect(answer).toBeVisible();
      await answer.getByRole("button", { name: /^ok$/i }).click();
      await expect.poll(async () => String((await listLeads(request))[0].id_status_quote)).toBe(String(nextStatus.id));
    } finally {
      await setLeadStatus(request, lead.id, lead.id_status_quote);
    }
  });

  test("Exportar downloads the leads workbook", async ({ page }) => {
    await page.goto(LEADS_SCREEN);
    await waitForPageToSettle(page);

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar" }).click();

    expect((await download).suggestedFilename()).toMatch(/^Listado Usuario Calculadora - \d+\.xlsx$/);
  });
});

test.describe("Calculadora: acceso directo a la API", () => {
  test.use({ authenticated: false });

  test("the internal calculator routes refuse a caller without a session", async ({ request }) => {
    const answers = await Promise.all([
      request.post(API + "listar_usuarios_calculadora", { data: { iso_pais: 9589 } }),
      request.get(API + "export_listar_usuarios_calculadora?id_pais=9589"),
      request.get(API + "calc/ver_cotizacion?id=1&individualflag=1&esgrupalflag=0"),
      request.put(API + "calc/actualizar/estado/cotizacion", { data: { id: 1, id_status_quote: 1 } }),
      request.post(API + "calc/enviar_pricing", { data: { id: 1, individualflag: true, grupalflag: false } }),
      request.get(API + "calc/profit_list?id_pais=139&shimpent=LCL&id_modality=1"),
    ]);

    expect(answers.map((answer) => answer.status())).toEqual([401, 401, 401, 401, 401, 401]);
  });

  test("the public calculator's routes still answer without a session", async ({ request }) => {
    const answers = await Promise.all([
      request.get(API + "calc/cargar/opciones"),
      request.get(API + "calc/obtener_maximo_valor_opcion"),
    ]);

    expect(answers.map((answer) => answer.status())).toEqual([200, 200]);
  });
});
