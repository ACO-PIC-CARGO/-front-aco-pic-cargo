import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaMarketingComponent from "@/components/FolderMarketing/ListaMarketingComponent.vue";
import ListaDocumentosComponent from "@/components/FolderDocument/ListaDocumentosComponent.vue";
import ListaPerformanceComponent from "@/components/FolderPerformance/ListaPerformanceComponent.vue";
import ListaMonedasComponent from "@/components/FolderCoins/ListaMonedasComponent.vue";
import ListaContenedoresComponent from "@/components/FolderContainers/ListaContenedoresComponent.vue";
import ListaGastosComponent from "@/components/FolderGasto/ListaGastosComponent.vue";
import ListaIngresosComponent from "@/components/FolderIngresos/ListaIngresosComponent.vue";
import ListaMultiplicadoresComponent from "@/components/FolderMultiplicador/ListaMultiplicadoresComponent.vue";
import ListaBancosComponent from "@/components/folderBanks/ListaBancosComponent.vue";
import ListaComentariosPredefinidosComponent from "@/components/FolderComentariosPredefinidos/ListaComentariosPredefinidosComponent.vue";
import ListClienteComponent from "@/components/folderEntities/Cliente/ListClienteComponent.vue";
import ListProveedorComponent from "@/components/folderEntities/Proveedor/ListProveedorComponent.vue";
import ListSubGasto from "@/views/FolderGasto/ListSubGasto.vue";
import ListSubIngreso from "@/views/FolderIngresos/ListSubIngreso.vue";
import ListAirlines from "@/views/Airlines/ListAirlines.vue";
import ListQuoteStatus from "@/views/StatusQuote/ListQuoteStatus.vue";
import ListPort from "@/views/Port/ListPort.vue";
import ListMotonave from "@/views/Motonave/ListMotonave.vue";
import ListState from "@/views/State/ListState.vue";
import ListCity from "@/views/City/ListCity.vue";
import ListTown from "@/views/Town/ListTown.vue";
import ListTipoTelefono from "@/views/MasterUsuario/ListTipoTelefono.vue";
import ListNotasCotizacion from "@/views/MasterUsuario/ListNotasCotizacion.vue";
import ListTypePayment from "@/views/TypePayment/ListTypePayment.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "" } } } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {}, query: {}, meta: {} }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const ROW = { id: 9, code: "01", name: "Fila", description: "Fila activa", status: 1, estado: true, editableflag: true };
type Action = "NUEVO" | "MODIFICAR" | "ELIMINAR" | "EXPORTAR";

const button = (label: string) => () =>
  [...document.body.querySelectorAll("button")].some((element) => element.textContent?.trim().toUpperCase() === label);
const rowIcon = (name: string) => () => document.body.querySelector(`tbody .${name}`) !== null;
const NUEVO = button("NUEVO");
const EXPORTAR = button("EXPORTAR");
const MODIFICAR = rowIcon("mdi-pencil");
const ELIMINAR = rowIcon("mdi-delete");
const LIST_ACTIONS = { NUEVO, MODIFICAR, ELIMINAR };

interface Screen {
  route: string;
  component: Component;
  controls: Partial<Record<Action, () => boolean>>;
}

