import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { outsideInert, pickFirstOption, pickOption } from "./support/fields.mjs";
import { waitForPageToSettle } from "./support/page.mjs";
import { SESSION_FILE } from "./support/env.mjs";

const API = process.env.E2E_API_URL ?? "http://localhost:9200/";
const uniqueName = (label) => `E2E M8 ${label} ${Date.now()}`;
const openDialog = (page) => page.locator(".v-overlay--active .v-card").last();

function apiSession() {
  const { session } = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
  return { "auth-token": session["auth-token"], "x-branch-id": String(JSON.parse(session.dataUser)[0].id_branch) };
}

async function apiData(response) {
  const body = await response.json();
  expect(body.estadoflag, body.mensaje).toBe(true);
  return body.data;
}

async function listCompanies(request, params = {}) {
  const headers = apiSession();
  return apiData(await request.get(API + "listar_enterprise", { headers, params: { status: "", ...params } }));
}

async function createThrowawayCompany(request, label) {
  const headers = apiSession();
  const name = uniqueName(label);
  const email = `e2e.m8.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  const [sex] = await apiData(await request.post(API + `getSex?id_branch=${headers["x-branch-id"]}`, { headers }));
  await apiData(
    await request.post(API + "insertar_enterprise", {
      headers,
      data: {
        enterprise: { document: "E2E-M8", trade_name: name, business_name: name, slogan: "", address: "Av. E2E 123", status: 1, id_pais: 139, ic: "" },
        user: { names: "E2E", surname: "M8", second_surname: "Prueba", status: 1, id_sex: sex.id, users: email, email, phone: "987654321" },
      },
    })
  );
  const [company] = await listCompanies(request, { trade_name: name });
  return { id: company.id, name };
}

async function acknowledge(page, message) {
  const alert = page.getByRole("dialog").filter({ hasText: message });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: /^ok$/i }).click();
  await expect(alert).toBeHidden();
}

async function confirm(page, button) {
  await page.getByRole("button", { name: button }).click();
}

async function openEditor(page, company) {
  await page.goto(`/home/enterprise/update/${company.id}`);
  await waitForPageToSettle(page);
  await expect(page.getByRole("textbox", { name: "Nombre Comercial (*)" })).toHaveValue(company.name);
}

test("Cerrar closes the filter and stays on the companies list", async ({ page }) => {
  await page.goto("/home/enterprise/listado");
  await waitForPageToSettle(page);

  await page.getByRole("button", { name: "Filtrar" }).click();
  const drawer = outsideInert(page, page.getByRole("navigation").filter({ hasText: "Filtrar Registros" }));
  await drawer.getByRole("button", { name: "Cerrar" }).click();

  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/\/home\/enterprise\/listado$/);
});

test("editing a company saves that company only and keeps a 0 % tax and an inactive status", async ({ page, request }) => {
  const company = await createThrowawayCompany(request, "editar");
  const othersBefore = (await listCompanies(request)).filter((row) => row.id !== company.id);
  await openEditor(page, company);
  await pickFirstOption(page, "Tipo de Documento (*)");

  await page.getByLabel("Porcentaje").fill("500");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Escribe un porcentaje entre 0 y 100.")).toBeVisible();

  await page.getByLabel("Porcentaje").fill("0");
  await page.getByLabel("Activo / Inactivo").uncheck();
  await page.getByRole("button", { name: "Guardar" }).click();
  await acknowledge(page, /Guardamos los datos de la empresa/);

  const [saved] = await apiData(
    await request.get(API + `ver_enterprise?id=${company.id}`, { headers: apiSession() })
  );
  expect([saved.trade_name, Number(saved.impuesto), saved.status]).toEqual([company.name, 0, 0]);
  const before = new Set(othersBefore.map((row) => row.id));
  const othersAfter = (await listCompanies(request)).filter((row) => before.has(row.id));
  expect(othersAfter).toEqual(othersBefore);
});

test("registering a bank account keeps the dialog open on an error and saves it once fixed", async ({ page, request }) => {
  const company = await createThrowawayCompany(request, "cuentas");
  const bankName = uniqueName("banco");
  await openEditor(page, company);
  await page.getByRole("tab", { name: "Datos Bancarios" }).click();

  const fillAccount = async (number) => {
    const dialog = openDialog(page);
    await pickFirstOption(page, "Moneda");
    await dialog.getByLabel("Número Cuenta").fill(number);
    await dialog.getByLabel("CCI").fill(`CCI-${number}`);
    return dialog;
  };
  const newBankAccount = async (number) => {
    await page.getByRole("button", { name: "Nueva Cuenta" }).click();
    const dialog = openDialog(page);
    await expect(page.getByRole("combobox", { name: "Banco", exact: true })).toHaveValue("Crear Nuevo Banco");
    await dialog.getByLabel("Acrónimo Banco").fill("E2E");
    await dialog.getByLabel("Nombre Banco").fill(bankName);
    return fillAccount(number);
  };

  const first = await newBankAccount("111-001");
  await first.getByRole("button", { name: "Guardar" }).click();
  await acknowledge(page, "Guardamos la cuenta bancaria.");
  await expect(first).toBeHidden();
  await expect(page.getByRole("row").filter({ hasText: "111-001" })).toContainText(bankName);

  const second = await newBankAccount("222-002");
  await second.getByRole("button", { name: "Guardar" }).click();
  await acknowledge(page, `Ya existe un banco llamado ${bankName}`);
  await expect(second).toBeVisible();

  await pickOption(page, "Banco", bankName);
  await second.getByRole("button", { name: "Guardar" }).click();
  await acknowledge(page, "Guardamos la cuenta bancaria.");
  await expect(second).toBeHidden();
  await expect(page.getByRole("row").filter({ hasText: "222-002" })).toContainText(bankName);
});

test("the registered-companies list keeps an inactivated company and reactivates it", async ({ page, request }) => {
  const company = await createThrowawayCompany(request, "registradas");
  await page.goto("/home/lstEnterpriseRegister");
  await waitForPageToSettle(page);
  await page.getByRole("textbox").first().fill(company.name);
  const row = page.getByRole("row").filter({ hasText: company.name });
  await expect(row).toContainText("Activo");

  await row.getByRole("button", { name: "Inactivar empresa" }).click();
  await confirm(page, "Sí, inactivar");
  await acknowledge(page, "Inactivamos la empresa.");
  await expect(row).toContainText("Inactivo");

  await row.getByRole("button", { name: "Reactivar empresa" }).click();
  await confirm(page, "Sí, reactivar");
  await acknowledge(page, "Reactivamos la empresa.");
  await expect(row).toContainText("Activo");
  await expect(row.getByRole("button", { name: "Inactivar empresa" })).toBeVisible();
});
