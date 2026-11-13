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
  id_house: number | string;
  textValidacionPago: string;
  activarBtnContinuar: boolean;
  validarExistePagosHouse(): Promise<void>;
  seleccionQuoteAprobar: boolean;
  continuarAprobar(): Promise<void>;
  approveAduana(details: AprobacionCotizacion): Promise<void>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  vi.mocked(http).mockResolvedValue({ data: { estadoflag: false, mensaje: "No se encontraron registros", data: [] } } as never);
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

test.each([0, ""])("creating a new house (%o) needs no payment check, shows no error and lets the user continue", async (noHouse) => {
  const { screen } = await mountInstructivo();
  screen.id_house = noHouse;

  await screen.validarExistePagosHouse();

  const checks = vi.mocked(http).mock.calls.filter(([config]) => (config as unknown as { url: string }).url.endsWith("validar_existe_pago_house"));
  expect(checks).toHaveLength(0);
  expect(screen.textValidacionPago).toBe("");
  expect(screen.activarBtnContinuar).toBe(false);
});