const screens: Screen[] = [
  { route: "listMarketing", component: ListaMarketingComponent, controls: { ...LIST_ACTIONS, EXPORTAR } },
  { route: "listDocument", component: ListaDocumentosComponent, controls: LIST_ACTIONS },
  { route: "performance", component: ListaPerformanceComponent, controls: LIST_ACTIONS },
  { route: "listCoins", component: ListaMonedasComponent, controls: { MODIFICAR } },
  { route: "listContainers", component: ListaContenedoresComponent, controls: LIST_ACTIONS },
  { route: "listGastos", component: ListaGastosComponent, controls: LIST_ACTIONS },
  { route: "listIngresos", component: ListaIngresosComponent, controls: LIST_ACTIONS },
  { route: "listMultiplicador", component: ListaMultiplicadoresComponent, controls: LIST_ACTIONS },
  { route: "bankList", component: ListaBancosComponent, controls: { ...LIST_ACTIONS, NUEVO: button("NUEVO BANCO") } },
  { route: "listComentariosPredefinidos", component: ListaComentariosPredefinidosComponent, controls: { ...LIST_ACTIONS, EXPORTAR } },
  { route: "listClientes", component: ListClienteComponent, controls: { ...LIST_ACTIONS, EXPORTAR } },
  { route: "listProveedor", component: ListProveedorComponent, controls: { ...LIST_ACTIONS, EXPORTAR } },
  { route: "listSubGasto", component: ListSubGasto, controls: LIST_ACTIONS },
  { route: "listSubIngresos", component: ListSubIngreso, controls: LIST_ACTIONS },
  { route: "listAirlines", component: ListAirlines, controls: LIST_ACTIONS },
  { route: "listQuoteStatus", component: ListQuoteStatus, controls: { ...LIST_ACTIONS, NUEVO: button("NUEVO ESTADO") } },
  { route: "listPort", component: ListPort, controls: LIST_ACTIONS },
  { route: "listMotonave", component: ListMotonave, controls: LIST_ACTIONS },
  { route: "listState", component: ListState, controls: LIST_ACTIONS },
  { route: "listCity", component: ListCity, controls: LIST_ACTIONS },
  { route: "listTown", component: ListTown, controls: LIST_ACTIONS },
  { route: "listTipoTelefeno", component: ListTipoTelefono, controls: LIST_ACTIONS },
  { route: "ListNotasCotizacion", component: ListNotasCotizacion, controls: { ...LIST_ACTIONS, EXPORTAR } },
  { route: "ListPayment", component: ListTypePayment, controls: LIST_ACTIONS },
];

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  localStorage.setItem("dataBranch", JSON.stringify([{ id: 7 }]));
  httpMock.mockImplementation(async () => ({ data: accepted([{ ...ROW }]) }));
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("permissions");
});

const mountWith = async ({ route, component }: Screen, actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route, actions }], controlled: [route] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ components: { screen: component }, template: "<v-app><screen /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await vi.dynamicImportSettled();
  for (let round = 0; round < 5; round++) await flushPromises();
};

const shownControls = (screen: Screen) =>
  Object.entries(screen.controls)
    .filter(([, shown]) => shown())
    .map(([action]) => action);

describe.each(screens)("$route", (screen) => {
  test("a user who may only look at it sees none of its action controls", async () => {
    await mountWith(screen, ["VER"]);

    expect(shownControls(screen)).toEqual([]);
  });

  test.each(Object.keys(screen.controls))("%s shows its control and only that one", async (action) => {
    await mountWith(screen, ["VER", action]);

    expect(shownControls(screen)).toEqual([action]);
  });
});

describe("bankList accounts", () => {
  const accountControls = (): Action[] => {
    const detail = document.body.querySelector(".bank-account-detail")!;
    const shown = {
      NUEVO: document.body.querySelector('button[aria-label="Nueva cuenta"]') !== null,
      MODIFICAR: detail.querySelector('button[aria-label="Editar cuenta"]') !== null,
      ELIMINAR: detail.querySelector('button[aria-label="Eliminar cuenta"]') !== null,
    };
    return (Object.keys(shown) as Action[]).filter((action) => shown[action as keyof typeof shown]);
  };
  const openAccounts = async (actions: string[]) => {
    httpMock.mockImplementation(async () => ({ data: accepted([{ ...ROW, banks_details: [{ id: 3, nrocuenta: "001", status: 1 }] }]) }));
    await mountWith({ route: "bankList", component: ListaBancosComponent, controls: {} }, actions);
    document.body.querySelector<HTMLElement>('button[aria-label="Ver cuentas"]')!.click();
    await flushPromises();
  };

  test("a user who may only look at banks sees no account controls", async () => {
    await openAccounts(["VER"]);

    expect(accountControls()).toEqual([]);
  });

  test.each(["NUEVO", "MODIFICAR", "ELIMINAR"])("%s shows only its account control", async (action) => {
    await openAccounts(["VER", action]);

    expect(accountControls()).toEqual([action]);
  });
});
