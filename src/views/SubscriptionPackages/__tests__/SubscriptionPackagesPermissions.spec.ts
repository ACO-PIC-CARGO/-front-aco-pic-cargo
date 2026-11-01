import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import SubscriptionPackages from "@/views/SubscriptionPackages/SubscriptionPackages.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
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

const START = {
  id: 1,
  name: "START",
  tagline: "Para empezar",
  monthly_price: "29.00",
  annual_price: "290.00",
  user_limit: 1,
  module_selection_limit: null,
  is_featured: false,
  is_active: true,
  trial_enabled: false,
  trial_interval: null,
  trial_frequency: null,
  modules: [],
  features: [],
};
const BODIES: Record<string, unknown> = {
  subscription_packages: accepted([START]),
  registration_trial_setting: accepted([{ trial_days: 30 }]),
  "subscription_packages/paddle_sync": accepted([{ package_id: 1, name: "START", is_active: true, actions: [{ label: "Crear" }] }]),
};
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockImplementation(async (config) => ({ data: BODIES[config.url.replace(URL_MAIN, "")] ?? accepted([]) }));
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstPlanes", actions }], controlled: ["lstPlanes"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(SubscriptionPackages)) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};
const buttons = () => [...document.body.querySelectorAll("button")];
const button = (text: string) => async () => buttons().some((candidate) => candidate.textContent?.trim().startsWith(text));
const labelled = (label: string) => async () => document.body.querySelector(`button[aria-label="${label}"]`) !== null;
const inPaddleSync = (text: string) => async () => {
  buttons().find((candidate) => candidate.textContent?.includes("Verificar Paddle"))!.click();
  await flushPromises();
  return button(text)();
};

describe.each([
  ["Nuevo paquete", button("Nuevo paquete"), "NUEVO"],
  ["Editar", labelled("Editar ACO START"), "MODIFICAR"],
  ["Desactivar", labelled("Desactivar ACO START"), "ELIMINAR"],
  ["Guardar of the trial days", button("Guardar"), "MODIFICAR"],
  ["Aplicar cambios of the Paddle sync", inPaddleSync("Aplicar cambios"), "MODIFICAR"],
] as const)("%s on the subscription packages screen", (_name, shown, action) => {
  test(`is hidden without ${action}`, async () => {
    await shownWith(ALL_ACTIONS.filter((granted) => granted !== action));

    expect(await shown()).toBe(false);
  });

  test(`shows with ${action}`, async () => {
    await shownWith(["VER", action]);

    expect(await shown()).toBe(true);
  });
});
