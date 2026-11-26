import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import axios from "@/api/http";
import DatosCargaComponent from "@/components/folderPricing/DatosCargaComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRouter: () => ({ push }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: { estadoflag: false, data: [] } }), { post: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

// The mode now comes from the "Sub Tipo de Embarque" combo: Datos Principales asks, Datos de Carga confirms.
const PREVIOUS_SUBTYPE = 2;

const modalTitles = () => vi.mocked(Swal.fire).mock.calls.map(([options]) => String((options as { title?: string }).title ?? ""));

async function openNewQuote({ grupal = false } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  const pricing = usePricingStore();
  pricing.datosPrincipales = { ...pricing.datosPrincipales, id: "", esindividualflag: !grupal, esgrupalflag: grupal };
  useMasterusuariosStore().lstPercepcionAduana = [
    { id: 1, codigo: "01", codigo01: "10" },
    { id: 2, codigo: "02", codigo01: "3.5" },
  ] as never;
  const wrapper = shallowMount(DatosCargaComponent, { global: { plugins: [pinia] } });
  await flushPromises();
  vi.mocked(Swal.fire).mockClear();
  const switchTo = (mode: "Grupal" | "Individual") => {
    pricing.solicitudSubTipo = { grupal: mode === "Grupal", anterior: PREVIOUS_SUBTYPE };
  };
  return { pricing, switchTo, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

test("a new quote asks before switching to Grupal and switches when confirmed", async () => {
  const { pricing, switchTo } = await openNewQuote();

  switchTo("Grupal");
  await flushPromises();

  expect(modalTitles()).toEqual([expect.stringContaining("¿Cambiar a modalidad grupal?")]);
  expect(pricing.datosPrincipales).toMatchObject({ esgrupalflag: true, esindividualflag: false });
});

test("a new quote asks before switching to Individual", async () => {
  const { switchTo } = await openNewQuote({ grupal: true });

  switchTo("Individual");
  await flushPromises();

  expect(modalTitles()).toEqual([expect.stringContaining("¿Cambiar a modalidad individual?")]);
});

test("cancelling the question keeps a new quote in its mode and puts its subtype back", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  const { pricing, switchTo } = await openNewQuote();

  switchTo("Grupal");
  await flushPromises();

  expect(pricing.datosPrincipales).toMatchObject({ esgrupalflag: false, esindividualflag: true, id_shipment_subtype: PREVIOUS_SUBTYPE });
});

// Los shippers se eligen en el instructivo: Datos de la carga ya no pide proveedor.
test("a new quote no longer asks for the SHIPPER provider", async () => {
  await openNewQuote();

  const providerRequest = vi.mocked(axios).mock.calls
    .map(([config]) => config as { url?: string })
    .find(({ url }) => url?.includes("cargar_proveedor_x_rol"));

  expect(providerRequest).toBeUndefined();
});

test.each([
  ["Grupal", false],
  ["Individual", true],
])("confirming the switch to %s asks the costs tab to recalculate its totals", async (mode, startsGrupal) => {
  vi.useFakeTimers();
  try {
    const { pricing, switchTo } = await openNewQuote({ grupal: startsGrupal });
    const before = pricing.actualizarCostosFlag;

    switchTo(mode as "Grupal" | "Individual");
    await vi.advanceTimersByTimeAsync(1000);

    expect(pricing.actualizarCostosFlag).toBe(!before);
  } finally {
    vi.useRealTimers();
  }
});
