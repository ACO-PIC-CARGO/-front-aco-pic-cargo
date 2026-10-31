import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { Component, SetupContext } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaContenedoresComponent from "@/components/FolderContainers/ListaContenedoresComponent.vue";
import ListaDocumentosComponent from "@/components/FolderDocument/ListaDocumentosComponent.vue";
import ListaGastosComponent from "@/components/FolderGasto/ListaGastosComponent.vue";
import ListaIngresosComponent from "@/components/FolderIngresos/ListaIngresosComponent.vue";
import ListaMonedasComponent from "@/components/FolderCoins/ListaMonedasComponent.vue";
import ListaModalidadesComponent from "@/components/FolderModality/ListaModalidadesComponent.vue";
import ListaIncotermsComponent from "@/components/FolderIncoterm/ListaIncotermsComponent.vue";
import ListaServiciosComponent from "@/components/FolderGroupServices/ListaServiciosComponent.vue";
import ListaMultiplicadoresComponent from "@/components/FolderMultiplicador/ListaMultiplicadoresComponent.vue";
import ListaPerformanceComponent from "@/components/FolderPerformance/ListaPerformanceComponent.vue";
import ListaGenerosComponent from "@/components/FolderSex/ListaGenerosComponent.vue";
import ListaTiposCargaComponent from "@/components/FolderTipoCarga/ListaTiposCargaComponent.vue";
import ListaTransportesComponent from "@/components/FolderTransport/ListaTransportesComponent.vue";
import ListaAniosComponent from "@/components/FolderYear/ListaAniosComponent.vue";
import ListaMarketingComponent from "@/components/FolderMarketing/ListaMarketingComponent.vue";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const ROW = { id: 9, code: "X1", name: "Fila", description: "Fila activa", calculoflag: false, status: 1, editableflag: true, maxposition: 3 };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  httpMock.mockImplementation(async (config) => ({
    data: accepted(/^(listar|ver|ultima)_/.test(config.url.slice(URL_MAIN.length)) ? [{ ...ROW }] : []),
  }));
});

afterEach(() => wrapper?.unmount());

const mountScreen = async (screen: Component, stubs: Record<string, Component> = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ components: { screen }, template: "<v-app><screen /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs },
    attachTo: document.body,
  });
  await flushPromises();
  httpMock.mockClear();
};

const listReloads = (list: string) =>
  httpMock.mock.calls.filter(([config]) => config.url.slice(URL_MAIN.length).startsWith(list)).length;

const buttonNamed = (name: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name)!;

