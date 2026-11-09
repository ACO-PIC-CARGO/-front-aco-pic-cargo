import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CostosComponent from "@/components/folderPricing/Costos/CostosComponent.vue";
import VentasComponent from "@/components/folderPricing/Costos/VentasComponent.vue";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { usePricingStore } from "@/stores/pricing";
import { quoteOptionTotals } from "../quoteOptionTotals";
import type { QuoteCargo } from "../quoteOptionTotals";
import type { Costo, Multiplicador } from "@/types/cotizacion";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRouter: () => ({ push }), useRoute: () => ({ name: "newQuote", params: {} }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: { estadoflag: false, data: [] } }), { post: vi.fn() }) }));
vi.mock("axios", () => ({ default: vi.fn().mockResolvedValue({ data: { estadoflag: false, data: [] } }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const ISO_PERU = 9589;
const multipliers: Multiplicador[] = [
  { id: 1, code: 1, valor: 1 },
  { id: 2, code: 2, valor: 1 },
  { id: 3, code: 3, valor: 1 },
  { id: 13, code: 13, valor: 1 },
  { id: 24, code: 24, valor: 1 },
  { id: 80, code: 8, valor: 1, id_container: 20 },
];
const row = (fields: Partial<Costo>): Costo => ({
  status: 1, esopcionflag: 0, esventaflag: 0, esfleteflag: 0, esorigenflag: 0, eslocalflag: 0,
  esaduanaflag: 0, esalmacenflag: 0, esgastostercerosflag: 0, minimo: 0, cif: 0, seguro: 0,
  considerarvalorminimoflag: false, ...fields,
});
const both = (fields: Partial<Costo>, saleUnit: number): Costo[] => [
  row({ ...fields, esopcionflag: 1 }),
  row({ ...fields, esventaflag: 1, costounitario: saleUnit }),
];

const SCENARIOS: { name: string; cargo: QuoteCargo; costs: Costo[] }[] = [
  {
    name: "LCL with freight, origin, local, customs percentage and a minimum",
    cargo: { weight: 1100, volume: 1.5, amount: 5000, containers: [] },
    costs: [
      ...both({ id_multiplicador: 3, costounitario: 45, esfleteflag: 1, code_cost: 4 }, 60),
      ...both({ id_multiplicador: 1, costounitario: 120, esorigenflag: 1 }, 150),
      ...both({ id_multiplicador: 2, costounitario: 10, minimo: 35, considerarvalorminimoflag: true, eslocalflag: 1 }, 14),
      ...both({ id_multiplicador: 13, cif: 1.5, minimo: 0, esaduanaflag: 1 }, 0),
      ...both({ id_multiplicador: 1, costounitario: 220, esalmacenflag: 1 }, 220),
    ],
  },
  {
    name: "FCL priced per container",
    cargo: { weight: 18000, volume: 28, amount: 20000, containers: [{ id_containers: 20, cantidad: 2 }] },
    costs: [
      ...both({ id_multiplicador: 80, costounitario: 1800, esfleteflag: 1 }, 2100),
      ...both({ id_multiplicador: 80, costounitario: 150, eslocalflag: 1 }, 190),
      ...both({ id_multiplicador: 1, costounitario: 90, esgastostercerosflag: 1 }, 90),
    ],
  },
  {
    name: "small LCL to Peru under the discharge minimum",
    cargo: { weight: 300, volume: 0.4, amount: 800, containers: [] },
    costs: [
      ...both({ id_multiplicador: 2, costounitario: 40, esfleteflag: 1, code_cost: 4 }, 55),
      ...both({ id_multiplicador: 24, costounitario: 10, eslocalflag: 1 }, 12),
    ],
  },
];

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.setItem("iso_pais", String(ISO_PERU));
});
afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
});

test.each(SCENARIOS)("$name: the history totals equal what the cost screens show", async ({ cargo, costs }) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listMultiplicador = multipliers;
  pricing.datosPrincipales = {
    ...pricing.datosPrincipales,
    peso: cargo.weight,
    volumen: cargo.volume,
    amount: cargo.amount,
    containers: cargo.containers,
  };
  pricing.totalFlete = useCotizacionCalculos().calcularTotalFleteVentaPorOpcion({ listCostos: costs });
  const mountOptions = { global: { plugins: [pinia] } };
  shallowMount(CostosComponent, {
    props: { valores: costs.filter((v) => v.esopcionflag == 1), amount: cargo.amount, actualizarCostosFlag: false },
    ...mountOptions,
  });
  shallowMount(VentasComponent, {
    props: { valores: costs.filter((v) => v.esventaflag == 1), amount: cargo.amount, actualizarCostosFlag: false },
    ...mountOptions,
  });
  await vi.advanceTimersByTimeAsync(1000);
  await flushPromises();

  const totals = quoteOptionTotals({ costs, multipliers, cargo, isoCountry: ISO_PERU });

  expect(Number(pricing.totalCosto)).toBeGreaterThan(0);
  expect(totals.cost).toBeCloseTo(Number(pricing.totalCosto), 6);
  expect(totals.sale).toBeCloseTo(Number(pricing.totalVenta), 6);
});
