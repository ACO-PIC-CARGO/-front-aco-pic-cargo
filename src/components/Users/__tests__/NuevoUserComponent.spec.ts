import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VAutocomplete } from "vuetify/components";
import * as directives from "vuetify/directives";
import NuevoUserComponent from "@/components/Users/NuevoUserComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const roleOptions = [
  { id: 5, name: "Ventas", description: "Equipo comercial" },
  { id: 6, name: "Operaciones", description: null },
];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id_user: 4 }]));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.startsWith(URL_MAIN + "roles/options") ? roleOptions : []),
  }));
});

afterEach(() => wrapper?.unmount());

test("the role picker offers every role the user may assign, ready to choose", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { NuevoUserComponent }, template: "<v-app><NuevoUserComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  await wrapper.findAll(".v-tab").find((tab) => tab.text().includes("Módulos a Usar"))!.trigger("click");
  await flushPromises();

  const picker = wrapper.findAllComponents(VAutocomplete).find((field) => field.props("label") === "Módulo")!;
  await picker.find(".v-field").trigger("mousedown");
  await flushPromises();

  const options = [...document.body.querySelectorAll(".v-overlay--active .v-list-item")];
  expect(options.map((option) => option.textContent?.trim())).toEqual(["Ventas", "Operaciones"]);
  expect(options.filter((option) => option.classList.contains("v-list-item--disabled"))).toEqual([]);
  expect(httpMock.mock.calls.some(([config]) => config.url.includes("cargar_posicion"))).toBe(false);
});

test("a new user form opens without required-field errors", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { NuevoUserComponent }, template: "<v-app><NuevoUserComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();

  expect(wrapper.findAll(".v-input--error").map((field) => field.find("label").text())).toEqual([]);
});