const typeInto = async (label: string, value: string) => {
  const input = [...document.body.querySelectorAll(".v-navigation-drawer--active .v-text-field")]
    .find((field) => field.querySelector("label")?.textContent?.trim() === label)!
    .querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

describe.each([
  { screen: "Contenedores", component: ListaContenedoresComponent, list: "listar_containers" },
  { screen: "Tipos de documento", component: ListaDocumentosComponent, list: "listar_documents" },
  { screen: "Tipos de gasto", component: ListaGastosComponent, list: "listar_gasto" },
  { screen: "Tipos de ingreso", component: ListaIngresosComponent, list: "listar_ingreso" },
])("$screen", ({ component, list }) => {
  test("inactivating a row reloads the list once", { timeout: 15_000 }, async () => {
    await mountScreen(component);

    document.body.querySelector<HTMLElement>(".mdi-delete")!.closest("button")!.click();
    await flushPromises();

    expect(httpMock.mock.calls.some(([config]) => config.method === "put")).toBe(true);
    expect(listReloads(list)).toBe(1);
  });
});

test("saving a new container reloads the list once", { timeout: 15_000 }, async () => {
  await mountScreen(ListaContenedoresComponent);
  buttonNamed("Nuevo").click();
  await flushPromises();
  httpMock.mockClear();
  await typeInto("Nombre (*)", "Flat rack");
  for (const label of ["Largo (*)", "Ancho (*)", "Altura (*)", "Peso Máximo (*)", "Volumen Máximo (*)"]) {
    await typeInto(label, "1");
  }

  buttonNamed("Aceptar", document.body.querySelector(".v-navigation-drawer--active")!).click();
  await flushPromises();

  expect(listReloads("insertar_containers")).toBe(1);
  expect(listReloads("listar_containers")).toBe(1);
});

test("clearing the containers filter reloads the list once", { timeout: 15_000 }, async () => {
  await mountScreen(ListaContenedoresComponent);
  buttonNamed("Filtrar").click();
  await flushPromises();

  buttonNamed("Limpiar", document.body.querySelector(".v-navigation-drawer--active")!).click();
  await flushPromises();

  expect(listReloads("listar_containers")).toBe(1);
});

test("saving an edited currency reloads the list once", { timeout: 15_000 }, async () => {
  await mountScreen(ListaMonedasComponent);
  document.body.querySelector<HTMLElement>(".mdi-pencil")!.click();
  await flushPromises();
  await typeInto("Nombre (*)", "Euro");
  httpMock.mockClear();

  buttonNamed("Aceptar", document.body.querySelector(".v-navigation-drawer--active")!).click();
  await flushPromises();

  expect(listReloads("actualizar_coins")).toBe(1);
  expect(listReloads("listar_coins")).toBe(1);
});

const validForm = {
  setup(_props: unknown, { expose, slots }: SetupContext) {
    expose({ validate: async () => ({ valid: true }), reset: () => {} });
    return () => h("form", slots.default?.());
  },
};
const activeDrawer = () => document.body.querySelector(".v-navigation-drawer--active")!;
const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Catalog {
  screen: string;
  component: Component;
  list: string;
  actions: string[];
  filterButton?: string;
  newSave?: string;
  editSave?: string;
  saveDelay?: number;
}
const everyAction = ["inactivar", "nuevo", "editar", "limpiar"];
const catalogs: Catalog[] = [
  { screen: "Modalidades", component: ListaModalidadesComponent, list: "listar_modality", actions: ["limpiar"] },
  { screen: "Incoterms", component: ListaIncotermsComponent, list: "listar_incoterms", actions: everyAction },
  { screen: "Servicios", component: ListaServiciosComponent, list: "listar_groupservices", actions: everyAction },
  {
    screen: "Multiplicadores",
    component: ListaMultiplicadoresComponent,
    list: "listar_multiplicador",
    actions: everyAction,
    filterButton: "Filtrar",
    newSave: "Nuevo",
    editSave: "Actualizar",
  },
  { screen: "Performance", component: ListaPerformanceComponent, list: "listar_performance", actions: everyAction, filterButton: "Filtrar" },
  { screen: "Géneros", component: ListaGenerosComponent, list: "listar_sex", actions: everyAction, saveDelay: 600 },
  { screen: "Tipos de carga", component: ListaTiposCargaComponent, list: "listar_shipment", actions: everyAction },
  { screen: "Transportes", component: ListaTransportesComponent, list: "listar_transport", actions: ["limpiar"] },
  { screen: "Años", component: ListaAniosComponent, list: "listar_year", actions: everyAction, saveDelay: 600 },
  { screen: "Marketing", component: ListaMarketingComponent, list: "listar_marketing", actions: everyAction, filterButton: "Filtrar" },
];

const runAction: Record<string, (catalog: Catalog) => Promise<void>> = {
  inactivar: async () => {
    document.body.querySelector<HTMLElement>(".mdi-delete")!.click();
  },
  nuevo: async ({ newSave = "Aceptar", saveDelay = 0 }) => {
    buttonNamed("Nuevo").click();
    await flushPromises();
    httpMock.mockClear();
    buttonNamed(newSave, activeDrawer()).click();
    await waitFor(saveDelay);
  },
  editar: async ({ editSave = "Aceptar", saveDelay = 0 }) => {
    document.body.querySelector<HTMLElement>(".mdi-pencil")!.click();
    await flushPromises();
    httpMock.mockClear();
    buttonNamed(editSave, activeDrawer()).click();
    await waitFor(saveDelay);
  },
  limpiar: async ({ filterButton = "Fitrar" }) => {
    buttonNamed(filterButton).click();
    await flushPromises();
    buttonNamed("Limpiar", activeDrawer()).click();
  },
};

describe.each(catalogs)("$screen", (catalog) => {
  test.each(catalog.actions)("%s reloads the list once", { timeout: 15_000 }, async (action) => {
    await mountScreen(catalog.component, { VForm: validForm });

    await runAction[action]!(catalog);
    await flushPromises();

    expect(listReloads(catalog.list)).toBe(1);
  });
});
