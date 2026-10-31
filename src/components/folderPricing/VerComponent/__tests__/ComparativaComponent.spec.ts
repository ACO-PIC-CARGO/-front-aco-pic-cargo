import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ComparativaComponent from "@/components/folderPricing/VerComponent/ComparativaComponent.vue";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";

vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "77" } }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const freight = { code_cost: 4, id_proveedor: 5, esfleteflag: 1, esopcionflag: 1, status: 1, id_multiplicador: 1, costounitario: 100 };
const originCharge = { code_cost: 7, esorigenflag: 1, esopcionflag: 1, status: 1, id_multiplicador: 1, costounitario: 30 };
const OPTION_TOTALS_DELAY = 100;

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
});
afterEach(() => {
  wrapper?.unmount();
  vi.useRealTimers();
});

async function mountComparativa() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listMultiplicador = [{ id: 1, code: 1, valor: 1 }] as never;
  pricing.opcionCostos = [{ nro_propuesta: 1, selected: true, listCostos: [{ ...freight }] }] as never;
  useAppStore().provedores = [{ id: 5, namelong: "Naviera Uno" }] as never;
  wrapper = mount(ComparativaComponent, { global: { plugins: [createVuetify({ components, directives }), pinia] } });
  await flushPromises();
  return pricing;
}

async function workOutOptionTotals() {
  await vi.advanceTimersByTimeAsync(OPTION_TOTALS_DELAY);
  await flushPromises();
}

const columns = () => wrapper!.findAll("th").map((header) => header.text());

test("the comparison shows its cost columns as soon as the option totals are worked out", async () => {
  await mountComparativa();

  await workOutOptionTotals();

  expect(columns()).toEqual(expect.arrayContaining(["Flete", "TOTAL"]));
});

test("a refreshed comparison shows a new kind of cost as soon as the option totals are worked out", async () => {
  const pricing = await mountComparativa();
  await workOutOptionTotals();
  await vi.advanceTimersByTimeAsync(1000);
  pricing.opcionCostos[0]!.listCostos.push({ ...originCharge } as never);

  pricing.actualizarComparativa = !pricing.actualizarComparativa;
  await flushPromises();
  await workOutOptionTotals();

  expect(columns()).toContain("Origen");
  expect(wrapper!.find("tbody tr").text()).toContain("$30.00");
});
