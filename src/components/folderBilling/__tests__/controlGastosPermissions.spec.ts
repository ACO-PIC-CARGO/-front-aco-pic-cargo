import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Component } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ControlGastos from "@/components/folderBilling/ControlGastos.vue";
import EgresosControlGastos from "@/components/folderBilling/EgresosControlGastos.vue";
import FrmControlGastosComponent from "@/components/folderBilling/FrmControlGastosComponent.vue";
import IngresosControlGastos from "@/components/folderBilling/IngresosControlGastos.vue";
import ListControlGastosComponent from "@/components/folderBilling/ListControlGastosComponent.vue";
import TotalesProveedor from "@/components/folderBilling/TotalesProveedor.vue";
import { useAppStore } from "@/stores/app";
import { useControlGastosStore } from "@/stores/controlGastos";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

const route = vi.hoisted(() => ({ name: "editControlGasto", params: { id: "5", id_branch: "7" } as Record<string, string> }));

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => route }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const INCOME = { id: 11, concepto: "Flete", monto_pr: 10, monto_op: 10, facturado: false, pagado: 0 };
const HOUSE_INCOME = { id_house: 3, id_orders: 4, consigner: "ACME", isExpanded: true, ingresos: [INCOME] };
const PROVIDER_EXPENSE = { id_proveedor: 8, nombre_proveedor: "Naviera", code_tipo_proveedor: "01", detalle: [] };
const PROVIDER_TOTAL = { id_proveedor: 8, nameproveedor: "Naviera", type: 2, docs: 0, solicitudes: 0 };
const CONTROL = { id: 5, id_branch: 7, code_master: "M-5" };
let wrapper: VueWrapper | undefined;

// Each case mounts the 3,000-line income and expense screens several times; the full suite runs them under load.
vi.setConfig({ testTimeout: 30000 });

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4, departamento: 1 }]));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.startsWith(URL_MAIN + "getControlList") ? [CONTROL] : []),
  }));
});
afterEach(() => wrapper?.unmount());

async function mountAs(component: Component, actions: string[], options: { props?: object; stubs?: Record<string, boolean> } = {}) {
  sessionStorage.setItem(
    "permissions",
    JSON.stringify({ screens: [{ route: "listControlGastos", actions }], controlled: ["listControlGastos"] }),
  );
  const pinia = createPinia();
  setActivePinia(pinia);
  useControlGastosStore().master_houses = [HOUSE_INCOME] as never;
  useAppStore().itemsDataTotalesProveedor = [PROVIDER_TOTAL] as never;
  wrapper?.unmount();
  wrapper = mount(component, {
    props: options.props ?? {},
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: options.stubs ?? {} },
    attachTo: document.body,
  });
  await flushPromises();
}

const buttonTexts = () => [...document.body.querySelectorAll("button")].map((button) => (button.textContent ?? "").trim());
const shows = (text: string) => buttonTexts().some((label) => label.includes(text));
const hasIcon = (selector: string) => document.body.querySelector(selector) !== null;

test("the control de gastos list starts a control with Nuevo, edits with Modificar and saves the folder with Modificar", async () => {
  const listControls = async (actions: string[]) => {
    await mountAs(ListControlGastosComponent, actions);
    return { nuevo: shows("NUEVO CONTROL"), editar: hasIcon(".mdi-pencil"), ver: hasIcon(".mdi-eye") };
  };

  expect(await listControls(["VER"])).toEqual({ nuevo: false, editar: false, ver: true });
  expect(await listControls(["VER", "NUEVO"])).toEqual({ nuevo: true, editar: false, ver: true });
  expect(await listControls(["VER", "MODIFICAR"])).toEqual({ nuevo: false, editar: true, ver: true });
});

test("the read-only control offers Editar with Modificar and prints the detailed control with Exportar", async () => {
  const formControls = async (actions: string[]) => {
    await mountAs(FrmControlGastosComponent, actions, {
      props: { editable: false },
      stubs: { Ingresos: true, Egresos: true },
    });
    return { editar: shows("EDITAR"), imprimir: shows("CONTROL DETALLADO") };
  };

  expect(await formControls(["VER"])).toEqual({ editar: false, imprimir: false });
  expect(await formControls(["VER", "MODIFICAR"])).toEqual({ editar: true, imprimir: false });
  expect(await formControls(["VER", "EXPORTAR"])).toEqual({ editar: false, imprimir: true });
});

