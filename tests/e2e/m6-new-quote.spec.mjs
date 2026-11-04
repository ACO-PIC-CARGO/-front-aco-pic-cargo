import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickFirstOption, pickOption, searchAndPick } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const NEW_QUOTE = "/home/folderPricing/newQuote";
const CLIENT = "ZEVALLOS ALFONSO";
const LOADING_TEXT = "Cargando Datos, espere un momento por favor...";
const CONNECTION_ERROR = "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";

const pricingState = (page) =>
  page.evaluate(() => {
    const pinia = document.querySelector("#app").__vue_app__.config.globalProperties.$pinia;
    return JSON.parse(JSON.stringify(pinia.state.value.pricing));
  });

async function fillHeader(page, { direction, shipment, incoterm }) {
  await pickFirstOption(page, "Tipo de Marketing");
  await page.getByLabel("Nombre del cliente", { exact: true }).click();
  const clientDialog = page.getByRole("dialog").filter({ hasText: "Buscar Cliente" });
  await clientDialog.getByLabel("Buscar...").fill(CLIENT);
  await clientDialog.getByRole("button", { name: "Seleccionar" }).first().click();
  if (direction) await pickOption(page, "Sentido", direction);
  else await pickFirstOption(page, "Sentido");
  await pickOption(page, "Tipo de Embarque", shipment);
  await pickOption(page, "Incoterms", incoterm);
  await page.getByRole("button", { name: "Continuar Datos Carga" }).click();
}

async function fillCargo(page, ports) {
  if (ports) {
    await searchAndPick(page, "Puerto Origen", ports.origin);
    await searchAndPick(page, "Puerto Destino", ports.destination);
  } else {
    await pickFirstOption(page, "Puerto Origen");
    await pickFirstOption(page, "Puerto Destino");
  }
  const customsEntry = outsideInert(page, page.getByRole("combobox", { name: "Primera o Segunda Importación", exact: true }));
  if (await customsEntry.isVisible()) await pickFirstOption(page, "Primera o Segunda Importación");
  await page.getByLabel("Número Bultos").fill("2");
  await page.getByLabel("Volumen", { exact: true }).fill("1.5");
  await page.getByLabel("Peso", { exact: true }).fill("120");
  await page.getByRole("button", { name: "AGREGAR" }).click();
  await page.getByRole("button", { name: "Continuar Servicios" }).click();
  await expect(page.getByText("SERVICIOS A REALIZAR:")).toBeVisible();
}

async function continueToQuoteChoice(page) {
  const destinationTransport = page.getByRole("checkbox", { name: "TRANSPORTE EN DESTINO" });
  if (await destinationTransport.count()) {
    await expect(async () => {
      await destinationTransport.uncheck({ force: true });
      await expect(destinationTransport).not.toBeChecked();
    }).toPass();
  }
  await outsideInert(page, page.getByLabel("Valor de la mercancia").filter({ visible: true })).fill("1000");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Guardar Borrador" })).toBeVisible();
}

async function openLclFobQuote(page) {
  await page.goto(NEW_QUOTE);
  await waitForPageToSettle(page);
  await fillHeader(page, { shipment: /LCL/, incoterm: /^FOB/ });
  await fillCargo(page, { origin: "callao", destination: "shanghai" });
}

