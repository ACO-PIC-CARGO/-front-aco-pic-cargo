import { test, expect } from "./fixtures.mjs";
import { pickFirstOption, pickOption, searchAndPick } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const QUOTE_DATA = {
  client: "ZEVALLOS ALFONSO",
  originPort: "callao",
  destinationPort: "shanghai",
};

async function openQuoteRow(page, action) {
  await page.goto("/home/folderPricing/lstQuote");
  await waitForPageToSettle(page);
  await page.getByLabel("Buscar").fill(QUOTE_DATA.client);
  await page.getByRole("row").filter({ hasText: QUOTE_DATA.client }).first().getByRole("button", { name: action }).click();
}

test("creates a draft quote, then views and edits it from the list", async ({ page }) => {
  test.setTimeout(120_000);
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
  await page.getByLabel("Volumen").fill("1.5");
  await page.getByLabel("Peso").fill("120");
  await page.getByRole("button", { name: "AGREGAR" }).click();
  await page.getByRole("button", { name: "Continuar Servicios" }).click();

  await page.getByText("TRANSPORTE EN DESTINO", { exact: true }).click();
  await page.getByLabel("Valor de la mercancia").filter({ visible: true }).fill("1000");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Guardar Borrador" }).click();
  await page.getByRole("button", { name: "Ir al listado" }).click();
  await expect(page).toHaveURL(/\/home\/folderPricing\/lstQuote$/);

  await openQuoteRow(page, "Ver cotización");
  await expect(page.getByText(/VER\s+COTIZACIÓN/)).toBeVisible();
  await expect(page.getByText("SERVICIOS A REALIZAR:")).toBeVisible();

  await openQuoteRow(page, "Editar cotización");
  await expect(page.getByText(/EDITAR\s+COTIZACIÓN/)).toBeVisible();
  await page.getByRole("button", { name: "GUARDAR", exact: true }).click();
  await expect(page).toHaveURL(/\/home\/folderPricing\/verQuote\/\d+/);
});
