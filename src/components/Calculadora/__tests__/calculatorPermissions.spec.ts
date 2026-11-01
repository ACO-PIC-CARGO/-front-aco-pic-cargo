import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ConfiguracionOpcionCalculadora from "@/views/Calculadora/ConfiguracionOpcionCalculadora.vue";
import FleteListComponent from "@/components/Calculadora/FleteListComponent.vue";
import ConfiguracionCalculadora from "@/components/Calculadora/ConfiguracionCalculadora.vue";
import FleteComponent from "@/components/Calculadora/FleteComponent.vue";
import FleteGrupal from "@/components/Calculadora/FleteGrupal.vue";
import TransporteCalculadora from "@/components/Calculadora/TransporteCalculadora.vue";
import ListUserCalcComponent from "@/components/Calculadora/ListUserCalcComponent.vue";
import BotonesHeader from "@/components/comun/BotonesHeader.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ name: "VerCotizacionCalculadora", query: {}, params: {} }),
}));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }), isVisible: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const ROW = { id: 1, opcion: 1, editarflag: false, estadocotizacion: 1, detalle: [] };
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
const FREIGHT = "ServiciosCostosFijosLCL";
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, users: "ana" }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, id_pais: 1, iso_pais: "PE" }]));
  httpMock.mockResolvedValue({ data: accepted([ROW]) });
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (screen: string, view: Component, actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: screen, actions }], controlled: [screen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  Object.assign(useCalculadorasStore(), { lstFlete: [ROW], lstTransporte: [ROW] });
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(view, { type: "LCL" })) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};
const button = (text: string) => async () =>
  [...document.body.querySelectorAll("button")].some((candidate) => candidate.textContent?.trim().toUpperCase().includes(text));
const icon = (name: string) => async () => document.body.querySelector(`.${name}`) !== null;
const onTab = (label: string, shown: () => Promise<boolean>) => async () => {
  [...document.body.querySelectorAll<HTMLElement>(".v-tab")].find((tab) => tab.textContent?.trim() === label)!.click();
  await flushPromises();
  return shown();
};

describe.each([
  ["Editar on Config opciones", "calcOpciones", ConfiguracionOpcionCalculadora, button("EDITAR"), "MODIFICAR"],
  ["the freight pencil", FREIGHT, FleteListComponent, icon("mdi-pencil"), "MODIFICAR"],
  ["the configuration edit", FREIGHT, ConfiguracionCalculadora, icon("mdi-square-edit-outline"), "MODIFICAR"],
  ["Guardar of the freight bulk load", FREIGHT, FleteComponent, button("GUARDAR"), "NUEVO"],
  ["Nuevo Flete Grupal", FREIGHT, FleteGrupal, onTab("Costo", button("NUEVO FLETE GRUPAL")), "NUEVO"],
  ["the group tariff pencil", FREIGHT, FleteGrupal, onTab("Costo", icon("mdi-pencil")), "MODIFICAR"],
  ["the group tariff trash", FREIGHT, FleteGrupal, onTab("Costo", icon("mdi-delete")), "ELIMINAR"],
  ["Nuevo Registro of transport", FREIGHT, TransporteCalculadora, button("NUEVO REGISTRO"), "NUEVO"],
  ["the transport pencil", FREIGHT, TransporteCalculadora, icon("mdi-pencil"), "MODIFICAR"],
  ["the transport trash", FREIGHT, TransporteCalculadora, icon("mdi-delete"), "ELIMINAR"],
  ["Guardar of the transport bulk load", FREIGHT, TransporteCalculadora, onTab("Carga Masiva", button("GUARDAR")), "NUEVO"],
  ["Exportar of the calculator users", "listUserCalc", ListUserCalcComponent, button("EXPORTAR"), "EXPORTAR"],
  ["Registro Llamada", "listUserCalc", ListUserCalcComponent, button("REGISTRO LLAMADA"), "MODIFICAR"],
  ["Enviar Pricing on the calculator users", "listUserCalc", ListUserCalcComponent, button("ENVIAR PRICING"), "MODIFICAR"],
  ["Enviar Pricing on the calculator quote", "listUserCalc", BotonesHeader, button("ENVIAR PRICING"), "MODIFICAR"],
] as const)("%s", (_name, screen, view, shown, action) => {
  test(`is hidden without ${action}`, async () => {
    await shownWith(screen, view, ALL_ACTIONS.filter((granted) => granted !== action));

    expect(await shown()).toBe(false);
  });

  test(`shows with ${action}`, async () => {
    await shownWith(screen, view, ["VER", action]);

    expect(await shown()).toBe(true);
  });
});
