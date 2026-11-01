import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListadoEmpresasComponent from "@/components/FolderEnterprise/ListadoEmpresasComponent.vue";
import ActualizarEmpresaComponent from "@/components/FolderEnterprise/ActualizarEmpresaComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn(), go: vi.fn() }), useRoute: () => ({ params: { id: "7" } }) }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "updateEnterprise" } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const COMPANY = { id: 7, id_pais: 1, id_state: 1, id_city: 1, trade_name: "ACME", status: 1 };
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0];
    return { data: accepted(path === "listar_enterprise" || path === "ver_enterprise" ? [COMPANY] : []) };
  });
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (screen: Component, actions: string[]) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listEnterprise", actions }], controlled: ["listEnterprise"] }));
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
const icon = (name: string) => () => document.body.querySelector(`.${name}`) !== null;
const onBankTab = (shown: () => boolean) => async () => {
  [...document.body.querySelectorAll<HTMLElement>(".v-tab")].find((tab) => tab.textContent?.includes("Datos Bancarios"))!.click();
  await flushPromises();
  return shown();
};

describe.each([
  ["the pencil on the companies list", ListadoEmpresasComponent, icon("mdi-pencil")],
  ["Guardar on the company edit screen", ActualizarEmpresaComponent, button("GUARDAR")],
  ["Nueva Cuenta on the company edit screen", ActualizarEmpresaComponent, onBankTab(button("NUEVA CUENTA"))],
] as const)("%s", (_name, screen, shown) => {
  test("is hidden without MODIFICAR", async () => {
    await shownWith(screen, ALL_ACTIONS.filter((action) => action !== "MODIFICAR"));

    expect(await shown()).toBe(false);
  });

  test("shows with MODIFICAR", async () => {
    await shownWith(screen, ["VER", "MODIFICAR"]);

    expect(await shown()).toBe(true);
  });
});
