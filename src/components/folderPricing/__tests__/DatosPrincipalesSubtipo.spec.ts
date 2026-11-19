import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import DatosPrincipales from "@/components/folderPricing/DatosPrincipales.vue";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "newQuote" }), useRouter: () => ({ push: vi.fn() }) }));
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

const LCL = { id: 3, embarque: "Marítimo / LCL" };
const FCL = { id: 4, embarque: "Marítimo / FCL" };
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

async function openNewQuote(shipment: typeof LCL | null, subtype: number | null = null) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listShipment = [LCL, FCL] as never;
  pricing.datosPrincipales = { idsentido: 1, idtipocarga: shipment ?? "", id_shipment_subtype: subtype } as never;
  wrapper = mount(
    defineComponent({ components: { DatosPrincipales }, template: "<v-app><DatosPrincipales /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  for (let round = 0; round < 5; round++) await flushPromises();
  return pricing;
}

const subtypeField = () =>
  wrapper!.findAllComponents({ name: "VAutocomplete" }).find((field) => field.props("label") === "Sub Tipo de Embarque");
const shipmentField = () =>
  wrapper!.findAllComponents({ name: "VAutocomplete" }).find((field) => field.props("label") === "Tipo de Embarque")!;

test("a shipment type with subtypes shows them, and only them, in a required field", async () => {
  await openNewQuote(LCL);

  const field = subtypeField()!;
  expect(field.props("items").map((item: { name: string }) => item.name)).toEqual(["Grupal", "Individual"]);
  expect(field.props("rules")[0](null)).toBe("Dato requerido");
});

test("a shipment type without subtypes shows no subtype field, so it never blocks saving", async () => {
  await openNewQuote(FCL);

  expect(subtypeField()).toBeUndefined();
});

test("a quote loaded with only the shipment id still offers its subtypes", async () => {
  await openNewQuote({ id: 3 } as typeof LCL, 2);
  const pricing = usePricingStore();
  pricing.datosPrincipales.idtipocarga = 3;
  await flushPromises();

  expect(subtypeField()!.props("modelValue")).toBe(2);
});

test("changing to a shipment type the chosen subtype does not belong to clears it", async () => {
  const pricing = await openNewQuote(LCL, 1);

  pricing.datosPrincipales.idtipocarga = FCL as never;
  shipmentField().vm.$emit("update:modelValue", FCL);
  await flushPromises();

  expect(pricing.datosPrincipales.id_shipment_subtype).toBeNull();
  expect(subtypeField()).toBeUndefined();
});
