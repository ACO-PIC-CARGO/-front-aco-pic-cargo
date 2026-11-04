import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import InstructivoComponent from "@/components/folderAduana/VerComponent/InstructivoComponent.vue";
import { useAduanaStore } from "@/stores/aduana";
import type { AprobacionCotizacion } from "@/types/cotizacion";

vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "31" } }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

interface InstructivoState {
  id_exp: number;
  seleccionQuoteAprobar: boolean;
  continuarAprobar(): Promise<void>;
  approveAduana(details: AprobacionCotizacion): Promise<void>;
}

const pendingTrafficFile = { id_traffic: 6, code_traffic: "TR-00006", id_house: 91, sent: false };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  vi.mocked(http).mockImplementation((async (config: { url: string }) => {
    if (config.url.endsWith("traffic_by_quote")) return { data: { estadoflag: true, data: [pendingTrafficFile] } };
    if (config.url.endsWith("traffic/6/send_to_operations")) {
      return { data: { estadoflag: true, mensaje: "ok", data: [{ code_master: "2026MBL01743", id_master: 2702, id_house: 91 }] } };
    }
    return { data: { estadoflag: false, mensaje: "No se encontraron registros", data: [] } };
  }) as never);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function mountInstructivo() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const aduana = useAduanaStore();
  const wrapper = shallowMount(InstructivoComponent, { global: { plugins: [pinia] } });
  await flushPromises();
  return { aduana, screen: wrapper.vm as unknown as InstructivoState };
}

const sentToOperations = () =>
  vi.mocked(http).mock.calls.map(([config]) => config as unknown as { url: string; data: unknown }).find((config) => config.url.endsWith("send_to_operations"));

test("with a pending Tráfico file, choosing an existing master sends the aduana file to Operaciones instead of approving again", async () => {
  const { aduana, screen } = await mountInstructivo();
  screen.id_exp = 5;
  screen.seleccionQuoteAprobar = true;
  const approve = vi.spyOn(aduana, "aprobarCotizacionAduana");

  await screen.continuarAprobar();

  expect(approve).not.toHaveBeenCalled();
  expect(sentToOperations()!.data).toEqual({ nuevoexpediente: false, id_exp: 5, fecha_validez: null });
  expect(screen.seleccionQuoteAprobar).toBe(false);
});

test("with a pending Tráfico file, creating a new master sends the aduana file to Operaciones with the master's date", async () => {
  const { aduana, screen } = await mountInstructivo();
  const approve = vi.spyOn(aduana, "aprobarCotizacionAduana");

  await screen.approveAduana({ id_quote: "31", nuevoexpediente: true, id_exp: "", fecha_validez: "2026-12-01" } as AprobacionCotizacion);

  expect(approve).not.toHaveBeenCalled();
  expect(sentToOperations()!.data).toEqual({ nuevoexpediente: true, id_exp: null, fecha_validez: "2026-12-01" });
});
