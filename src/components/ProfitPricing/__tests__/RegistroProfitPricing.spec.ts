import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent, nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import RegistroProfitPricing from "@/components/ProfitPricing/RegistroProfitPricing.vue";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import { useProfitPricingStore } from "@/stores/profitPricing";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;
let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  vi.useFakeTimers();
  pinia = createPinia();
  setActivePinia(pinia);
  usePricingStore().listIncoterms = [{ id: 9, name: "FOB", description: "Free on board" }] as never;
});

afterEach(() => {
  wrapper?.unmount();
  vi.useRealTimers();
});

const mountScreen = async () => {
  wrapper = mount(
    defineComponent({ components: { RegistroProfitPricing }, template: "<v-app><RegistroProfitPricing /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const settle = async () => {
  await nextTick();
  vi.advanceTimersByTime(1_000);
  await flushPromises();
};

const incotermsShown = () => document.body.textContent?.includes("FOB - Free on board") ?? false;

test("choosing Sentido after Tipo de Embarque shows the incoterms and leaves the app usable", { timeout: 15_000 }, async () => {
  await mountScreen();
  const profit = useProfitPricingStore();

  profit.id_shipment = 2;
  await settle();
  profit.id_modality = 1;
  await settle();

  expect(useAppStore().spiner).toBe(false);
  expect(incotermsShown()).toBe(true);
});

test("coming back with Sentido and Tipo de Embarque already chosen shows the incoterms", { timeout: 15_000 }, async () => {
  const profit = useProfitPricingStore();
  profit.id_modality = 1;
  profit.id_shipment = 2;

  await mountScreen();
  await settle();

  expect(incotermsShown()).toBe(true);
});
