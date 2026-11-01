import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete } from "vuetify/components";
import CostosPricing from "@/components/Configuracion/Pricing/CostosPricing.vue";
import { useConfiguracionStore } from "@/stores/configuracion";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  httpMock.mockImplementation((config) => {
    if (config.url.includes("costo_pricing")) return new Promise(() => {});
    if (config.url.includes("getModality")) return Promise.resolve({ data: accepted([{ id: 1, name: "Importación" }]) });
    if (config.url.includes("getShipment")) return Promise.resolve({ data: accepted([{ id: 2, embarque: "Marítimo / LCL" }]) });
    return Promise.resolve({ data: accepted([]) });
  });
});

afterEach(() => wrapper?.unmount());

const pencils = () => [...document.body.querySelectorAll("tbody .mdi-pencil")].map((icon) => icon.closest("button")!);
const costLoads = () => httpMock.mock.calls.filter(([config]) => config.url.includes("costo_pricing")).length;

const mountWithTwoIncoterms = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { CostosPricing }, template: "<v-app><CostosPricing /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  const [modality, shipment] = wrapper.findAllComponents(VAutocomplete);
  await modality!.setValue(1);
  await shipment!.setValue(2);
  useConfiguracionStore().lstIncoterms = [{ id: 5, name: "CFR" }, { id: 6, name: "FOB" }] as never;
  await flushPromises();
};

test("opening one incoterm's costs shows the loader on that row's pencil only", async () => {
  await mountWithTwoIncoterms();

  pencils()[0]!.click();
  await flushPromises();

  expect(pencils().map((button) => button.classList.contains("v-btn--loading"))).toEqual([true, false]);
});

test("another pencil clicked while one incoterm is opening does not load a second incoterm over it", async () => {
  await mountWithTwoIncoterms();

  pencils()[0]!.click();
  await flushPromises();
  pencils()[1]!.click();
  await flushPromises();

  expect(costLoads()).toBe(1);
});
