import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaBancosComponent from "@/components/folderBanks/ListaBancosComponent.vue";
import { useBankStore } from "@/stores/bank";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const paymentShownInAnotherScreen = { code: "5002", acronym: "BCP", name: "Banco de Crédito", description: "Pago 77", status: 0 };
const bankWithAccount = (status: number) => ({
  id: 2,
  code: "5002",
  acronym: "BCP",
  name: "Banco de Crédito",
  description: "",
  status: 1,
  banks_details: [{ id: 5, id_bank: 2, id_coin: 1, nrocuenta: "193-555", nrocci: "", status, esprincipalflag: false }],
});
let wrapper: VueWrapper | undefined;

const answerWith = (banks: unknown[], saveAnswer = accepted([])) =>
  httpMock.mockImplementation(async (config) => ({
    data: /(listar|ver)_bank/.test(config.url) ? accepted(banks) : config.method === "get" ? accepted([]) : saveAnswer,
  }));
const requestsTo = (endpoint: string) => httpMock.mock.calls.map(([config]) => config).filter((config) => config.url.endsWith(endpoint));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  answerWith([]);
});

afterEach(() => wrapper?.unmount());

const mountScreen = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useBankStore().record = paymentShownInAnotherScreen;
  wrapper = mount(
    defineComponent({ components: { ListaBancosComponent }, template: "<v-app><ListaBancosComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const buttonNamed = (name: string, within = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === name)!;
const buttonAria = (name: string, within = document.body) =>
  within.querySelector<HTMLElement>(`button[aria-label="${name}"]`)!;
const openDrawer = () => document.body.querySelector<HTMLElement>(".v-navigation-drawer--active")!;

const typeInto = async (label: string, value: string) => {
  const field = [...openDrawer().querySelectorAll(".v-text-field")].find(
    (element) => element.querySelector("label")?.textContent?.trim() === label,
  )!;
  const input = field.querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

const fillNewBank = async () => {
  buttonNamed("Nuevo Banco").click();
  await flushPromises();
  await typeInto("Acrónimo (*)", "QA");
  await typeInto("Nombre (*)", "Banco nuevo");
};

test("Nuevo starts an empty, active bank even after another screen filled the bank record", { timeout: 15_000 }, async () => {
  await mountScreen();
  await fillNewBank();

  buttonNamed("Aceptar", openDrawer()).click();
  await flushPromises();

  expect(requestsTo("insertar_bank").map((config) => config.data)).toEqual([
    { acronym: "QA", name: "Banco nuevo", description: "", status: 1 },
  ]);
});

test("a double click on Aceptar saves the new bank once and closes the panel", { timeout: 15_000 }, async () => {
  await mountScreen();
  await fillNewBank();

  const accept = buttonNamed("Aceptar", openDrawer());
  accept.click();
  accept.click();
  await flushPromises();

  expect(requestsTo("insertar_bank")).toHaveLength(1);
  expect(document.body.querySelectorAll(".v-navigation-drawer--active")).toHaveLength(0);
});

test("a refused bank keeps the Nuevo panel open with the reason", { timeout: 15_000 }, async () => {
  answerWith([], rejected("Ya existe un banco llamado Banco nuevo.", undefined));
  await mountScreen();
  await fillNewBank();

  buttonNamed("Aceptar", openDrawer()).click();
  await flushPromises();

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "Ya existe un banco llamado Banco nuevo." }));
  expect(openDrawer()).not.toBeNull();
});

const openEditPanel = async () => {
  buttonAria("Modificar banco").click();
  await flushPromises();
};

test("a double click on Aceptar in Modificar saves the bank once and closes the panel", { timeout: 15_000 }, async () => {
  answerWith([bankWithAccount(1)]);
  await mountScreen();
  await openEditPanel();

  const accept = buttonNamed("Aceptar", openDrawer());
  accept.click();
  accept.click();
  await flushPromises();

  expect(requestsTo("actualizar_bank").map((config) => config.data)).toEqual([
    { id: 2, acronym: "BCP", name: "Banco de Crédito", description: "", status: 1 },
  ]);
  expect(document.body.querySelectorAll(".v-navigation-drawer--active")).toHaveLength(0);
});

test("a refused edit keeps the Modificar panel open with the reason", { timeout: 15_000 }, async () => {
  answerWith([bankWithAccount(1)], rejected("Ya existe un banco llamado Banco de Crédito.", undefined));
  await mountScreen();
  await openEditPanel();

  buttonNamed("Aceptar", openDrawer()).click();
  await flushPromises();

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "Ya existe un banco llamado Banco de Crédito." }));
  expect(openDrawer()).not.toBeNull();
});

