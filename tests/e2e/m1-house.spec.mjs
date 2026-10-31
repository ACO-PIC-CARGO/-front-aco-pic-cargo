import { test, expect } from "./fixtures.mjs";
import { pickFirstOption, searchAndPick } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const LIST = "/home/folderHouse/list";
const FOREIGN_HOUSE_ID = 4587;
const SMTP_MISSING =
  "El envío de correos no está configurado. Pide a tu administrador que configure el servidor de correo e intenta de nuevo.";
const HAS_PAYMENTS =
  "No podemos eliminar este house porque ya tiene pagos registrados. Anula esos pagos primero e intenta de nuevo.";

const NOTICE_FIELDS = {
  id_modality: 1,
  id_shipment: 1,
  id_port_begin: 1,
  id_port_end: 1,
  id_proveedor: 1,
  id_consigner: 1,
  emailaddress_clientefinal: "cliente@example.com",
  id_operador: 1,
  fecha_etd: "2026-01-01",
  fecha_eta: "2026-02-01",
  bultos: 1,
  peso: 1,
  volumen: 1,
  monto: 10,
};

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });
const refusal = (mensaje) => ({ json: { status: 200, statusBol: true, estadoflag: false, mensaje, tipomensaje: "TMSGADV", data: [] } });

async function openList(page) {
  const list = page.waitForResponse((r) => r.url().includes("/listado_houses"), { timeout: 60_000 });
  await page.goto(LIST);
  const { data } = await (await list).json();
  await waitForPageToSettle(page);
  return data;
}

async function openHouse(page, houseId, completeHouse = false) {
  if (completeHouse) {
    await page.route(/\/house_ver\?/, async (route) => {
      const body = await (await route.fetch()).json();
      const [house] = body.data;
      const complete = { ...house };
      for (const [field, value] of Object.entries(NOTICE_FIELDS)) complete[field] ||= value;
      await route.fulfill({ json: { ...body, data: [complete] } });
    });
  }
  const view = page.waitForResponse((r) => r.url().includes("/house_ver?"));
  await page.goto(`/home/folderHouse/control/ver/${houseId}`);
  const body = await (await view).json();
  await waitForPageToSettle(page);
  return body;
}

async function openActions(page) {
  await page.locator("button:has(.mdi-tools)").click();
}

