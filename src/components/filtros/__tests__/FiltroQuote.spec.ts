import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import FiltroQuote from "@/components/filtros/FiltroQuote.vue";
import { usePricingStore } from "@/stores/pricing";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

const lastListParams = () => {
  const requests = httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + "getQuoteList");
  return requests[requests.length - 1]![0].params;
};
const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name)!;
const deletedSwitch = () =>
  [...document.body.querySelectorAll(".v-switch")].find((field) => field.textContent?.includes("Ver cotizaciones eliminadas"))!
    .querySelector<HTMLInputElement>("input")!;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  httpMock.mockImplementation(async () => ({ data: accepted([]) }));
});
afterEach(() => wrapper?.unmount());

test("the deleted quotes filter lists only deleted quotes, and clearing the filters goes back to active ones", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  usePricingStore().resetQuoteFilter();
  wrapper = mount(defineComponent({ components: { FiltroQuote }, template: "<v-app><FiltroQuote /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();

  deletedSwitch().click();
  await flushPromises();
  buttonNamed("Filtrar").click();
  await flushPromises();

  expect(lastListParams()).toMatchObject({ estado: "0" });

  buttonNamed("Limpiar").click();
  await flushPromises();

  expect(lastListParams()).toMatchObject({ estado: "1" });
});
