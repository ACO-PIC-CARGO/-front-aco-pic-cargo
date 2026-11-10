import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import CuentasBancariasListado from "@/components/folderBanks/CuentasBancariasListado.vue";
import { accepted, httpMock, rejected, URL_MAIN } from "@/stores/__tests__/catalogHttp";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

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

const BCP_USD = {
  id: 1,
  id_bank: 2,
  bank_name: "BCP",
  id_coin: 1,
  coin_acronym: "USD",
  nrocuenta: "192-2190795-1-50",
  nrocci: "002-192-002190795150-39",
  status: 1,
  esprincipalflag: true,
  esavisollegada: true,
};
const TARJETA = {
  id: 23,
  id_bank: 2,
  bank_name: "BCP",
  id_coin: 2,
  coin_acronym: "PEN",
  nrocuenta: "TARJETA DE CREDITO EMPRESARIAL",
  nrocci: null,
  status: 0,
  esprincipalflag: true,
  esavisollegada: false,
};
const saved = (mensaje: string) => ({ ...accepted([{ id: 1 }]), mensaje });

let wrapper: VueWrapper | undefined;

function respondBy(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async ({ method, url }) => {
    const key = `${method} ${url.slice(URL_MAIN.length)}`;
    if (!(key in bodies)) throw new Error(`unexpected request ${key}`);
    const body = bodies[key];
    if (body instanceof Error) throw body;
    return { data: body };
  });
}

const BODIES = {
  "get listar_cuentas": accepted([BCP_USD, TARJETA]),
  "post getBanksList/": accepted([{ id: 2, name: "BCP" }]),
  "get getCoinsList": accepted([{ id: 1, acronym: "USD" }, { id: 2, acronym: "PEN" }]),
  "post nueva_cuenta": saved("Se guardó la cuenta."),
  "put editar_cuenta": saved("Se actualizó la cuenta."),
  "put eliminar_cuenta_logica": saved("Se eliminó la cuenta."),
};

const requests = () => httpMock.mock.calls.map(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}`);
const sent = (key: string) =>
  httpMock.mock.calls.find(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}` === key)?.[0];
const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name);
const labelled = (label: string) => document.body.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
const openDialog = () => document.body.querySelector(".cuenta-drawer.v-navigation-drawer--active");
const rows = () =>
  [...document.body.querySelectorAll(".cuentas-table tbody tr")].map((row) =>
    [...row.querySelectorAll("td")].slice(1).map((cell) => cell.textContent?.trim()),
  );

async function settle() {
  for (let round = 0; round < 5; round++) await flushPromises();
}

async function click(element: HTMLElement | null | undefined) {
  element!.click();
  await settle();
}

async function type(selector: string, value: string) {
  const input = document.body.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await settle();
}

async function mountList() {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { CuentasBancariasListado }, template: "<v-app><CuentasBancariasListado /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await settle();
}

const listComponent = () =>
  wrapper!.findComponent(CuentasBancariasListado).vm as unknown as {
    draft: Record<string, unknown>;
    filters: Record<string, unknown>;
  };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  respondBy(BODIES);
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("dataUser");
});

test("lists every account, then loads banks and coins together", { timeout: 15_000 }, async () => {
  await mountList();

  expect(requests()).toEqual(["get listar_cuentas", "post getBanksList/", "get getCoinsList"]);
  expect(sent("get listar_cuentas")!.params).toEqual({ id_branch: 7, status: 1 });
  expect(rows()).toEqual([
    ["BCP", "192-2190795-1-50", "002-192-002190795150-39", "USD", "Sí", "Sí", "Activo"],
    ["BCP", "TARJETA DE CREDITO EMPRESARIAL", "", "PEN", "No", "Sí", "Inactivo"],
  ]);
});

test("the filters chosen in the drawer are sent to the listing", { timeout: 15_000 }, async () => {
  await mountList();
  await click(buttonNamed("Filtrar"));
  Object.assign(listComponent().filters, {
    id_bank: 2,
    nrocuenta: "192",
    nrocci: "",
    id_coin: 1,
    esprincipalflag: true,
    esavisollegada: false,
    status: null,
  });
  httpMock.mockClear();

  await click(buttonNamed("Aceptar"));

  expect(sent("get listar_cuentas")!.params).toEqual({
    id_branch: 7,
    id_bank: 2,
    nrocuenta: "192",
    id_coin: 1,
    esprincipalflag: true,
    esavisollegada: false,
  });
});

