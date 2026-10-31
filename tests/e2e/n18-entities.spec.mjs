import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { credentials } from "./support/env.mjs";
import { outsideInert, pickOption, searchAndPick } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const CLIENT_WITH_QUOTES_ID = 11;
const PROVIDER_WITH_EMAILS_AND_RATE_CONTACTS = { id: 11454, rateContact: "Veyra Arauz" };
const LOADING_TEXT = "Cargando Datos, espere un momento por favor...";

const uniqueName = (label) => `E2E N18 ${label} ${Date.now()}`;
const randomDigits = (length) => Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
const randomPhone = () => `9${randomDigits(8)}`;

const main = (page) => page.getByRole("main");
const visible = (locator) => locator.filter({ visible: true }).first();
const rowWith = (page, text) => page.getByRole("row").filter({ hasText: text });
const filterDrawer = (page) => outsideInert(page, page.getByRole("navigation").filter({ hasText: "FILTRAR REGISTROS" }));
const visibleTable = (page, { with: header, without }) => {
  let table = main(page).getByRole("table").filter({ visible: true }).filter({ has: page.getByRole("columnheader", { name: header, exact: true }) });
  if (without) table = table.filter({ hasNot: page.getByRole("columnheader", { name: without, exact: true }) });
  return table;
};
const phonesTable = (page) => visibleTable(page, { with: "Tipo de Teléfono", without: "Nombres" });
const emailsTable = (page) => visibleTable(page, { with: "Descripción" });
const phoneRows = (page, phone) => phonesTable(page).getByRole("row", { name: phone });
const firstStepHeader = (page) => main(page).getByText(/Identificación del (Cliente|Proveedor)/);

async function acknowledge(page, message, button = /^ok$/i) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: button }).click();
  await expect(alert).toBeHidden();
}

async function leaveFirstStepFor(page, title) {
  await main(page).getByRole("button", { name: new RegExp(`${title}$`) }).click();
  await expect(firstStepHeader(page)).toBeHidden();
}