test.describe("new quote", () => {
  test.describe.configure({ timeout: 240_000 });

  test("starts in the company's default status, or the first PRELIMINAR one", async ({ page }) => {
    const statusesAnswer = page.waitForResponse((r) => r.url().endsWith("/getQuoteStatus"));
    await page.goto(NEW_QUOTE);
    const statuses = (await (await statusesAnswer).json()).data;
    await waitForPageToSettle(page);
    const isOn = (v) => v === 1 || v === "1" || v === true;
    const expected =
      statuses.find((s) => isOn(s.defaultstatus)) ?? statuses.find((s) => s.status == 1 && /preliminar/i.test(s.name));

    expect((await pricingState(page)).datosPrincipales.id_status).toBe(expected.id);
    const statusField = page.locator(".v-autocomplete").filter({ has: page.getByRole("combobox", { name: "Estado de la cotización" }) });
    await expect(statusField).toContainText(expected.name);
  });

  for (const [failure, answer, message] of [
    ["the server or network fails", { status: 500, body: "" }, CONNECTION_ERROR],
    [
      "the database refuses the data",
      { status: 200, contentType: "application/json", body: JSON.stringify({ estadoflag: false, mensaje: "Falta el puerto de destino. Elígelo y vuelve a guardar.", tipomensaje: "TMSGERR", data: [] }) },
      "Falta el puerto de destino. Elígelo y vuelve a guardar.",
    ],
  ]) {
    test(`a draft save that fails because ${failure} explains why and keeps the quote`, async ({ page }) => {
      await page.route("**/setQuote", (route) => route.fulfill(answer));
      await openLclFobQuote(page);
      await continueToQuoteChoice(page);

      await page.getByRole("button", { name: "Guardar Borrador" }).click();

      const dialog = page.getByRole("dialog").filter({ hasText: "No se guardó la cotización" });
      await expect(dialog).toContainText(message);
      await expect(page.getByText(LOADING_TEXT).first()).toBeHidden();
      await dialog.getByRole("button", { name: "OK" }).click();
      await expect(page.getByLabel("Nombre del cliente", { exact: true })).toHaveValue(new RegExp(CLIENT, "i"));
      await expect(page).toHaveURL(new RegExp(`${NEW_QUOTE}$`));
    });
  }

  test("changing the incoterm after the services step loads that incoterm's services", async ({ page }) => {
    await openLclFobQuote(page);

    await pickOption(page, "Incoterms", /^EXW/);

    await expect(async () => {
      const { datosPrincipales, preServices, listServices } = await pricingState(page);
      const shipmentId = datosPrincipales.idtipocarga.id ?? datosPrincipales.idtipocarga;
      const template = preServices
        .filter((s) => s.id_incoterms == datosPrincipales.idincoterms && s.id_modality == datosPrincipales.idsentido && s.id_shipment == shipmentId)
        .map((s) => s.id)
        .sort();
      expect(listServices.map((s) => s.id).sort()).toEqual(template);
    }).toPass({ timeout: 15_000 });
  });

  test("a transit time that is not a whole number of days is refused", async ({ page }) => {
    await openLclFobQuote(page);
    await continueToQuoteChoice(page);
    await page.getByRole("button", { name: "Pasar a Cotizar" }).click();

    await page.getByLabel("Tiempo en tránsito de la Opción 1").fill("2.5");
    await page.getByRole("button", { name: /INGRESAR COSTOS OPCIÓN 1/ }).click();

    await expect(page.getByText("Ingresa un número entero mayor que 0.").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /GUARDAR COSTOS OPCIÓN 1/ })).toBeHidden();
  });

  test("cost lines whose multiplier is not active for the shipment do not block the save, as the original did", async ({ page }) => {
    const saves = [];
    await page.route("**/setQuote", (route) => {
      saves.push(route.request().postDataJSON());
      return route.fulfill({ status: 500, body: "" });
    });
    await page.goto(NEW_QUOTE);
    await waitForPageToSettle(page);
    await fillHeader(page, { direction: /IMPORT/i, shipment: /A[EÉ]REO/i, incoterm: /^EXW/ });
    await fillCargo(page);
    await continueToQuoteChoice(page);
    const { opcionCostos, listMultiplicador } = await pricingState(page);
    const invalid = [
      ...new Set(
        opcionCostos[0].listCostos
          .filter((c) => c.status == 1 && c.id_multiplicador && !listMultiplicador.some((m) => m.id == c.id_multiplicador))
          .map((c) => c.nameservice),
      ),
    ];
    test.skip(invalid.length === 0, "this company's air EXW import template has no line with an inactive multiplier");

    await page.getByRole("button", { name: "Guardar Borrador" }).click();

    await expect.poll(() => saves.length).toBe(1);
    await expect(page.getByRole("dialog").filter({ hasText: "Revisa la cotización antes de guardar" })).toHaveCount(0);
  });

  test("Nuevo Cliente creates a client even after a House left its consignee loaded", async ({ page }) => {
    const clientReads = [];
    page.on("request", (request) => {
      if (/\/ver_cliente\?/.test(request.url())) clientReads.push(request.url());
    });
    await page.goto(NEW_QUOTE);
    await waitForPageToSettle(page);
    await page.evaluate(() => {
      const pinia = document.querySelector("#app").__vue_app__.config.globalProperties.$pinia;
      pinia.state.value.app.house_id_consigner = 1;
    });

    await page.getByLabel("Nombre del cliente", { exact: true }).click();
    await page.getByRole("dialog").filter({ hasText: "Buscar Cliente" }).getByRole("button", { name: "Nuevo Cliente" }).click();

    await expect(page.getByText("Ficha de Clientes")).toBeVisible();
    await page.waitForTimeout(2_000);
    expect(clientReads).toEqual([]);
  });
});
