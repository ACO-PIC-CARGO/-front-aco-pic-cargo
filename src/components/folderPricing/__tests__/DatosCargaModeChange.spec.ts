import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import DatosCargaComponent from "@/components/folderPricing/DatosCargaComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRouter: () => ({ push }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: { estadoflag: false, data: [] } }), { post: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface ModeSwitches {
  proxyIndividual: boolean;
  proxyGrupal: boolean;
}

const modalTitles = () => vi.mocked(Swal.fire).mock.calls.map(([options]) => String((options as { title?: string }).title ?? ""));

async function openNewQuote({ grupal = false } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.datosPrincipales = { ...pricing.datosPrincipales, id: "", esindividualflag: !grupal, esgrupalflag: grupal };
  useMasterusuariosStore().lstPercepcionAduana = [
    { id: 1, codigo: "01", codigo01: "10" },
    { id: 2, codigo: "02", codigo01: "3.5" },
  ] as never;
  const wrapper = shallowMount(DatosCargaComponent, { global: { plugins: [pinia] } });
  await flushPromises();
  vi.mocked(Swal.fire).mockClear();
  return { pricing, switches: wrapper.vm as unknown as ModeSwitches };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

test("a new quote asks before switching to Grupal and switches when confirmed", async () => {
  const { pricing, switches } = await openNewQuote();

  switches.proxyGrupal = true;
  await flushPromises();

  expect(modalTitles()).toEqual([expect.stringContaining("¿Cambiar a modalidad grupal?")]);
  expect(pricing.datosPrincipales).toMatchObject({ esgrupalflag: true, esindividualflag: false });
});

test("a new quote asks before switching to Individual", async () => {
  const { switches } = await openNewQuote({ grupal: true });

  switches.proxyIndividual = true;
  await flushPromises();

  expect(modalTitles()).toEqual([expect.stringContaining("¿Cambiar a modalidad individual?")]);
});

test("cancelling the question keeps a new quote in its mode", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  const { pricing, switches } = await openNewQuote();

  switches.proxyGrupal = true;
  await flushPromises();

  expect(pricing.datosPrincipales).toMatchObject({ esgrupalflag: false, esindividualflag: true });
});

test("clicking the mode a new quote already has keeps it without asking", async () => {
  const { pricing, switches } = await openNewQuote();

  switches.proxyIndividual = false;
  await flushPromises();

  expect(modalTitles()).toEqual([]);
  expect(pricing.datosPrincipales).toMatchObject({ esgrupalflag: false, esindividualflag: true });
});

test.each([
  ["Grupal", false],
  ["Individual", true],
])("confirming the switch to %s asks the costs tab to recalculate its totals", async (mode, startsGrupal) => {
  vi.useFakeTimers();
  try {
    const { pricing, switches } = await openNewQuote({ grupal: startsGrupal });
    const before = pricing.actualizarCostosFlag;

    if (mode === "Grupal") switches.proxyGrupal = true;
    else switches.proxyIndividual = true;
    await vi.advanceTimersByTimeAsync(1000);

    expect(pricing.actualizarCostosFlag).toBe(!before);
  } finally {
    vi.useRealTimers();
  }
});