test.describe("M1 house file", () => {
  test("another company's house does not open", async ({ page }) => {
    const body = await openHouse(page, FOREIGN_HOUSE_ID);
    expect(body).toMatchObject({ estadoflag: false, data: [] });
    await expect(page.getByLabel("N° de Expedientes Master")).toHaveValue("");
  });

  test("the list filters by the fields the API reads and Limpiar shows the whole list again", async ({ page }) => {
    await openList(page);
    await page.getByRole("button", { name: "FILTRAR" }).click();
    await pickFirstOption(page, "Sentido");
    await pickFirstOption(page, "Tipo Embarque");
    const filtered = page.waitForRequest((r) => r.url().includes("/listado_houses"));
    await page.getByRole("button", { name: "Aceptar" }).click();
    const filters = new URL((await filtered).url()).searchParams;
    expect(filters.get("id_modality")).toMatch(/^\d+$/);
    expect(filters.get("id_shipment")).toMatch(/^\d+$/);
    expect([filters.has("id_sentido"), filters.has("id_tipo_embarque")]).toEqual([false, false]);
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "FILTRAR" }).click();
    const cleared = page.waitForRequest((r) => r.url().includes("/listado_houses"));
    await page.getByRole("button", { name: "Limpiar" }).click();
    expect([...new URL((await cleared).url()).searchParams.keys()]).toEqual([]);
  });

  test("the list's folder dialog saves the URL on the house's master", async ({ page }) => {
    const [house] = await openList(page);
    await page.getByLabel("Buscar").fill(house.nro_hbl ?? house.code_master);
    const row = page.locator("tbody tr").filter({ hasText: house.code_master }).first();
    await row.locator(".mdi-folder").click();
    let sent;
    await page.route(/\/actualizar_folder_onedrive_master$/, (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill(refusal("Esa carpeta no está en el OneDrive de tu empresa."));
    });
    await page.getByLabel("Nueva URL").fill("https://example.com/folder");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Esa carpeta no está en el OneDrive de tu empresa.")).toBeVisible();
    expect(sent).toMatchObject({ id: house.id_master });
  });

  test("the list's comment is signed by the session user unless the writer picks another executive", async ({ page }) => {
    const executives = page.waitForResponse((r) => r.url().includes("/getModulesEntities"), { timeout: 60_000 });
    const [house] = await openList(page);
    const { data: people } = await (await executives).json();
    const [sessionEntity, token] = await page.evaluate(() => [JSON.parse(sessionStorage.getItem("dataUser"))[0].id, sessionStorage.getItem("auth-token")]);
    const other = people.find((person) => person.id_entitie !== sessionEntity && /^[A-Z]+( [A-Z]+)+$/.test(person.name));
    let sent;
    await page.route(/\/insertComentarioHouse$/, (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill({ json: { status: 200, statusBol: true, estadoflag: true, mensaje: "Registro Correcto.", tipomensaje: "TMSGINF", data: [], token } });
    });

    await page.getByLabel("Buscar").fill(house.nro_hbl ?? house.code_master);
    await page.locator("tbody tr").filter({ hasText: house.code_master }).first().locator(".mdi-chat-plus").click();
    const dialog = page.locator(".v-overlay--active").filter({ hasText: "Registro de Estado/ Comentario" });
    await expect(dialog.locator(".v-autocomplete__selection")).toHaveText(people.find((person) => person.id_entitie === sessionEntity).name);

    await searchAndPick(page, "Ejecutivo", other.name);
    await dialog.getByLabel("Estado/ Comentario").fill("Sigue en aduana");
    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(dialogWith(page, "Registro Correcto.")).toBeVisible();
    expect(sent).toMatchObject({ id_house: house.id, id_entities: other.id_entitie, comentario: "Sigue en aduana" });
  });

  test("the arrival notice says why it was not sent and never claims it was", async ({ page }) => {
    const [house] = await openList(page);
    await openHouse(page, house.id, true);
    await page.route(/\/sendNotificacionHouse$/, (route) => route.fulfill(refusal(SMTP_MISSING)));
    await openActions(page);
    await page.getByRole("button", { name: "Notificaciones", exact: true }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Enviar aviso al cliente" });
    await pickFirstOption(page, "Aviso");
    await dialog.getByRole("checkbox").first().check();
    await dialog.getByRole("button", { name: "Enviar aviso" }).click();
    await expect(dialog.getByText(SMTP_MISSING)).toBeVisible();
    await expect(page.getByText(/enviad[oa]/i)).toHaveCount(0);
  });

  test("a delete the server refuses keeps the house open and explains why", async ({ page }) => {
    const [house] = await openList(page);
    await openHouse(page, house.id);
    await page.route(/\/setHouseDelete$/, (route) => route.fulfill(refusal(HAS_PAYMENTS)));
    await openActions(page);
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(dialogWith(page, HAS_PAYMENTS)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/control/ver/${house.id}$`));
  });

  test("the arrival notice template opens with content and explains a refused save", async ({ page }) => {
    const template = page.waitForResponse((r) => r.url().includes("/get_ver_configaviso"));
    await page.goto("/home/folderHouse/confAvisoLlegada");
    expect((await (await template).json()).data[0].aviso_llegada).toBeTruthy();
    await waitForPageToSettle(page);
    await page.route(/\/actualizarConfigAviso$/, (route) => route.fulfill(refusal("Escribe el contenido del aviso antes de guardarlo.")));
    await page.getByRole("button", { name: "Guardar contenido" }).click();
    await expect(dialogWith(page, "Escribe el contenido del aviso antes de guardarlo.")).toBeVisible();
  });
});