test("Ver Cuentas expande la tabla de cuentas sin Alias", { timeout: 15_000 }, async () => {
  const accounts = Array.from({ length: 7 }, (_, index) => ({
    ...bankWithAccount(1).banks_details[0],
    id: index + 5,
    nrocuenta: `cuenta-${index + 1}`,
    esprincipalflag: index === 6,
  }));
  answerWith([{
    ...bankWithAccount(1),
    banks_details: accounts,
  }]);
  await mountScreen();

  const bankRow = buttonAria("Ver cuentas").closest("tr")!;
  expect(bankRow.classList.contains("bank-row-expanded")).toBe(false);
  buttonAria("Ver cuentas").click();
  await flushPromises();
  expect(bankRow.classList.contains("bank-row-expanded")).toBe(true);
  expect(document.body.querySelectorAll(".v-dialog")).toHaveLength(0);

  expect(document.body.textContent).not.toContain("Alias");
  const tables = document.body.querySelectorAll(".v-data-table");
  expect(tables[1]!.textContent).toContain("Cuenta Principal");
  expect([...tables[1]!.querySelectorAll("tbody tr")].find((row) => row.querySelector("td"))?.textContent).toContain("cuenta-7");
  const accountChips = [...tables[1]!.querySelectorAll("tbody td:nth-child(4) .v-chip")];
  expect(accountChips.filter((chip) => chip.textContent?.trim() === "Sí")).toHaveLength(1);
  expect(accountChips.filter((chip) => chip.textContent?.trim() === "No")).toHaveLength(6);
  expect(accountChips.find((chip) => chip.textContent?.trim() === "Sí")?.classList.contains("text-primary")).toBe(true);
  expect(accountChips.find((chip) => chip.textContent?.trim() === "No")?.classList.contains("text-grey")).toBe(true);
  expect(tables[1]!.textContent).toContain("cuenta-7");
  expect(tables[1]!.textContent).not.toContain("Items per page");
  expect(tables[1]!.textContent).not.toContain("Acciones");
  expect(tables[1]!.querySelectorAll("button")).toHaveLength(0);
  buttonAria("Ocultar cuentas").click();
  await flushPromises();
  expect(bankRow.classList.contains("bank-row-expanded")).toBe(false);
});

test("el detalle muestra si cada cuenta va en el Aviso de Llegada", { timeout: 15_000 }, async () => {
  answerWith([{
    ...bankWithAccount(1),
    banks_details: [
      { ...bankWithAccount(1).banks_details[0], id: 5, nrocuenta: "con-aviso", esavisollegada: true },
      { ...bankWithAccount(1).banks_details[0], id: 6, nrocuenta: "sin-aviso", esavisollegada: false },
    ],
  }]);
  await mountScreen();
  buttonAria("Ver cuentas").click();
  await flushPromises();

  const table = document.body.querySelector(".bank-account-detail .v-data-table")!;
  const headers = [...table.querySelectorAll("thead th")].map((header) => header.textContent?.trim());
  expect(headers).toEqual(["Nro Cuenta", "CCI", "Moneda", "Cuenta Principal", "Aviso de Llegada"]);
  const avisoOf = (account: string) => {
    const row = [...table.querySelectorAll("tbody tr")].find((candidate) => candidate.textContent?.includes(account))!;
    return row.querySelectorAll("td")[4]!.textContent?.trim();
  };
  expect(avisoOf("con-aviso")).toBe("Sí");
  expect(avisoOf("sin-aviso")).toBe("No");
});