async function openNuevoFromMenu(page, { link, listPath }) {
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("treeitem", { name: "FICHEROS" }).click();
  await page.getByRole("treeitem", { name: "CLIENTES Y PROVEEDORES" }).click();
  await page.getByRole("link", { name: link, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${listPath}$`));
  await waitForPageToSettle(page);
  await page.getByRole("button", { name: "NUEVO", exact: true }).click();
}

async function waitForEmptyNewForm(page, nameLabel) {
  await expect(visible(main(page).getByRole("combobox", { name: "Tipo de Teléfono", exact: true }))).toHaveValue("WhatsApp");
  await expect(main(page).getByRole("textbox", { name: nameLabel })).toHaveValue("");
}

async function fillName(page, label, name) {
  await main(page).getByRole("textbox", { name: label }).fill(name);
  // closes the list of similar names, which covers the fields below it
  await firstStepHeader(page).click();
}

async function continueUntil(page, saveButton) {
  await expect(async () => {
    await visible(main(page).getByRole("button", { name: "Continuar" })).click({ timeout: 2_000 });
    await expect(page.getByRole("button", { name: saveButton })).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function fillMainPhoneAndContact(page, phone) {
  const phoneFields = main(page).getByRole("textbox", { name: "Teléfono", exact: true });
  await phoneFields.first().fill(phone);
  await main(page).getByRole("textbox", { name: "Nombre", exact: true }).fill("Contacto E2E");
  await phoneFields.nth(1).fill(randomPhone());
}

async function fillNewClientDetails(page, { name, phone }) {
  await waitForEmptyNewForm(page, "Nombre Completo");
  await fillName(page, "Nombre Completo", name);
  await main(page).getByRole("textbox", { name: "Nro De Documento" }).fill(randomDigits(8));
  await searchAndPick(page, "País", "Peru");
  await fillMainPhoneAndContact(page, phone);
  await main(page).getByRole("button", { name: "Agregar Más" }).click();
  await expect(firstStepHeader(page)).toBeHidden();
}

async function createClient(page, { name, phone, email }) {
  await page.goto("/home/folderEntities/nuevo-cliente");
  await waitForPageToSettle(page);
  await fillNewClientDetails(page, { name, phone });
  if (email) {
    await main(page).getByRole("button", { name: "Agregar Email" }).click();
    const fields = emailsTable(page).getByRole("textbox");
    await fields.nth(0).fill("Facturación");
    await fields.nth(1).fill(email);
  }
  await continueUntil(page, "Guardar CLIENTE");
  await page.getByRole("button", { name: "Guardar CLIENTE" }).click();
  await acknowledge(page, "Registro Correcto", "Ir al listado");
  await expect(page).toHaveURL(/\/listado-cliente$/);
  await waitForPageToSettle(page);
}

async function openListedEntity(page, name, icon) {
  await page.getByRole("textbox", { name: "Buscar" }).fill(name);
  await rowWith(page, name).locator(icon).click();
  await waitForPageToSettle(page);
}

async function addPhone(page, phone) {
  await visible(main(page).getByRole("button", { name: "Agregar Teléfono" })).click();
  const newRow = phonesTable(page).getByRole("row", { name: "+51", exact: true });
  await newRow.getByRole("combobox").last().click({ force: true });
  await outsideInert(page, page.getByRole("option", { name: "WhatsApp", exact: true })).first().click();
  await newRow.getByRole("textbox").fill(phone);
}

async function saveClientChanges(page) {
  await visible(main(page).getByRole("button", { name: "GUARDAR CAMBIOS" })).click();
  await acknowledge(page, "Cliente actualizado");
  await expect(visible(main(page).getByRole("button", { name: "EDITAR CLIENTE" }))).toBeVisible();
}

async function reopenPhonesStep(page) {
  await page.reload();
  await waitForPageToSettle(page);
  await leaveFirstStepFor(page, "Teléfonos y Contactos");
}

const sessionUser = (page) =>
  page.evaluate(() => {
    const base64 = sessionStorage.getItem("auth-token").split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    let payload = JSON.parse(atob(base64));
    while (payload.userId) payload = payload.userId;
    return { tokenUser: payload.data.id, dataUser: sessionStorage.getItem("dataUser") };
  });

const adminDialog = (page) => page.getByRole("dialog").filter({ hasText: "Se necesita un administrador" });

async function authorizeAs(page, { user, password }) {
  const dialog = adminDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Usuario o correo del administrador").fill(user);
  await dialog.getByPlaceholder("Contraseña").fill(password);
  await dialog.getByRole("button", { name: "Autorizar" }).click();
}

const wrongAdmin = () => ({ user: `e2e.not.admin.${Date.now()}`, password: "wrong-password-e2e" });

async function expectReadOnlyClient(page) {
  await expect(visible(main(page).getByRole("button", { name: "EDITAR CLIENTE" }))).toBeVisible();
  await expect(main(page).getByRole("button", { name: "GUARDAR CAMBIOS" })).toHaveCount(0);
  await expect(main(page).getByRole("textbox", { name: "Nombre Completo" })).not.toBeEditable();
}

async function exportListAndKeepWorking(page, fileName) {
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "EXPORTAR" }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toMatch(new RegExp(`^${fileName} .+\\.xlsx$`));
  expect(readFileSync(await download.path()).subarray(0, 2).toString()).toBe("PK");
  await expect(page.getByText(LOADING_TEXT).first()).toBeHidden();
  await page.getByRole("button", { name: "FILTRAR", exact: true }).click();
  await expect(filterDrawer(page)).toBeVisible();
}

async function fillNewProviderUpToRateContacts(page, name) {
  await waitForEmptyNewForm(page, "Nombre Comercial o Razón Social");
  await pickOption(page, "Tipo de Proveedor", /^00 - Proveedor$/);
  await fillName(page, "Nombre Comercial o Razón Social", name);
  await searchAndPick(page, "País", "Peru");
  await main(page).getByRole("textbox", { name: "Email Soporte" }).fill("soporte.e2e@example.com");
  await fillMainPhoneAndContact(page, randomPhone());
  await continueUntil(page, "Guardar Proveedor");
}

async function saveNewProvider(page) {
  const saving = page.waitForRequest((request) => request.url().includes("registrar_proveedor"));
  await page.getByRole("button", { name: "Guardar Proveedor" }).click();
  const sent = (await saving).postDataJSON();
  await acknowledge(page, "Registro Correcto", "Ir al listado");
  await expect(page).toHaveURL(/\/listado-proveedores$/);
  await waitForPageToSettle(page);
  return sent;
}

test.describe("Clientes", () => {
  test("EXPORTAR downloads the client workbook and leaves the list usable", async ({ page }) => {
    test.slow();
    await page.goto("/home/folderEntities/listado-cliente");
    await waitForPageToSettle(page);

    await exportListAndKeepWorking(page, "Listado Cliente");
  });

  test.describe("a client with movements", () => {
    test("Ver > EDITAR CLIENTE asks for an administrator and wrong credentials keep it read-only", async ({ page }) => {
      const signIns = [];
      page.on("request", (request) => {
        if (request.url().includes("singin")) signIns.push(request.url());
      });
      await page.goto(`/home/folderEntities/ver-cliente/${CLIENT_WITH_QUOTES_ID}`);
      await waitForPageToSettle(page);
      const operator = await sessionUser(page);

      await visible(main(page).getByRole("button", { name: "EDITAR CLIENTE" })).click();
      await authorizeAs(page, wrongAdmin());
      await expect(adminDialog(page).getByText("Datos Incorrectos")).toBeVisible();
      await adminDialog(page).getByRole("button", { name: "Cancelar" }).click();

      await expect(adminDialog(page)).toBeHidden();
      await expectReadOnlyClient(page);
      expect(await sessionUser(page)).toEqual(operator);
      expect(signIns).toEqual([]);
    });

    test("typing the editar URL asks for an administrator and cancelling returns to Ver", async ({ page }) => {
      await page.goto(`/home/folderEntities/editar-cliente/${CLIENT_WITH_QUOTES_ID}`);
      await waitForPageToSettle(page);

      await authorizeAs(page, wrongAdmin());
      await expect(adminDialog(page).getByText("Datos Incorrectos")).toBeVisible();
      await adminDialog(page).getByRole("button", { name: "Cancelar" }).click();

      await expect(page).toHaveURL(new RegExp(`/ver-cliente/${CLIENT_WITH_QUOTES_ID}$`));
      await waitForPageToSettle(page);
      await expectReadOnlyClient(page);
    });

    test("an administrator's approval opens the editar URL without replacing the operator's session", async ({ page }) => {
      const signIns = [];
      page.on("request", (request) => {
        if (request.url().includes("singin")) signIns.push(request.url());
      });
      await page.goto(`/home/folderEntities/ver-cliente/${CLIENT_WITH_QUOTES_ID}`);
      await waitForPageToSettle(page);
      const operator = await sessionUser(page);
      await page.goto(`/home/folderEntities/editar-cliente/${CLIENT_WITH_QUOTES_ID}`);
      await waitForPageToSettle(page);

      const { user, password } = credentials();
      await authorizeAs(page, { user, password });

      await expect(adminDialog(page)).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`/editar-cliente/${CLIENT_WITH_QUOTES_ID}$`));
      await expect(visible(main(page).getByRole("button", { name: "GUARDAR CAMBIOS" }))).toBeVisible();
      await expect(main(page).getByRole("textbox", { name: "Nombre Completo" })).toBeEditable();
      expect(await sessionUser(page)).toEqual(operator);
      expect(signIns).toEqual([]);
    });
  });

  test("Nuevo starts without the emails of the last client viewed", async ({ page }) => {
    test.slow();
    const name = uniqueName("CLIENTE");
    const email = `e2e.n18.${Date.now()}@example.com`;
    await createClient(page, { name, phone: randomPhone(), email });
    await openListedEntity(page, name, ".mdi-eye");
    await leaveFirstStepFor(page, "Teléfonos y Contactos");
    await expect(emailsTable(page).getByRole("row", { name: email })).toBeVisible();

    await openNuevoFromMenu(page, { link: "CLIENTES", listPath: "/listado-cliente" });
    await fillNewClientDetails(page, { name: uniqueName("CLIENTE"), phone: randomPhone() });

    await expect(emailsTable(page).getByText("No data available")).toBeVisible();
    await expect(emailsTable(page).getByRole("row", { name: email })).toHaveCount(0);
  });

  test("saving a new phone twice in the same visit keeps one copy of it", async ({ page }) => {
    test.slow();
    const name = uniqueName("CLIENTE");
    const phone = randomPhone();
    await createClient(page, { name, phone: randomPhone() });
    await openListedEntity(page, name, ".mdi-pencil");
    await leaveFirstStepFor(page, "Teléfonos y Contactos");

    await addPhone(page, phone);
    await saveClientChanges(page);
    await visible(main(page).getByRole("button", { name: "EDITAR CLIENTE" })).click();
    await acknowledge(page, "Ahora puede modificar los campos");
    await saveClientChanges(page);

    await reopenPhonesStep(page);
    await expect(phoneRows(page, phone)).toHaveCount(1);
  });

  test("a phone deleted while another is added stays deleted after reload", async ({ page }) => {
    test.slow();
    const name = uniqueName("CLIENTE");
    const deletedPhone = randomPhone();
    const addedPhone = randomPhone();
    await createClient(page, { name, phone: deletedPhone });
    await openListedEntity(page, name, ".mdi-pencil");
    await leaveFirstStepFor(page, "Teléfonos y Contactos");

    await phoneRows(page, deletedPhone).getByRole("button").click();
    await addPhone(page, addedPhone);
    await saveClientChanges(page);

    await reopenPhonesStep(page);
    await expect(phoneRows(page, deletedPhone)).toHaveCount(0);
    await expect(phoneRows(page, addedPhone)).toHaveCount(1);
  });
});

test.describe("Proveedores", () => {
  test("EXPORTAR downloads the provider workbook and leaves the list usable", async ({ page }) => {
    test.slow();
    await page.goto("/home/folderEntities/listado-proveedores");
    await waitForPageToSettle(page);

    await exportListAndKeepWorking(page, "Listado Proveedor");
  });

  test("a filter with no matches ends with an empty list", async ({ page }) => {
    await page.goto("/home/folderEntities/listado-proveedores");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "FILTRAR", exact: true }).click();
    const drawer = filterDrawer(page);
    await drawer.getByLabel("Nombre Comercial/ Razón Social", { exact: true }).fill(uniqueName("sin resultados"));
    await drawer.getByRole("button", { name: "Filtrar", exact: true }).click();

    await acknowledge(page, "No se encontraron registros");
    await expect(drawer).toBeHidden();
    await expect(page.getByText(LOADING_TEXT).first()).toBeHidden();
    await expect(page.getByText("No data available")).toBeVisible();
  });

  test("a correlativo with decimals is refused before searching", async ({ page }) => {
    const searchesByCorrelativo = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.endsWith("listado_proveedor") && url.searchParams.get("correlativo")) searchesByCorrelativo.push(url.href);
    });
    await page.goto("/home/folderEntities/listado-proveedores");
    await waitForPageToSettle(page);

    await page.getByRole("button", { name: "FILTRAR", exact: true }).click();
    const drawer = filterDrawer(page);
    await drawer.getByLabel("Correlativo", { exact: true }).fill("1.5");
    await drawer.getByRole("button", { name: "Filtrar", exact: true }).click();

    await expect(drawer.getByText("Escribe solo el número del correlativo")).toBeVisible();
    await expect(drawer).toBeVisible();
    await expect(page.getByText(LOADING_TEXT).first()).toBeHidden();
    expect(searchesByCorrelativo).toEqual([]);
  });

  test("the edit steps refuse to save a provider without a name", async ({ page }) => {
    test.slow();
    const name = uniqueName("PROVEEDOR");
    await page.goto("/home/folderEntities/nuevo-proveedor");
    await waitForPageToSettle(page);
    await fillNewProviderUpToRateContacts(page, name);
    await saveNewProvider(page);
    await openListedEntity(page, name, ".mdi-pencil");
    const updates = [];
    page.on("request", (request) => {
      if (request.url().includes("actualizar_proveedor")) updates.push(request.url());
    });

    await main(page).getByRole("textbox", { name: "Nombre Comercial o Razón Social" }).fill("");
    await leaveFirstStepFor(page, "Teléfonos y Contactos");
    await visible(main(page).getByRole("button", { name: "GUARDAR CAMBIOS" })).click();

    await acknowledge(page, "Completa el nombre, el tipo de proveedor");
    expect(updates).toEqual([]);
    await page.reload();
    await waitForPageToSettle(page);
    await expect(main(page).getByRole("textbox", { name: "Nombre Comercial o Razón Social" })).toHaveValue(new RegExp(`^${name}$`, "i"));
  });

  test("Nuevo starts without the last provider's emails and rate contacts", async ({ page }) => {
    test.slow();
    const { id, rateContact } = PROVIDER_WITH_EMAILS_AND_RATE_CONTACTS;
    await page.goto(`/home/folderEntities/ver-proveedor/${id}`);
    await waitForPageToSettle(page);
    await leaveFirstStepFor(page, "Correo para Pedir Tarifa");
    await expect(main(page).getByRole("row", { name: rateContact })).toBeVisible();
    await expect(main(page).getByRole("checkbox", { name: "Es principal" })).toBeChecked();

    await openNuevoFromMenu(page, { link: "PROVEEDORES", listPath: "/listado-proveedores" });
    await fillNewProviderUpToRateContacts(page, uniqueName("PROVEEDOR"));

    await expect(main(page).getByRole("row", { name: rateContact })).toHaveCount(0);
    await expect(main(page).getByRole("checkbox", { name: "Es principal" })).not.toBeChecked();
    const sent = await saveNewProvider(page);
    expect(sent.lstEmails).toEqual([]);
    expect(sent.datosTarifa).toEqual([]);
  });
});
