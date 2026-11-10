import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import DashboardMain from "@/views/dashboard/DashboardMain.vue";
import { usePricingStore } from "@/stores/pricing";
import type { Numerico } from "@/types/cotizacion";

const route = vi.hoisted(() => ({ name: "newQuote", params: {}, fullPath: "/pricing/newQuote" }));
const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({
  useRoute: () => route,
  useRouter: () => ({ push, resolve: () => ({ fullPath: "/pricing/verQuote/77/1" }) }),
}));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: {} }), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
vi.mock("socket.io-client", () => ({ io: () => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() }) }));

interface TopBar {
  guardarCotizacion(): Promise<void>;
  editarCotizacion(): Promise<void>;
}

const REFUSED = "El tiempo de tránsito de la opción 1 debe ser un número entero de días, por ejemplo 15.";
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, esnuevoflag: false }]));
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [], controlled: [] }));
});
afterEach(() => wrapper?.unmount());

async function topBarOn(routeName: string, tiempo_transito: Numerico = 30) {
  route.name = routeName;
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.id = 77;
  pricing.datosPrincipales.id_status = 454;
  pricing.opcionCostos = [
    { nro_propuesta: 1, date_end: "2099-12-31", tiempo_transito, listCostos: [], listImpuestos: [], listNotasQuote: [], selected: true },
  ];
  const folder = vi.spyOn(pricing, "crearCarpetaOneDrive").mockResolvedValue({ url: null, motivo: null });
  wrapper = shallowMount(DashboardMain, { global: { plugins: [pinia], stubs: { RouterView: true } } });
  await flushPromises();
  return { pricing, folder, topBar: wrapper.vm as unknown as TopBar };
}

test("a new quote the server refuses shows why and stays on the page without creating its folder", async () => {
  const { pricing, folder, topBar } = await topBarOn("newQuote");
  vi.spyOn(pricing, "registrarQuote").mockResolvedValue({ estadoflag: false, mensaje: REFUSED, tipomensaje: "TMSGADV", data: [] });

  await topBar.guardarCotizacion();
  await flushPromises();

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: REFUSED }));
  expect(push).not.toHaveBeenCalled();
  expect(folder).not.toHaveBeenCalled();
});

test("a new quote the pre-save check refuses is not sent", async () => {
  const { pricing, topBar } = await topBarOn("newQuote", "2.5");
  const save = vi.spyOn(pricing, "registrarQuote");

  await topBar.guardarCotizacion();

  expect(save).not.toHaveBeenCalled();
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning", text: expect.stringContaining("opción 1") }));
});

test("a saved new quote offers to open it and creates its folder", async () => {
  const { pricing, folder, topBar } = await topBarOn("newQuote");
  vi.spyOn(pricing, "registrarQuote").mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "", data: [] });

  await topBar.guardarCotizacion();
  await flushPromises();

  expect(push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 77 } });
  expect(folder).toHaveBeenCalled();
});

test("an edit the server refuses stays on the edit screen", async () => {
  const { pricing, topBar } = await topBarOn("editQuote");
  vi.spyOn(pricing, "updateQuote").mockResolvedValue(false);

  await topBar.editarCotizacion();

  expect(push).not.toHaveBeenCalled();
});

test("a saved edit opens the quote", async () => {
  const { pricing, topBar } = await topBarOn("editQuote");
  vi.spyOn(pricing, "updateQuote").mockResolvedValue(true);

  await topBar.editarCotizacion();

  expect(push).toHaveBeenCalledWith(expect.objectContaining({ name: "verQuote" }));
});