test("la cuenta principal permanece primera al ordenar el detalle y su columna no es ordenable", { timeout: 15_000 }, async () => {
  const accounts = [
    { ...bankWithAccount(1).banks_details[0], id: 5, nrocuenta: "200", esprincipalflag: 0 },
    { ...bankWithAccount(1).banks_details[0], id: 6, nrocuenta: "300", esprincipalflag: 1 },
    { ...bankWithAccount(1).banks_details[0], id: 7, nrocuenta: "100", esprincipalflag: 0 },
  ];
  answerWith([{ ...bankWithAccount(1), banks_details: accounts }]);
  await mountScreen();
  buttonAria("Ver cuentas").click();
  await flushPromises();

  const table = document.body.querySelector(".bank-account-detail .v-data-table")!;
  const displayedAccounts = () => [...table.querySelectorAll("tbody tr")]
    .map((row) => row.querySelector("td")?.textContent?.trim())
    .filter((value) => value !== undefined);
  const accountHeader = [...table.querySelectorAll<HTMLElement>("thead th")].find((header) => header.textContent?.includes("Nro Cuenta"))!;
  const actionHeader = [...table.querySelectorAll<HTMLElement>("thead th")].find((header) => header.textContent?.includes("Cuenta Principal"))!;

  expect(displayedAccounts()).toEqual(["300", "200", "100"]);
  expect(actionHeader.classList.contains("v-data-table__th--sortable")).toBe(false);
  expect(table.querySelector(".v-data-table-header__sort-badge")).toBeNull();
  accountHeader.click();
  await flushPromises();
  expect(displayedAccounts()).toEqual(["300", "100", "200"]);
  expect(table.querySelector(".v-data-table-header__sort-badge")).toBeNull();
  accountHeader.click();
  await flushPromises();
  expect(displayedAccounts()).toEqual(["300", "200", "100"]);
  actionHeader.click();
  await flushPromises();
  expect(displayedAccounts()).toEqual(["300", "200", "100"]);
  expect(accounts.map((account) => account.nrocuenta)).toEqual(["200", "300", "100"]);
});

test("oculta Ver Cuentas sin cuentas y el banco ya no muestra la columna Cuenta Principal", { timeout: 15_000 }, async () => {
  answerWith([
    { ...bankWithAccount(1), banks_details: [] },
    {
      ...bankWithAccount(1),
      id: 3,
      code: "5003",
      banks_details: [
        { ...bankWithAccount(1).banks_details[0], esprincipalflag: 0 },
        { ...bankWithAccount(1).banks_details[0], id: 6, esprincipalflag: 1 },
      ],
    },
  ]);
  await mountScreen();

  const rows = document.body.querySelectorAll(".bank-list-table > .v-table__wrapper > table > tbody > tr:not(.v-data-table__tr--expanded)");
  expect(rows).toHaveLength(2);
  expect(rows[0]!.querySelector('button[aria-label="Ver cuentas"]')).toBeNull();
  expect(rows[0]!.querySelector('button[aria-label="Nueva cuenta"]')).toBeNull();
  expect(rows[0]!.textContent).toContain("Sin cuentas");
  const chips = [...rows[0]!.querySelectorAll(".v-chip")];
  const statusChip = chips.find((chip) => chip.textContent?.trim() === "Activo");
  const noAccountsChip = chips.find((chip) => chip.textContent?.trim() === "Sin cuentas");
  expect(statusChip?.classList.contains("text-success")).toBe(true);
  expect(noAccountsChip?.classList.contains("text-grey")).toBe(true);
  expect(rows[0]!.textContent).not.toContain("Cuenta principal para Control de Gastos");
  expect(rows[1]!.querySelector('button[aria-label="Ver cuentas"]')).not.toBeNull();
  expect(rows[1]!.textContent).not.toContain("Sin cuentas");
  expect(rows[1]!.textContent).not.toContain("Cuenta principal para Control de Gastos");
});

test("muestra el estado inactivo del banco con el mismo estilo del detalle", { timeout: 15_000 }, async () => {
  answerWith([{ ...bankWithAccount(1), status: 0 }]);
  await mountScreen();

  const chips = [...document.body.querySelectorAll(".v-chip")];
  const statusChip = chips.find((chip) => chip.textContent?.trim() === "Inactivo");
  expect(statusChip?.classList.contains("text-grey")).toBe(true);
});

