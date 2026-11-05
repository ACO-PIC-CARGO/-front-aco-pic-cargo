import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import VentasComponent from "@/components/folderPricing/Costos/VentasComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import type { Costo } from "@/types/cotizacion";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRouter: () => ({ push }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: { estadoflag: false, data: [] } }), { post: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const customsSale = (): Costo => ({
  code_cost: 20,
  nameservice: "GASTOS OPERATIVOS",
  esopcionflag: 0,
  esventaflag: 1,
  esaduanaflag: 1,
  status: 1,
  id_multiplicador: 1,
  costounitario: 100,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("the sales totals follow a recalculation announced through actualizarCostosFlag", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listMultiplicador = [{ id: 1, code: 1, valor: 1 }];
  pricing.datosPrincipales = { ...pricing.datosPrincipales, volumen: 1, peso: 100, amount: 0, containers: [] };
  const valores = [customsSale()];
  const wrapper = shallowMount(VentasComponent, {
    props: { valores, amount: 0, actualizarCostosFlag: false },
    global: { plugins: [pinia] },
  });
  await vi.advanceTimersByTimeAsync(200);
  await flushPromises();
  expect(pricing.totalVenta).toBeGreaterThan(0);

  valores[0]!.costounitario = 0;
  await wrapper.setProps({ actualizarCostosFlag: true });
  await vi.advanceTimersByTimeAsync(200);
  await flushPromises();

  expect(pricing.totalVenta).toBe(0);
});