test("each income action shows only with its own permission", async () => {
  const incomeControls = async (actions: string[]) => {
    await mountAs(IngresosControlGastos, actions, { props: { master_houses: [HOUSE_INCOME] } });
    document.body.querySelector<HTMLElement>(".v-expansion-panel-title")?.click();
    await flushPromises();
    return {
      nuevo: shows("Nuevo Concepto") && shows("EMITIR PROFORMA"),
      copiar: shows("Copiar Montos"),
      modificar: shows("Cambiar expediente") && hasIcon(".v-expansion-panel-text .mdi-pencil"),
      eliminar: hasIcon(".v-expansion-panel-text .mdi-delete"),
    };
  };
  const NONE = { nuevo: false, copiar: false, modificar: false, eliminar: false };

  expect(await incomeControls(["VER"])).toEqual(NONE);
  expect(await incomeControls(["VER", "NUEVO"])).toEqual({ ...NONE, nuevo: true });
  expect(await incomeControls(["VER", "COPIAR"])).toEqual({ ...NONE, copiar: true });
  expect(await incomeControls(["VER", "MODIFICAR"])).toEqual({ ...NONE, modificar: true });
  expect(await incomeControls(["VER", "ELIMINAR"])).toEqual({ ...NONE, eliminar: true });
});

test("each expense action shows only with its own permission", async () => {
  const expenseControls = async (actions: string[]) => {
    await mountAs(EgresosControlGastos, actions, { props: { master_egresos: [PROVIDER_EXPENSE] } });
    return {
      nuevo: shows("Nuevo Concepto") && hasIcon("button .mdi-send"),
      copiar: shows("Copiar Montos"),
      cuotas: hasIcon(".mdi-percent-box-outline"),
    };
  };
  const NONE = { nuevo: false, copiar: false, cuotas: false };

  expect(await expenseControls(["VER"])).toEqual(NONE);
  expect(await expenseControls(["VER", "NUEVO"])).toEqual({ ...NONE, nuevo: true });
  expect(await expenseControls(["VER", "COPIAR"])).toEqual({ ...NONE, copiar: true });
  expect(await expenseControls(["VER", "MODIFICAR"])).toEqual({ ...NONE, cuotas: true });
});

test("the house control generates a control or an invoice with Nuevo and prints it with Exportar", async () => {
  const billControls = async (actions: string[]) => {
    route.params = { id_house: "3", id_control: "2" };
    await mountAs(ControlGastos, actions, {
      stubs: { dataHouse: true, ingresos: true, egresos: true, services: true, totalesProveedor: true, totales: true },
    });
    return {
      nuevo: shows("GENERAR NUEVA VERSION DE CONTROL") && shows("EMITIR FACTURA A CLIENTE"),
      imprimir: shows("IMPRIMIR CONTROL"),
    };
  };

  expect(await billControls(["VER"])).toEqual({ nuevo: false, imprimir: false });
  expect(await billControls(["VER", "NUEVO"])).toEqual({ nuevo: true, imprimir: false });
  expect(await billControls(["VER", "EXPORTAR"])).toEqual({ nuevo: false, imprimir: true });
});

test("a payment request to a provider is started only with Nuevo", async () => {
  await mountAs(TotalesProveedor, ["VER", "MODIFICAR", "ELIMINAR", "EXPORTAR"]);
  expect(hasIcon("button .mdi-send")).toBe(false);

  await mountAs(TotalesProveedor, ["VER", "NUEVO"]);
  expect(hasIcon("button .mdi-send")).toBe(true);
});

const openDialogs = async (state: Record<string, unknown>) => {
  Object.assign(wrapper!.vm as unknown as Record<string, unknown>, state);
  await flushPromises();
};
const ABONO = { id: 21, status: 1, path: "abono.pdf" };

test("a client payment is registered with Nuevo, corrected with Modificar and removed with Eliminar", async () => {
  const abonoControls = async (actions: string[]) => {
    await mountAs(IngresosControlGastos, actions, { props: { master_houses: [HOUSE_INCOME] } });
    await openDialogs({ house: { ...HOUSE_INCOME, debscliente: [ABONO] }, dialogDebs: true, dialogNewDebs: true, dialogDebsEdit: true });
    const guardar = buttonTexts().filter((label) => label === "GUARDAR ABONO").length;
    return {
      nuevo: shows("CARGAR NUEVO ABONO"),
      guardar,
      editar: hasIcon(".v-dialog .mdi-pencil"),
      eliminar: hasIcon(".v-dialog .mdi-delete"),
    };
  };
  const NONE = { nuevo: false, guardar: 0, editar: false, eliminar: false };

  expect(await abonoControls(["VER"])).toEqual(NONE);
  expect(await abonoControls(["VER", "NUEVO"])).toEqual({ ...NONE, nuevo: true, guardar: 1 });
  expect(await abonoControls(["VER", "MODIFICAR"])).toEqual({ ...NONE, guardar: 1, editar: true });
  expect(await abonoControls(["VER", "ELIMINAR"])).toEqual({ ...NONE, eliminar: true });
});

test("a new bank account for a payment request is registered only with Nuevo", async () => {
  const offersAccount = async (actions: string[]) => {
    await mountAs(EgresosControlGastos, actions, { props: { master_egresos: [PROVIDER_EXPENSE] } });
    await openDialogs({ dialogSolicitud: true, e1: 2 });
    return shows("Nueva Cuenta Bancaria");
  };

  expect(await offersAccount(["VER", "MODIFICAR", "ELIMINAR", "EXPORTAR"])).toBe(false);
  expect(await offersAccount(["VER", "NUEVO"])).toBe(true);
});
