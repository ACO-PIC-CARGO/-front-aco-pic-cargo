import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import InstructivoComponent from "@/components/folderPricing/VerComponent/InstructivoComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import type { AprobacionCotizacion, OpcionCosto } from "@/types/cotizacion";

vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "77" } }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

interface InstructivoState {
  nro_propuesta: number;
  id_exp: number;
  continuarAprobarHouses(): Promise<void>;
  continuarAprobar(): Promise<void>;
  approveQuote(details: AprobacionCotizacion): Promise<void>;
  imprimir(): Promise<void>;
}

const option = (nro_propuesta: number, selected: boolean): OpcionCosto => ({
  nro_propuesta,
  date_end: "2026-12-01",
  tiempo_transito: 30,
  listCostos: [],
  listImpuestos: [],
  listNotasQuote: [],
  selected,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function mountInstructivo() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  vi.spyOn(pricing, "generaInstructivoparaguardata").mockResolvedValue(undefined);
  const wrapper = shallowMount(InstructivoComponent, { global: { plugins: [pinia] } });
  await flushPromises();
  return { pricing, screen: wrapper.vm as unknown as InstructivoState };
}

test("a failed approval is retried with a new key and the approved quote's final amounts are not saved again", async () => {
  const { pricing, screen } = await mountInstructivo();
  pricing.listIngresosInstructivoAprobar = [
    { nro_propuesta: 1, dataIngresos: [{ descripcion: "TOTAL", igv: 18, valor: 118 }], dataCostos: [], dataVentas: [], totalIngresos: 0, totalCostos: 0 },
  ];
  screen.nro_propuesta = 1;
  screen.id_exp = 5;
  const approve = vi.spyOn(pricing, "aprobarCotizacion").mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const saveFinalAmounts = vi.spyOn(pricing, "GuardaCostosFinalesQuote").mockResolvedValue(undefined);

  await screen.continuarAprobarHouses();
  await screen.continuarAprobarHouses();

  const [firstKey, retryKey] = approve.mock.calls.map(([data]) => (data as AprobacionCotizacion).IdempotencyKey);
  expect(firstKey).toBeTruthy();
  expect(retryKey).toBeTruthy();
  expect(retryKey).not.toBe(firstKey);
  expect(saveFinalAmounts).not.toHaveBeenCalled();
});

const pendingTrafficFile = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, sent: false };

function answerAsQuoteInTraffic() {
  vi.mocked(http).mockImplementation((async (config: { url: string }) => {
    if (config.url.endsWith("traffic_by_quote")) return { data: { estadoflag: true, data: [pendingTrafficFile] } };
    if (config.url.endsWith("traffic/4/send_to_operations")) {
      return { data: { estadoflag: true, mensaje: "ok", data: [{ code_master: "2026MBL01742", id_master: 2701, id_house: 90 }] } };
    }
    return { data: { estadoflag: false, mensaje: "No se encontraron registros", data: [] } };
  }) as never);
}

const sentToOperations = () =>
  vi.mocked(http).mock.calls.map(([config]) => config as unknown as { url: string; data: unknown }).find((config) => config.url.endsWith("send_to_operations"));

test("with a pending Tráfico file, choosing an existing master sends the file to Operaciones instead of approving again", async () => {
  answerAsQuoteInTraffic();
  const { pricing, screen } = await mountInstructivo();
  screen.id_exp = 5;
  const approve = vi.spyOn(pricing, "aprobarCotizacion");

  await screen.continuarAprobar();

  expect(approve).not.toHaveBeenCalled();
  expect(sentToOperations()!.data).toEqual({ nuevoexpediente: false, id_exp: 5, fecha_validez: null });
});

test("with a pending Tráfico file, creating a new master sends the file to Operaciones with the master's date", async () => {
  answerAsQuoteInTraffic();
  const { pricing, screen } = await mountInstructivo();
  const approve = vi.spyOn(pricing, "aprobarCotizacion");

  await screen.approveQuote({ id_quote: "77", nuevoexpediente: true, id_exp: "", fecha_validez: "2026-12-01" } as AprobacionCotizacion);

  expect(approve).not.toHaveBeenCalled();
  expect(sentToOperations()!.data).toEqual({ nuevoexpediente: true, id_exp: null, fecha_validez: "2026-12-01" });
});

test("printing the instructivo prints each chosen option", async () => {
  const { pricing, screen } = await mountInstructivo();
  pricing.opcionCostos = [option(1, false), option(2, true), option(3, true)];
  const print = vi.spyOn(pricing, "imprimirInstructivoQuote").mockResolvedValue(undefined);

  await screen.imprimir();

  expect(print.mock.calls.map(([data]) => data.nro_propuesta)).toEqual([2, 3]);
});
