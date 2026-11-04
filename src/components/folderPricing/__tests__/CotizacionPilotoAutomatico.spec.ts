import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import CotizacionPilotoAutomatico from "@/components/folderPricing/CotizacionPilotoAutomatico.vue";
import { usePricingStore } from "@/stores/pricing";
import type { Costo, OpcionCosto } from "@/types/cotizacion";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRouter: () => ({ push }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface Wizard {
  e6: number;
  profit: number;
  continuar(step: number): Promise<void>;
  copiarCostostoVentas(): void;
  editarCotizacion(): Promise<void>;
}

const freightCost = (): Costo => ({ code_cost: 1, nameservice: "FLETE", esopcionflag: 1, esventaflag: 0, esfleteflag: 1, status: 1, id_multiplicador: 1, costounitario: 0 });
const freightSale = (): Costo => ({ code_cost: 1, nameservice: "FLETE", esopcionflag: 0, esventaflag: 1, esfleteflag: 1, status: 1, id_multiplicador: 1, costounitario: 0 });
const option = (nro_propuesta: number): OpcionCosto => ({
  nro_propuesta,
  date_end: "2026-12-01",
  tiempo_transito: 30,
  listCostos: [freightCost(), freightSale()],
  listImpuestos: [],
  listNotasQuote: [],
  selected: true,
});
const profitLines = (opcion: OpcionCosto) => opcion.listCostos.filter((cost) => cost.nameservice === "PROFIT");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});
afterEach(() => vi.restoreAllMocks());

async function openWizard({ editing = 0 } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.opcionCostos = [option(1), option(2)];
  pricing.index = editing;
  pricing.id = 77;
  pricing.tiporeporte = "TOTAL";
  pricing.listMultiplicador = [{ id: 1, code: 1, valor: 1 }];
  const wrapper = shallowMount(CotizacionPilotoAutomatico, { global: { plugins: [pinia] } });
  await flushPromises();
  return { pricing, wrapper, wizard: wrapper.vm as unknown as Wizard };
}

test("closing the wizard without finishing leaves the quote without a PROFIT line", async () => {
  const { pricing, wrapper, wizard } = await openWizard();
  wizard.profit = 50;
  await wizard.continuar(5);

  wrapper.unmount();

  expect(pricing.opcionCostos.flatMap(profitLines)).toEqual([]);
});

test("finishing twice saves the quote once with a single PROFIT line, then opens it", async () => {
  const { pricing, wrapper, wizard } = await openWizard();
  let answer!: (saved: boolean) => void;
  const save = vi.spyOn(pricing, "updateQuote").mockReturnValue(new Promise((resolve) => (answer = resolve)));
  wizard.profit = 50;

  const first = wizard.editarCotizacion();
  const second = wizard.editarCotizacion();
  answer(true);
  await Promise.all([first, second]);

  expect(save).toHaveBeenCalledTimes(1);
  expect(profitLines(pricing.opcionCostos[0]!)).toMatchObject([{ costounitario: 50, esventaflag: 1 }]);
  expect(push).toHaveBeenCalledWith(expect.objectContaining({ name: "verQuote" }));
  expect(wrapper.emitted("close")).toHaveLength(1);
});

test("a finish the server refuses stays open and a retry still adds a single PROFIT line", async () => {
  const { pricing, wrapper, wizard } = await openWizard();
  const save = vi.spyOn(pricing, "updateQuote").mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  wizard.profit = 50;

  await wizard.editarCotizacion();

  expect(push).not.toHaveBeenCalled();
  expect(wrapper.emitted("close")).toBeUndefined();
  expect(profitLines(pricing.opcionCostos[0]!)).toEqual([]);

  await wizard.editarCotizacion();

  expect(save).toHaveBeenCalledTimes(2);
  expect(profitLines(pricing.opcionCostos[0]!)).toHaveLength(1);
});

test("the wizard works on the option being edited", async () => {
  const { pricing, wizard } = await openWizard({ editing: 1 });
  vi.spyOn(pricing, "updateQuote").mockResolvedValue(true);
  wizard.profit = 50;

  await wizard.editarCotizacion();

  expect(profitLines(pricing.opcionCostos[0]!)).toEqual([]);
  expect(profitLines(pricing.opcionCostos[1]!)).toHaveLength(1);
});

test("the wizard leaves the costs step even while a cost is 0, as a template line can be", async () => {
  const { wizard } = await openWizard();
  wizard.e6 = 2;

  await wizard.continuar(3);

  expect(wizard.e6).toBe(3);
  expect(Swal.fire).not.toHaveBeenCalled();
});

test("moving through the wizard keeps the quote's report type", async () => {
  const { pricing, wizard } = await openWizard();
  pricing.opcionCostos[0]!.listCostos[0]!.costounitario = 120;

  await wizard.continuar(3);
  await wizard.continuar(4);

  expect(pricing.tiporeporte).toBe("TOTAL");
});

test("copying costs to sales follows the concept even after it was renamed", async () => {
  const { pricing, wizard } = await openWizard();
  const [cost, sale] = pricing.opcionCostos[0]!.listCostos;
  cost!.nameservice = "FLETE MARÍTIMO";
  cost!.costounitario = 120;

  wizard.copiarCostostoVentas();

  expect(sale!.costounitario).toBe(120);
});
