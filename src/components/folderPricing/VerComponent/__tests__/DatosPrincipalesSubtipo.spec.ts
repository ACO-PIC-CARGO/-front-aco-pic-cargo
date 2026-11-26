import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import DatosPrincipalesComponent from "@/components/folderPricing/VerComponent/DatosPrincipalesComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const SUBTYPES = [
  { id: 1, codigo: "001", id_shipment: 3, shipment: "Marítimo / LCL", name: "Grupal", created_at: null, updated_at: null },
  { id: 2, codigo: "002", id_shipment: 3, shipment: "Marítimo / LCL", name: "Individual", created_at: null, updated_at: null },
];

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  httpMock.mockImplementation(async ({ url }) => ({
    data: accepted(url.slice(URL_MAIN.length).startsWith("shipment_subtype") ? SUBTYPES : []),
  }));
});

afterEach(() => wrapper?.unmount());

async function viewQuote(datos: Record<string, unknown>) {
  const pinia = createPinia();
  setActivePinia(pinia);
  usePricingStore().datosPrincipales = datos as never;
  wrapper = mount(
    defineComponent({ components: { DatosPrincipalesComponent }, template: "<v-app><DatosPrincipalesComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  for (let round = 0; round < 5; round++) await flushPromises();
}

const subtypeField = () =>
  wrapper!.findAllComponents({ name: "VAutocomplete" }).find((field) => field.props("label") === "Sub Tipo de Embarque");

test("the saved subtype is shown as a read-only autocomplete", async () => {
  await viewQuote({ idtipocarga: 3, id_shipment_subtype: 1, shipment_subtype: "Grupal" });

  expect(subtypeField()!.props("readonly")).toBe(true);
  expect(subtypeField()!.props("modelValue")).toBe(1);
  expect(subtypeField()!.text()).toContain("Grupal");
});

test("a subtype deleted from the catalog after it was saved still shows its name", async () => {
  await viewQuote({ idtipocarga: 3, id_shipment_subtype: 9, shipment_subtype: "Antiguo" });

  expect(subtypeField()!.text()).toContain("Antiguo");
});

test.each([
  ["Individual", { esindividualflag: true, esgrupalflag: false }, 2],
  ["Grupal", { esindividualflag: false, esgrupalflag: true }, 1],
])("a quote without a saved subtype, like a calculator quote, shows %s from its flags", async (_mode, flags, shown) => {
  await viewQuote({ idtipocarga: 3, id_shipment_subtype: null, shipment_subtype: null, ...flags });

  expect(subtypeField()!.props("modelValue")).toBe(shown);
});

test("a shipment type without subtypes shows no field", async () => {
  await viewQuote({ idtipocarga: 4, id_shipment_subtype: null, shipment_subtype: null });

  expect(subtypeField()).toBeUndefined();
});
