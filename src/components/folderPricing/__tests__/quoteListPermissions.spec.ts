import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListPricing from "@/views/folderPricing/ListPricing.vue";
import ListQuoteComponent from "@/components/folderPricing/ListQuoteComponent.vue";
import ListCallComponent from "@/components/folderPricing/ListCallComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {}, name: "lstQuote" }) }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
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

const DRAFT = { id: 6, codigo: "Q-6", nombres: "BORRADOR SAC", statusmain: 1, statusquote: 3, aprobadoflag: false, totalregistro: "1" };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  sessionStorage.setItem("ConfigEmpresa", JSON.stringify({ existecot: true }));
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0];
    return { data: accepted(path === "getQuoteList" ? [DRAFT] : []) };
  });
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (screen: Component, actions: string[]) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstQuote", actions }], controlled: ["lstQuote"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(screen)) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};
const button = (text: string) => () =>
  [...document.body.querySelectorAll("button")].some((candidate) => candidate.textContent?.trim().toUpperCase() === text);
const labelled = (label: string) => () => document.body.querySelector(`button[aria-label="${label}"]`) !== null;

describe.each([
  ["Nueva cotización", ListPricing, button("NUEVA COTIZACIÓN"), "NUEVO"],
  ["Editar", ListQuoteComponent, labelled("Editar cotización"), "MODIFICAR"],
  ["Registrar llamada", ListQuoteComponent, labelled("Registrar llamada"), "MODIFICAR"],
  ["Eliminar", ListQuoteComponent, labelled("Eliminar cotización"), "ELIMINAR"],
  ["Reporte de llamadas", ListCallComponent, button("REPORTE"), "EXPORTAR"],
] as const)("%s on the quotes list", (_name, screen, shown, action) => {
  test(`is hidden without ${action}`, async () => {
    await shownWith(screen, ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"].filter((granted) => granted !== action));

    expect(shown()).toBe(false);
  });

  test(`shows with ${action}`, async () => {
    await shownWith(screen, ["VER", action]);

    expect(shown()).toBe(true);
  });
});