test("a new account sends every field shown in the list and reloads", { timeout: 15_000 }, async () => {
  await mountList();
  await click(buttonNamed("Nueva Cuenta"));
  Object.assign(listComponent().draft, { id_bank: 2, id_coin: 1, esavisollegada: true });
  await type("#cuenta-nrocuenta", "194-123");
  await type("#cuenta-nrocci", "002-194");
  httpMock.mockClear();

  await click(buttonNamed("Crear cuenta"));

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ titleText: "¿Agregar otra cuenta bancaria?" }));
  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ html: expect.stringContaining("Aviso de Llegada") });
  expect(requests()).toEqual(["post nueva_cuenta", "get listar_cuentas"]);
  expect(sent("post nueva_cuenta")!.data).toEqual({
    id: null,
    id_bank: 2,
    id_coin: 1,
    nrocuenta: "194-123",
    nrocci: "002-194",
    status: 1,
    esprincipalflag: false,
    esavisollegada: true,
  });
  expect(openDialog()).toBeNull();
});

test("declining an extra Aviso de Llegada account keeps the form open without saving", { timeout: 15_000 }, async () => {
  await mountList();
  await click(buttonNamed("Nueva Cuenta"));
  Object.assign(listComponent().draft, { id_bank: 2, id_coin: 1, esavisollegada: true });
  await type("#cuenta-nrocuenta", "194-123");
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  httpMock.mockClear();

  await click(buttonNamed("Crear cuenta"));

  expect(requests()).toEqual([]);
  expect(openDialog()).not.toBeNull();
});

test("a new account without bank, number or currency is not sent", { timeout: 15_000 }, async () => {
  await mountList();
  await click(buttonNamed("Nueva Cuenta"));
  httpMock.mockClear();

  await click(buttonNamed("Crear cuenta"));

  expect(requests()).toEqual([]);
  expect(openDialog()).not.toBeNull();
});

test("editing an account sends its id with the change", { timeout: 15_000 }, async () => {
  await mountList();
  await click(labelled(`Editar ${BCP_USD.nrocuenta}`));
  await type("#cuenta-nrocci", "002-999");

  await click(buttonNamed("Guardar cambios"));

  expect(Swal.fire).not.toHaveBeenCalledWith(expect.objectContaining({ titleText: "¿Agregar otra cuenta bancaria?" }));
  expect(sent("put editar_cuenta")!.data).toMatchObject({ id: 1, id_bank: 2, id_coin: 1, nrocci: "002-999" });
});

test("viewing an account shows it read-only without a save button", { timeout: 15_000 }, async () => {
  await mountList();

  await click(labelled(`Ver ${BCP_USD.nrocuenta}`));

  expect(openDialog()?.textContent).toContain(`Ver Cuenta: ${BCP_USD.nrocuenta}`);
  expect(buttonNamed("Guardar cambios")).toBeUndefined();
  expect(document.body.querySelector<HTMLInputElement>("#cuenta-nrocuenta")!.readOnly).toBe(true);
});

test("deleting a billing and arrival notice account warns both stay unassigned", { timeout: 15_000 }, async () => {
  await mountList();
  httpMock.mockClear();

  await click(labelled(`Eliminar ${BCP_USD.nrocuenta}`));

  const [warning] = vi.mocked(Swal.fire).mock.calls[0]! as unknown as [{ titleText: string; html: string }];
  expect(warning.titleText).toBe("¿Eliminar cuenta bancaria?");
  expect(warning.html.replace(/<[^>]+>/g, "")).toContain("La Facturación y el Aviso de Llegada quedarán sin cuenta asignada.");
  expect(requests()).toEqual(["put eliminar_cuenta_logica", "get listar_cuentas"]);
  expect(sent("put eliminar_cuenta_logica")!.data).toEqual({ id: 1 });
});

test("declining the delete warning keeps the account", { timeout: 15_000 }, async () => {
  await mountList();
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  httpMock.mockClear();

  await click(labelled(`Eliminar ${BCP_USD.nrocuenta}`));

  expect(requests()).toEqual([]);
});

test("inactive accounts have no delete button", { timeout: 15_000 }, async () => {
  await mountList();

  expect(labelled(`Eliminar ${TARJETA.nrocuenta}`)).toBeNull();
});

test("an empty answer shows the empty message without an alert", { timeout: 15_000 }, async () => {
  respondBy({ ...BODIES, "get listar_cuentas": rejected() });
  await mountList();

  expect(document.body.textContent).toContain("Aún no hay cuentas bancarias registradas.");
  expect(Swal.fire).not.toHaveBeenCalled();
});

test("a connection failure is reported", { timeout: 15_000 }, async () => {
  respondBy({ ...BODIES, "get listar_cuentas": new Error("offline") });
  await mountList();

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: CONNECTION_ERROR_MESSAGE }));
});
