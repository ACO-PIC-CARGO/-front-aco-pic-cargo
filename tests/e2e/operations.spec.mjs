import { test, expect } from "./fixtures.mjs";
import { pickFirstOption, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const isoDate = (daysFromToday) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
};

test("creates a master from scratch and assigns the house client", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/home/folderMaster/list");
  await waitForPageToSettle(page);
  await page.getByRole("button", { name: "NUEVO EXPEDIENTE" }).click();
  await page.getByRole("button", { name: "Crear un expediente desde cero" }).click();
  await expect(page.getByText("CONTROL DE EXPEDIENTE MÁSTER")).toBeVisible();

  await pickFirstOption(page, "Sentido");
  await pickOption(page, "Tipo de Embarque", /LCL/);
  await pickFirstOption(page, "Incoterms");
  await pickFirstOption(page, "Origen");
  await pickFirstOption(page, "Destino");
  await page.getByLabel("Salida (ETD)").fill(isoDate(7));
  await page.getByLabel("Llegada (ETA)").fill(isoDate(37));
  await page.getByRole("button", { name: "Acciones" }).click();
  const masterSaved = page.waitForResponse((r) => r.url().endsWith("/setMaster") && r.request().method() === "POST");
  const houseSaved = page.waitForResponse((r) => r.url().endsWith("/setHouse") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  const [masterRow] = (await (await masterSaved).json()).data;
  const [houseRow] = await (await houseSaved).json().then((body) => body.data ?? body);
  expect(masterRow.id ?? masterRow.insertid, "master id from the save response").toBeTruthy();
  await expect(page).toHaveURL(new RegExp(`/home/folderHouse/control/editar/${houseRow.insertid}/1$`), { timeout: 60_000 });

  const clientDialog = page.getByRole("dialog").filter({ hasText: "Es Necesario que registre un cliente" });
  await clientDialog.getByLabel("Cliente HBL").click();
  const clientOption = page.getByRole("option").first();
  const clientName = (await clientOption.innerText()).trim();
  await clientOption.click();
  const houseUpdated = page.waitForResponse((r) => r.url().endsWith("/setHouseEdit") && r.request().method() === "PUT");
  await clientDialog.getByRole("button", { name: "Guardar" }).click();
  expect((await houseUpdated).ok()).toBe(true);
  await expect(page.locator(".swal2-popup")).toContainText("House actualizado éxitosamente");
  await page.getByRole("button", { name: "OK" }).click();
  await waitForPageToSettle(page);
  await page.goto(`/home/folderHouse/control/ver/${houseRow.insertid}`);
  await waitForPageToSettle(page);
  const savedClientName = clientName.replace(/\s*\(\d+\)\s*$/, "").replace(/\s+/g, " ").trim();
  await expect(page.getByText(/\[VER\]/)).toContainText(savedClientName);
});

const MASTER_CODE = /\d{4}MBL\d+/;

const masterCodeIn = (rowText) => {
  const code = rowText.match(MASTER_CODE)?.[0];
  if (!code) throw new Error(`No master code (e.g. 2026MBL00001) found in row text: ${JSON.stringify(rowText)}`);
  return code;
};

test("opens a master and a house in view mode from their lists", async ({ page }) => {
  await page.goto("/home/folderMaster/list");
  await waitForPageToSettle(page);
  const masterRow = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Ver master" }) }).first();
  const masterCode = masterCodeIn(await masterRow.innerText());
  await masterRow.getByRole("button", { name: "Ver master" }).click();
  await expect(page).toHaveURL(/\/home\/folderMaster\/control\/ver\/\d+$/);
  await expect(page.getByText(/CONTROL DE EXPEDIENTE MÁSTER \[MODO VISTA\]/)).toBeVisible();
  await expect(page.getByLabel("N° de Expedientes")).toHaveValue(masterCode);

  await page.goto("/home/folderHouse/list");
  await waitForPageToSettle(page);
  const houseRow = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Ver house" }) }).first();
  const houseMasterCode = masterCodeIn(await houseRow.innerText());
  await houseRow.getByRole("button", { name: "Ver house" }).click();
  await expect(page).toHaveURL(/\/home\/folderHouse\/control\/ver\/\d+$/);
  await expect(page.getByText(/\[VER\]/)).toBeVisible();
  await expect(page.getByLabel("N° de Expedientes Master")).toHaveValue(houseMasterCode);
});

test("adds an income line to an expense control", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/home/folderMaster/list");
  await waitForPageToSettle(page);
  const masterRow = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Ver master" }) }).first();
  const masterCode = masterCodeIn(await masterRow.innerText());
  await masterRow.getByRole("button", { name: "Ver master" }).click();
  const masterId = page.url().match(/\/control\/ver\/(\d+)$/)[1];

  await page.goto(`/home/folderBilling/editControlGastos/view/${masterId}/1`);
  await waitForPageToSettle(page);
  await expect(page.getByText(masterCode).first()).toBeVisible();
  const incomeRows = page.getByRole("row").filter({ hasText: /\(\d+\) - \d+/ });
  const operationsTotal = async () => {
    const totals = await incomeRows.evaluateAll((rows) => rows.map((row) => row.cells[3].innerText));
    return totals.reduce((sum, total) => sum + Number(total), 0);
  };
  const totalBefore = await operationsTotal();

  await page.getByRole("button", { name: /^(Nuevo Concepto|Nuevo Control de Gastos Ingresos)$/ }).first().click();
  const service = page.getByRole("dialog").filter({ hasText: "Datos del servicio" });
  await expect(async () => {
    await service.getByLabel("Correlativo").click();
    await page.getByRole("option").first().click({ timeout: 5_000 });
    await page.keyboard.press("Tab");
    await expect(service.getByRole("combobox").filter({ has: page.getByLabel("Correlativo") }).filter({ hasText: /\d{4}/ })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  const concept = `E2E ingreso ${Date.now()}`;
  await service.getByLabel("Concepto").fill(concept);
  await service.getByLabel("Moneda de Banco Salida").click();
  await page.getByRole("option", { name: /USD|DÓLAR/i }).first().click();
  await service.getByLabel("Monto").first().pressSequentially("100");
  const saved = page.waitForResponse((r) => r.url().endsWith("/setIngresos") && r.request().method() === "POST");
  await service.getByRole("button", { name: "Agregar servicio" }).click();
  const response = await saved;
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.statusBol, "setIngresos response").toBe(true);
  await expect(page.locator(".swal2-popup")).toContainText("Registro Corrrecto.");
  await page.getByRole("button", { name: "OK" }).click();
  await page.getByRole("cell", { name: /\(\d+\) - \d+/ }).first().click();
  await expect(page.getByText(concept)).toBeVisible();
  await expect.poll(operationsTotal).toBe(totalBefore + 100);
});

test("lists invoices", async ({ page }) => {
  await page.goto("/home/folderBilling/lstFacturacion");
  await waitForPageToSettle(page);
  await expect(page.getByText("LISTA DE FACTURAS")).toBeVisible();
});
