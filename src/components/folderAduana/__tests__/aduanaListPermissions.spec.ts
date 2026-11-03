import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListAduana from "@/views/Aduana/ListAduana.vue";
import ListAduanaComponent from "@/components/folderAduana/ListAduanaComponent.vue";
import ListCallComponent from "@/components/folderAduana/ListCallComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, name: "lstQuoteAduanaAduana" }),
}));
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

const ADUANA_LIST = "lstQuoteAduanaAduana";
const PENDING = { id: 9, codigo: "A-9", nombres: "ADUANA SAC", statusmain: 1, aprobadoflag: false };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  sessionStorage.setItem("ConfigEmpresa", JSON.stringify({ existecot: true }));
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0];
    return { data: accepted(path === "listar_aduana" || path === "list_calls_aduana" ? [PENDING] : []) };
  });
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (screen: Component, actions: string[]) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: ADUANA_LIST, actions }], controlled: [ADUANA_LIST] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(screen)) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};
const buttons = (text: string) =>
  [...document.body.querySelectorAll("button")].filter((candidate) => candidate.textContent?.trim().toUpperCase() === text).length;
const button = (text: string) => () => buttons(text) > 0;
const icon = (name: string) => () => document.body.querySelector(`button .${name}`) !== null;

describe.each([
  ["Nueva cotización", ListAduana, button("NUEVA COTIZACIÓN"), "NUEVO"],
  ["Reportes PDF y Excel", ListAduanaComponent, () => buttons("REPORTE") === 2, "EXPORTAR"],
  ["Mercadeo", ListAduanaComponent, button("MERCADEO"), "EXPORTAR"],
  ["Editar", ListAduanaComponent, icon("mdi-pencil"), "MODIFICAR"],
  ["Actualizar estado", ListAduanaComponent, icon("mdi-receipt-text-send-outline"), "MODIFICAR"],
  ["Registrar llamada", ListAduanaComponent, icon("mdi-phone-plus"), "MODIFICAR"],
  ["Eliminar", ListAduanaComponent, icon("mdi-delete"), "ELIMINAR"],
  ["Imprimir llamadas", ListCallComponent, button("IMPRIMIR"), "EXPORTAR"],
  ["Registrar llamada desde llamadas", ListCallComponent, icon("mdi-phone-plus"), "MODIFICAR"],
] as const)("%s on the customs quotes list", (_name, screen, shown, action) => {
  test(`is hidden without ${action}`, async () => {
    await shownWith(screen, ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"].filter((granted) => granted !== action));

    expect(shown()).toBe(false);
  });

  test(`shows with ${action}`, async () => {
    await shownWith(screen, ["VER", action]);

    expect(shown()).toBe(true);
  });
});

test("Editar shows on an approved aduana to anyone who can open the list, since an administrator authorizes it", async () => {
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0];
    return { data: accepted(path === "listar_aduana" ? [{ ...PENDING, aprobadoflag: true }] : []) };
  });

  await shownWith(ListAduanaComponent, ["VER"]);

  expect(icon("mdi-pencil-lock")()).toBe(true);
});
