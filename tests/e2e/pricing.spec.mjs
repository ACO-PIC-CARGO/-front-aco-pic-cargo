import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickFirstOption, pickOption, searchAndPick } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const QUOTE_DATA = {
  client: "ZEVALLOS ALFONSO",
  originPort: "callao",
  destinationPort: "shanghai",
};

async function openQuoteRow(page, action, quoteNumber) {
  await page.goto("/home/folderPricing/lstQuote");
  await waitForPageToSettle(page);
  await page.getByLabel("Buscar").fill(quoteNumber);
  const row = page.getByRole("row").filter({ hasText: quoteNumber }).first();
  await expect(row).toContainText(QUOTE_DATA.client);
  await row.getByRole("button", { name: action }).click();
}

test("creates a draft quote, then views and edits it from the list", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/home/folderPricing/newQuote");
  await waitForPageToSettle(page);

  await pickFirstOption(page, "Tipo de Marketing");
  await page.getByLabel("Nombre del cliente", { exact: true }).click();
  const clientDialog = page.getByRole("dialog").filter({ hasText: "Buscar Cliente" });
  await clientDialog.getByLabel("Buscar...").fill(QUOTE_DATA.client);
  await clientDialog.getByRole("button", { name: "Seleccionar" }).first().click();
  await expect(page.getByLabel("Nombre del cliente", { exact: true })).toHaveValue(new RegExp(QUOTE_DATA.client, "i"));
  await pickFirstOption(page, "Sentido");
  await pickOption(page, "Tipo de Embarque", /LCL/);
  await pickOption(page, "Incoterms", /^FOB/);
  await page.getByRole("button", { name: "Continuar Datos Carga" }).click();

  await searchAndPick(page, "Puerto Origen", QUOTE_DATA.originPort);
  await searchAndPick(page, "Puerto Destino", QUOTE_DATA.destinationPort);
  await pickFirstOption(page, "Primera o Segunda Importación");
  await page.getByLabel("Número Bultos").fill("2");
  await page.getByLabel("Volumen", { exact: true }).fill("1.5");
  await page.getByLabel("Peso", { exact: true }).fill("120");
  await page.getByRole("button", { name: "AGREGAR" }).click();
  await page.getByRole("button", { name: "Continuar Servicios" }).click();

  const destinationTransport = page.getByRole("checkbox", { name: "TRANSPORTE EN DESTINO" });
  await expect(async () => {
    await destinationTransport.uncheck({ force: true });
    await expect(destinationTransport).not.toBeChecked();
  }).toPass();
  await outsideInert(page, page.getByLabel("Valor de la mercancia").filter({ visible: true })).fill("1000");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const saved = page.waitForResponse((r) => r.url().endsWith("/setQuote") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Guardar Borrador" }).click();
  const { insertId, nro_quote } = await (await saved).json();
  const quoteId = String(insertId);
  const quoteNumber = String(nro_quote).match(/\d+/)[0];
  await page.getByRole("button", { name: "Ir al listado" }).click();
  await expect(page).toHaveURL(/\/home\/folderPricing\/lstQuote$/);

  await openQuoteRow(page, "Ver cotización", quoteNumber);
  await expect(page).toHaveURL(new RegExp(`/home/folderPricing/verQuote/${quoteId}(/|$)`));
  await expect(page.getByText(new RegExp(String.raw`VER\s+COTIZACIÓN - \S*${quoteNumber}`))).toBeVisible();
  await expect(page.getByText("SERVICIOS A REALIZAR:")).toBeVisible();

  await openQuoteRow(page, "Editar cotización", quoteNumber);
  await expect(page).toHaveURL(new RegExp(`/home/folderPricing/editQuote/${quoteId}$`));
  await expect(page.getByText(new RegExp(String.raw`EDITAR\s+COTIZACIÓN - \S*${quoteNumber}`))).toBeVisible();
  await page.getByRole("button", { name: "GUARDAR", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/home/folderPricing/verQuote/${quoteId}(/|$)`));
});
