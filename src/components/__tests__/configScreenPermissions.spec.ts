import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrackingCatalog from "@/views/TrackingCatalog/TrackingCatalog.vue";
import TrackingPhaseCard from "@/components/TrackingCatalog/TrackingPhaseCard.vue";
import TrackingStepComments from "@/components/TrackingCatalog/TrackingStepComments.vue";
import EstatusDefectoComponent from "@/components/FolderConfig/EstatusDefectoComponent.vue";
import CostosPricing from "@/components/Configuracion/Pricing/CostosPricing.vue";
import ModelCostos from "@/components/Configuracion/Pricing/ModelCostos.vue";
import RegistroProfitPricing from "@/components/ProfitPricing/RegistroProfitPricing.vue";
import LCLTextWhatsappCotizacion from "@/components/Configuracion/Pricing/LCLTextWhatsappCotizacion.vue";
import FCLTextWhatsappCotizacion from "@/components/Configuracion/Pricing/FCLTextWhatsappCotizacion.vue";
import { useConfiguracionStore } from "@/stores/configuracion";
import { usePricingStore } from "@/stores/pricing";
import { useProfitPricingStore } from "@/stores/profitPricing";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";
import type { TrackingPhase } from "@/types/trackingCatalog";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const step = {
  id: 5,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  sort_order: 1,
  number: 1,
  visible_to_client: true,
  active: true,
  validation_id: null,
  date_default_id: null,
  allows_skip: false,
};
const phase: TrackingPhase = { id: 1, name: "Origen", icon: "mdi-airplane", sort_order: 1, active: true, first_step_number: 1, last_step_number: 1, steps: [step] };
const cost = { id: 31, id_costo: 4, costo: "FLETE", id_multiplicador: 2, id_proveedor: 9, precio: "10", minimo: 0, status: 1, eslocalflag: true };

const button = (label: string) => () =>
  [...document.body.querySelectorAll("button")].some((element) => element.textContent?.trim().toUpperCase().startsWith(label));
const icon = (name: string) => () => document.body.querySelector(`.${name}`) !== null;

interface Screen {
  name: string;
  route: string;
  component: Component;
  template: string;
  answers?: (url: string) => unknown[];
  prepare?: () => void;
  controls: Record<string, () => boolean>;
}

const screens: Screen[] = [
  {
    name: "tracking catalog",
    route: "lstEstadoBitaco",
    component: TrackingCatalog,
    template: "<screen />",
    answers: (url) => (url.endsWith("tracking_catalog") ? [phase] : []),
    controls: { NUEVO: button("AGREGAR FASE") },
  },
  {
    name: "tracking phase",
    route: "lstEstadoBitaco",
    component: TrackingPhaseCard,
    template: '<screen :phase="phase" :is-first="false" :is-last="false" />',
    controls: {
      NUEVO: button("AGREGAR PASO"),
      MODIFICAR: () => icon("mdi-pencil-outline")() || icon("mdi-arrow-up")() || !document.querySelector<HTMLInputElement>(".v-switch input")!.disabled,
    },
  },
  {
    name: "tracking step comments",
    route: "lstEstadoBitaco",
    component: TrackingStepComments,
    template: '<screen :step="step" />',
    answers: (url) => (url.includes("comments") ? [{ id: 1, comment: "Documentos recibidos." }] : []),
    controls: { NUEVO: button("AGREGAR"), MODIFICAR: icon("mdi-pencil-outline"), ELIMINAR: icon("mdi-delete-outline") },
  },
  {
    name: "default quote status",
    route: "EstatusDefecto",
    component: EstatusDefectoComponent,
    template: "<screen />",
    controls: { MODIFICAR: button("GUARDAR CONFIGURACIÓN") },
  },
  {
    name: "predefined costs",
    route: "CostosPricing",
    component: CostosPricing,
    template: "<screen />",
    prepare: () => {
      useConfiguracionStore().lstIncoterms = [{ id: 5, name: "CFR" }] as never;
    },
    controls: { MODIFICAR: icon("mdi-pencil") },
  },
  {
    name: "predefined costs of an incoterm",
    route: "CostosPricing",
    component: ModelCostos,
    template: '<screen :id-modality="1" :id-shipment="2" :id-incoterms="3" />',
    prepare: () => {
      useConfiguracionStore().lstCostos = [cost] as never;
      usePricingStore().listTipoCostos = [{ codigo: "LO", name: "DESTINO" }] as never;
    },
    controls: { NUEVO: button("AÑADIR COSTO"), COPIAR: icon("mdi-content-copy"), ELIMINAR: icon("mdi-delete") },
  },
  {
    name: "profit per cost",
    route: "RegistroProfitPricing",
    component: RegistroProfitPricing,
    template: "<screen />",
    prepare: () => {
      usePricingStore().listIncoterms = [{ id: 9, name: "FOB", description: "Free on board" }] as never;
      Object.assign(useProfitPricingStore(), { id_modality: 1, id_shipment: 2 });
    },
    controls: { MODIFICAR: icon("mdi-pencil") },
  },
  {
    name: "LCL WhatsApp text",
    route: "TextoWhatsappCotizacion",
    component: LCLTextWhatsappCotizacion,
    template: "<screen />",
    controls: { MODIFICAR: button("GUARDAR") },
  },
  {
    name: "FCL WhatsApp text",
    route: "TextoWhatsappCotizacion",
    component: FCLTextWhatsappCotizacion,
    template: "<screen />",
    controls: { MODIFICAR: button("GUARDAR") },
  },
];

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("permissions");
});

const mountWith = async ({ route, component, template, answers, prepare }: Screen, actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route, actions }], controlled: [route] }));
  httpMock.mockImplementation(async (config) => ({ data: accepted(answers?.(config.url) ?? []) }));
  const pinia = createPinia();
  setActivePinia(pinia);
  prepare?.();
  wrapper = mount(
    defineComponent({ components: { screen: component }, setup: () => ({ phase, step }), template: `<v-app>${template}</v-app>` }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  for (let round = 0; round < 5; round++) await flushPromises();
};

const shownControls = (screen: Screen) =>
  Object.entries(screen.controls)
    .filter(([, shown]) => shown())
    .map(([action]) => action);

describe.each(screens)("$name", (screen) => {
  test("a user who may only look at it sees none of its action controls", async () => {
    await mountWith(screen, ["VER"]);

    expect(shownControls(screen)).toEqual([]);
  });

  test.each(Object.keys(screen.controls))("%s shows its control and only that one", async (action) => {
    await mountWith(screen, ["VER", action]);

    expect(shownControls(screen)).toEqual([action]);
  });
});
