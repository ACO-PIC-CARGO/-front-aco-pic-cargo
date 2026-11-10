import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DashboardMain from "@/views/dashboard/DashboardMain.vue";
import { usePricingStore } from "@/stores/pricing";
import { mostrarAvisoVigenciaFlete } from "@/views/dashboard/avisoVigenciaFlete";

const route = vi.hoisted(() => ({ name: "Home", params: {}, fullPath: "/" }));
const push = vi.hoisted(() => vi.fn());
const socketHandlers = vi.hoisted(() => ({
  handlers: {} as Record<string, (data: unknown) => void>,
  disconnect: vi.fn(),
}));
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("socket.io-client", () => ({
  io: () => ({
    on: vi.fn((event: string, handler: (data: unknown) => void) => {
      socketHandlers.handlers[event] = handler;
    }),
    emit: vi.fn(),
    disconnect: socketHandlers.disconnect,
  }),
}));
vi.mock("@/views/dashboard/avisoVigenciaFlete", () => ({ mostrarAvisoVigenciaFlete: vi.fn() }));

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  route.name = "Home";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, position_code: ["01"] }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, esnuevoflag: false, tienefleteactivo: false, dias_restantes: 2, vigencia: "2026-11-08" }]));
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [], controlled: [] }));
});

afterEach(() => wrapper?.unmount());

async function mountDashboard() {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = shallowMount(DashboardMain, { global: { plugins: [pinia], stubs: { RouterView: true } } });
  await flushPromises();
}

test("Actualizar vigencia abre el formulario de fecha", async () => {
  vi.mocked(mostrarAvisoVigenciaFlete).mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false });
  await mountDashboard();
  expect(mostrarAvisoVigenciaFlete).toHaveBeenCalledWith(2, "2026-11-08");
  expect((wrapper!.vm as unknown as { dialogCambiarFecha: boolean }).dialogCambiarFecha).toBe(true);
  expect(push).not.toHaveBeenCalled();
});

test("Configurar flete abre la pantalla de costos", async () => {
  vi.mocked(mostrarAvisoVigenciaFlete).mockResolvedValue({ isConfirmed: false, isDenied: true, isDismissed: false });
  await mountDashboard();
  expect(push).toHaveBeenCalledWith({ name: "ServiciosCostosFijosLCL" });
});

test("Continuar no abre el formulario ni navega", async () => {
  vi.mocked(mostrarAvisoVigenciaFlete).mockResolvedValue({ isConfirmed: false, isDenied: false, isDismissed: true });
  await mountDashboard();
  expect((wrapper!.vm as unknown as { dialogCambiarFecha: boolean }).dialogCambiarFecha).toBe(false);
  expect(push).not.toHaveBeenCalled();
});

test("no muestra el aviso fuera de la página principal", async () => {
  route.name = "newQuote";
  await mountDashboard();
  expect(mostrarAvisoVigenciaFlete).not.toHaveBeenCalled();
});

test("cotizacion-bot pide confirmar la recarga en lstQuote y actualiza el listado al aceptar", async () => {
  route.name = "lstQuote";
  await mountDashboard();
  const store = usePricingStore();
  const reload = vi.spyOn(store, "reloadQuoteList").mockResolvedValue();

  const onCotizacionBot = socketHandlers.handlers["cotizacion-bot"]!;
  onCotizacionBot({
    id_branch: 2,
    nro_cotizacion: "COT-123",
  });
  await flushPromises();

  const vm = wrapper!.vm as unknown as {
    snackbar: boolean;
    dataMensaje: string;
    confirmarRecargaCotizacion: boolean;
    recargarCotizacionesGeneradas: () => Promise<void>;
  };

  expect(vm.snackbar).toBe(false);

  onCotizacionBot({
    id_branch: "1",
    nro_cotizacion: "COT-123",
  });
  await flushPromises();

  expect(vm.snackbar).toBe(true);
  expect(vm.confirmarRecargaCotizacion).toBe(true);
  expect(vm.dataMensaje).toContain("COT-123");

  await vm.recargarCotizacionesGeneradas();

  expect(reload).toHaveBeenCalledOnce();
  expect(vm.snackbar).toBe(false);
});

test("cotizacion-calculadora muestra el aviso con el correlativo en lstQuote", async () => {
  route.name = "lstQuote";
  await mountDashboard();
  const reload = vi.spyOn(usePricingStore(), "reloadQuoteList").mockResolvedValue();

  socketHandlers.handlers["cotizacion-calculadora"]!({
    id_branch: 1,
    nro_cotizacion: "15517-P",
  });
  await flushPromises();

  const vm = wrapper!.vm as unknown as {
    snackbar: boolean;
    tituloMensaje: string;
    dataMensaje: string;
    confirmarRecargaCotizacion: boolean;
    snackbarColor: string | undefined;
  };
  expect(vm.snackbar).toBe(true);
  expect(vm.confirmarRecargaCotizacion).toBe(false);
  expect(vm.snackbarColor).toBe("info");
  expect(vm.tituloMensaje).toBe("Calculadora de Flete");
  expect(vm.dataMensaje).toBe("Se ha generado cotización con 15517-P.");
  expect(reload).not.toHaveBeenCalled();
});

test("nueva-operacion también se presenta con el contenido del snackbar mejorado", async () => {
  await mountDashboard();

  socketHandlers.handlers["nueva-operacion"]!({ mensaje: "Hay una nueva operación." });
  await flushPromises();

  const vm = wrapper!.vm as unknown as {
    snackbar: boolean;
    tituloMensaje: string;
    dataMensaje: string;
    snackbarColor: string;
  };
  expect(vm.snackbar).toBe(true);
  expect(vm.tituloMensaje).toBe("Nueva operación");
  expect(vm.dataMensaje).toBe("Hay una nueva operación.");
  expect(vm.snackbarColor).toBe("operation");
});

test("leaving the layout closes its server connection, so its handlers stop reading a signed-out session", async () => {
  vi.mocked(mostrarAvisoVigenciaFlete).mockResolvedValue({ isConfirmed: false, isDenied: false, isDismissed: true });
  await mountDashboard();

  wrapper!.unmount();
  wrapper = undefined;

  expect(socketHandlers.disconnect).toHaveBeenCalledTimes(1);
});
