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
  buttonNamed("Nuevo").click();
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
  document.body.querySelector<HTMLElement>(".mdi-pencil")!.click();
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

test.each([
  { status: 1, sent: 0, question: "eliminar" },
  { status: 0, sent: 1, question: "activar" },
])("Eliminar cuenta asks to $question an account with status $status and sends status $sent", { timeout: 15_000 }, async ({ status, sent, question }) => {
  answerWith([bankWithAccount(status)]);
  await mountScreen();

  document.body.querySelector<HTMLElement>(".mdi-bank")!.click();
  await flushPromises();
  document.body.querySelector<HTMLElement>(".v-dialog .mdi-delete")!.closest("button")!.click();
  await flushPromises();

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ text: expect.stringContaining(`${question} la cuenta 193-555`) });
  expect(requestsTo("eliminar_cuenta").map((config) => config.data)).toEqual([expect.objectContaining({ id: 5, status: sent })]);
});

test("cancelling a bank's inactivation keeps it active and saves nothing", { timeout: 15_000 }, async () => {
  answerWith([bankWithAccount(1)]);
  await mountScreen();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);

  document.body.querySelector<HTMLElement>(".mdi-delete")!.closest("button")!.click();
  await flushPromises();

  expect(requestsTo("actualizar_bank")).toEqual([]);
  expect(document.body.querySelector(".mdi-delete")).not.toBeNull();
  const [{ status }] = useBankStore().list as { status: unknown }[];
  expect(status).toBe(1);
});