test("el listado principal pagina los bancos y permite buscar", { timeout: 15_000 }, async () => {
  answerWith(Array.from({ length: 11 }, (_, index) => ({
    ...bankWithAccount(1),
    id: index + 1,
    code: `B${String(index + 1).padStart(2, "0")}`,
    name: `Banco ${String(index + 1).padStart(2, "0")}`,
  })));
  await mountScreen();

  const table = document.body.querySelector(".bank-list-table")!;
  expect(table.textContent).toContain("Banco 01");
  expect(table.textContent).not.toContain("Banco 11");
  table.querySelector<HTMLElement>('.v-data-table-footer button[aria-label="Next page"]')!.click();
  await flushPromises();
  expect(table.textContent).toContain("Banco 11");
  expect(table.textContent).not.toContain("Banco 01");

  const search = document.body.querySelector<HTMLInputElement>(".bank-list-search input")!;
  search.value = "Banco 05";
  search.dispatchEvent(new Event("input"));
  await flushPromises();
  expect(table.textContent).toContain("Banco 05");
  expect(table.textContent).not.toContain("Banco 11");
});

test("las cuentas se gestionan en Cuentas bancarias: el banco no tiene Nueva Cuenta", { timeout: 15_000 }, async () => {
  answerWith([bankWithAccount(1)]);
  await mountScreen();

  expect(buttonAria("Ver cuentas")).not.toBeNull();
  expect(buttonAria("Nueva cuenta")).toBeNull();
  const cells = buttonAria("Ver banco").closest("tr")!.querySelectorAll("td");
  expect(cells[cells.length - 1]!.querySelector('button[aria-label="Ver cuentas"]')).not.toBeNull();
  expect(document.body.textContent).not.toContain("Nueva Cuenta");
});

test("cancelling a bank's inactivation keeps it active and saves nothing", { timeout: 15_000 }, async () => {
  answerWith([bankWithAccount(1)]);
  await mountScreen();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);

  buttonAria("Inactivar banco").click();
  await flushPromises();

  expect(requestsTo("actualizar_bank")).toEqual([]);
  expect(buttonAria("Inactivar banco")).not.toBeNull();
  expect((useBankStore().list as { status: unknown }[])[0]?.status).toBe(1);
});

test.each([
  { status: 0, label: "Activar banco", button: "Sí, activar", sent: 1 },
  { status: 1, label: "Inactivar banco", button: "Sí, inactivar", sent: 0 },
])("confirma $label y envía el estado $sent", { timeout: 15_000 }, async ({ status, label, button, sent }) => {
  answerWith([{ ...bankWithAccount(1), status }]);
  await mountScreen();

  buttonAria(label).click();
  await flushPromises();

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ confirmButtonText: button });
  expect(requestsTo("actualizar_bank").map((config) => config.data)).toEqual([
    expect.objectContaining({ id: 2, status: sent }),
  ]);
});

test("cancelar la activación del banco no envía cambios ni recarga", { timeout: 15_000 }, async () => {
  answerWith([{ ...bankWithAccount(1), status: 0 }]);
  await mountScreen();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  const listRequests = () => httpMock.mock.calls.filter(([config]) => config.url.includes("listar_bank"));
  const initialRequests = listRequests().length;

  buttonAria("Activar banco").click();
  await flushPromises();

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ confirmButtonText: "Sí, activar" });
  expect(requestsTo("actualizar_bank")).toHaveLength(0);
  expect(listRequests()).toHaveLength(initialRequests);
  expect(buttonAria("Activar banco")).not.toBeNull();
});

test("asks for the currencies without waiting for the bank list", { timeout: 15_000 }, async () => {
  httpMock.mockImplementation((config) =>
    /listar_bank/.test(config.url) ? new Promise(() => {}) : Promise.resolve({ data: accepted([]) }),
  );

  await mountScreen();

  expect(requestsTo("getCoinsList?id_branch=7")).toHaveLength(1);
});
