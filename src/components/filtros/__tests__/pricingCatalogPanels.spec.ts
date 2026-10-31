import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Pinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import FiltroAirlines from "@/components/filtros/FiltroAirlines.vue";
import FiltroQuoteStatus from "@/components/filtros/FiltroQuoteStatus.vue";
import FilterMotonave from "@/components/filtros/FilterMotonave.vue";
import FilterNotasCotizacion from "@/components/filtros/FilterNotasCotizacion.vue";
import ListNotaCotizacionComponent from "@/components/MasterUsuario/ListNotaCotizacionComponent.vue";
import ListaMarketingComponent from "@/components/FolderMarketing/ListaMarketingComponent.vue";
import { useAirlinesStore } from "@/stores/airlines";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useMotonaveStore } from "@/stores/motonave";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
import { URL_MAIN, accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";
import type { HttpConfig } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;
let pinia: Pinia;

const answerSavesWith = (saveAnswer: unknown) =>
  httpMock.mockImplementation(async (config: HttpConfig) => ({
    data: config.method === "get" ? accepted(config.url.includes("ultima_posicion") ? [{ maxposition: 5 }] : []) : saveAnswer,
  }));
const requestsTo = (path: string) =>
  httpMock.mock.calls.map(([config]) => config).filter((config: HttpConfig) => config.url.split("?")[0] === URL_MAIN + path);
const buttonNamed = (name: string, within: ParentNode = document.body) =>
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

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  localStorage.setItem("dataBranch", JSON.stringify([{ id: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  answerSavesWith(accepted([]));
  pinia = createPinia();
  setActivePinia(pinia);
});

afterEach(() => wrapper?.unmount());

const mountWithStore = async (component: Component) => {
  wrapper = mount(component, {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};

const mountMarketingScreen = async () => {
  await mountWithStore(
    defineComponent({ components: { ListaMarketingComponent }, template: "<v-app><ListaMarketingComponent /></v-app>" }),
  );
  buttonNamed("Nuevo").click();
  for (let round = 0; round < 5; round++) await flushPromises();
  await typeInto("Nombre (*)", "QA marketing");
};

const clickAcceptTwice = async (within: ParentNode = document.body) => {
  const accept = buttonNamed("Aceptar", within);
  accept.click();
  accept.click();
  for (let round = 0; round < 5; round++) await flushPromises();
};

const panels = [
  {
    screen: "Aerolíneas",
    panel: FiltroAirlines,
    insertPath: "insert_airlines",
    open: () => {
      const store = useAirlinesStore();
      store.AirlineModel = { id_pais: 1, code_iata: "QA", code_icao: "QAA", name: "QA Air", status: true };
      return store;
    },
  },
  {
    screen: "Estados de cotización",
    panel: FiltroQuoteStatus,
    insertPath: "insertar_position_calls",
    open: () => {
      const store = useQuoteStatusStore();
      store.StatusModel = { name: "QA estado", position: 40, status: 1 };
      return store;
    },
  },
  {
    screen: "Motonaves",
    panel: FilterMotonave,
    insertPath: "insertar_motonave",
    open: () => {
      const store = useMotonaveStore();
      store.MotonaveModel = { name: "QA nave", description: "", status: 1 };
      return store;
    },
  },
  {
    screen: "Notas de cotización",
    panel: FilterNotasCotizacion,
    insertPath: "insertar_master_detalle_notas_cotizacion",
    open: () => {
      const store = useMasterusuariosStore();
      store.model = { ...store.model, description: "QA nota", orden: null };
      return store;
    },
  },
] as const;

const openNewPanel = async ({ panel, open }: (typeof panels)[number]) => {
  const store = open();
  store.tipo = "nuevo";
  store.drawer = true;
  await mountWithStore(panel);
  return store;
};

test.each(panels)("$screen: a double click on Aceptar in Nuevo saves once and closes the panel", async (screen) => {
  const store = await openNewPanel(screen);

  await clickAcceptTwice();

  expect(requestsTo(screen.insertPath)).toHaveLength(1);
  expect(store.drawer).toBe(false);
});

test.each(panels)("$screen: a refused save keeps Nuevo open and shows the reason", async (screen) => {
  answerSavesWith(rejected("Ya existe un registro con ese dato."));
  const store = await openNewPanel(screen);

  await clickAcceptTwice();

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "Ya existe un registro con ese dato." }));
  expect(store.drawer).toBe(true);
});

test("Notas de cotización: Nuevo leaves the order to the server instead of counting the filtered list", async () => {
  httpMock.mockImplementation(async (config: HttpConfig) => ({
    data: accepted(config.url.includes("listar_master_detalle_notas_cotizacion") ? [{ id: 1, orden: 2, description: "Filtrada" }] : []),
  }));
  await mountWithStore(ListNotaCotizacionComponent);

  buttonNamed("NUEVO").click();
  await flushPromises();

  expect(useMasterusuariosStore().model.orden).toBeNull();
});

test("Tipos de marketing: a double click on Aceptar in Nuevo saves once and closes the panel", async () => {
  await mountMarketingScreen();

  await clickAcceptTwice(openDrawer());

  expect(requestsTo("insertar_marketing")).toHaveLength(1);
  expect(requestsTo("validar_nuevo_posicion_marketing")).toHaveLength(0);
  expect(document.body.querySelectorAll(".v-navigation-drawer--active")).toHaveLength(0);
});

test("Tipos de marketing: a refused type keeps Nuevo open and shows the reason", async () => {
  answerSavesWith(rejected("La posición 5 ya la usa Web. Elige otra posición."));
  await mountMarketingScreen();

  await clickAcceptTwice(openDrawer());

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "La posición 5 ya la usa Web. Elige otra posición." }));
  expect(openDrawer()).not.toBeNull();
});
