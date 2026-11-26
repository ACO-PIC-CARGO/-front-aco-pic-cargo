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
const subtype = (id: number, codigo: string, id_shipment: number, name: string) => ({
  id, codigo, id_shipment, shipment: "", name, created_at: null, updated_at: null,
});
const LCL_GRUPAL = 1;
const LCL_INDIVIDUAL = 2;
const FCL_INDIVIDUAL = 5;
const SUBTYPES = [
  subtype(LCL_GRUPAL, "001", 3, "Grupal"),
  subtype(LCL_INDIVIDUAL, "002", 3, "Individual"),
  subtype(FCL_INDIVIDUAL, "002", 4, "Individual"),
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

async function openNewQuote(shipment: typeof LCL | null, subtypeId: number | null = null, grupal = false) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listShipment = [LCL, FCL] as never;
  pricing.datosPrincipales = {
    idsentido: 1,
    idtipocarga: shipment ?? "",
    id_shipment_subtype: subtypeId,
    esgrupalflag: grupal,
    esindividualflag: !grupal,
  } as never;
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

async function choose(id: number) {
  subtypeField()!.vm.$emit("update:modelValue", id);
  await flushPromises();
}

test("LCL offers its subtypes in a required field, INDIVIDUAL first", async () => {
  await openNewQuote(LCL, LCL_INDIVIDUAL);

  const field = subtypeField()!;
  expect(field.props("items").map((item: { name: string }) => item.name)).toEqual(["Individual", "Grupal"]);
  expect(field.props("rules")[0](null)).toBe("Dato requerido");
});

test("a quote without subtype shows INDIVIDUAL", async () => {
  const pricing = await openNewQuote(LCL);

  expect(pricing.datosPrincipales.id_shipment_subtype).toBe(LCL_INDIVIDUAL);
});

test("before Datos de Carga is open, choosing GRUPAL switches the quote to grupal at once", async () => {
  const pricing = await openNewQuote(LCL, LCL_INDIVIDUAL);

  await choose(LCL_GRUPAL);

  expect(pricing.datosPrincipales).toMatchObject({ id_shipment_subtype: LCL_GRUPAL, esgrupalflag: true, esindividualflag: false });
  expect(pricing.solicitudSubTipo).toBeNull();
});

test("with Datos de Carga open, choosing GRUPAL asks it to confirm and reload the costs", async () => {
  const pricing = await openNewQuote(LCL, LCL_INDIVIDUAL);
  pricing.datosCargaActiva = true;

  await choose(LCL_GRUPAL);

  expect(pricing.solicitudSubTipo).toEqual({ grupal: true, anterior: LCL_INDIVIDUAL });
  expect(pricing.datosPrincipales.esgrupalflag).toBe(false);
});

test("choosing the subtype the quote already is does not ask again", async () => {
  const pricing = await openNewQuote(LCL, LCL_GRUPAL, true);
  pricing.datosCargaActiva = true;

  await choose(LCL_GRUPAL);

  expect(pricing.solicitudSubTipo).toBeNull();
});

test("a new shipment type starts as its INDIVIDUAL subtype", async () => {
  const pricing = await openNewQuote(LCL, LCL_GRUPAL, true);

  pricing.datosPrincipales.idtipocarga = FCL as never;
  shipmentField().vm.$emit("update:modelValue", FCL);
  await flushPromises();

  expect(pricing.datosPrincipales).toMatchObject({ id_shipment_subtype: FCL_INDIVIDUAL, esgrupalflag: false, esindividualflag: true });
  expect(subtypeField()!.props("items").map((item: { name: string }) => item.name)).toEqual(["Individual"]);
});
