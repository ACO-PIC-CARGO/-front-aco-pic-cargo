import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DatosCostosComponent from "@/components/folderPricing/DatosCostosComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import type { OpcionCosto } from "@/types/cotizacion";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
vi.mock("@/components/folderPricing/Costos/CostosComponent.vue", () => ({ default: { template: "<div />" } }));
vi.mock("@/components/folderPricing/Costos/VentasComponent.vue", () => ({ default: { template: "<div />" } }));
vi.mock("@/components/folderPricing/Costos/ImpuestosComponent.vue", () => ({ default: { template: "<div />" } }));

const VFormStub = {
  name: "VForm",
  template: "<form><slot /></form>",
  methods: {
    validate: () => Promise.resolve({ valid: true }),
    resetValidation: () => undefined,
  },
};

const optionWithFreight = (nro_propuesta: number, freight: number): OpcionCosto => ({
  nro_propuesta,
  date_end: "2099-01-01",
  tiempo_transito: 30,
  selected: true,
  listImpuestos: [],
  listNotasQuote: [],
  listCostos: [{ esfleteflag: 1, status: 1, esventaflag: 1, id_multiplicador: 1, costounitario: freight }],
});

async function openCosts({ filling }: { filling: boolean }) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listMultiplicador = [{ id: 1, code: 2, valor: 1 }];
  pricing.datosPrincipales.volumen = 1;
  pricing.opcionCostos = [optionWithFreight(1, 500), optionWithFreight(2, 900)];
  pricing.llenadoCostos = filling;
  pricing.totalFlete = 0;
  const wrapper = shallowMount(DatosCostosComponent, {
    global: { plugins: [pinia], renderStubDefaultSlot: true, stubs: { VForm: VFormStub } },
  });
  await flushPromises();
  return { pricing, screen: wrapper.vm as unknown as Record<string, (...args: unknown[]) => unknown> };
}

beforeEach(() => vi.clearAllMocks());

test("entering an option's costs prices its percentage lines with that option's sale freight", async () => {
  const { pricing, screen } = await openCosts({ filling: true });
  pricing.index = 1;

  await screen.pasarLlenadoCostos!();

  expect(pricing.totalFlete).toBe(900);
});

test("cancelling a new option goes back to the previous option's sale freight", async () => {
  vi.useFakeTimers();
  try {
    const { pricing, screen } = await openCosts({ filling: true });
    pricing.index = 1;

    screen.cancelarLlenadoCostos!();
    await vi.advanceTimersByTimeAsync(200);

    expect(pricing.totalFlete).toBe(500);
  } finally {
    vi.useRealTimers();
  }
});

test("paging to another option prices its percentage lines with that option's sale freight", async () => {
  const { pricing, screen } = await openCosts({ filling: false });

  screen.cambiarPagina!(2);
  await flushPromises();

  expect(pricing.totalFlete).toBe(900);
});
