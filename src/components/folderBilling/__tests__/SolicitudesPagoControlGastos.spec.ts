import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import Swal from "sweetalert2";
import SolicitudesPago from "@/components/folderBilling/SolicitudesPagoControlGastos.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
const push = vi.fn();
// mock parcial: el store de bancos (SoportePagoDialog) carga el router de la app
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRouter: () => ({ push }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const base = {
  id_master: 10,
  expediente: "2026-00456",
  id_correlativo: 1,
  correlativo: "0001",
  moneda: "USD",
  codigo_tipopago: "01",
  tipopago: "Transferencia",
  banco: "BCP",
  nrocuenta: "191-8757997-1-23",
  fechasolicitud: "2026-11-06 10:00",
  usuario_solicitud: "qa",
  aprobadoadministracionflag: false,
  aprobadogerenciaflag: false,
  pagadoflag: false,
  conceptos: [],
};
const ROWS = [
  { ...base, id: 1, id_proveedor: 11960, proveedor: "ALFOSAC", monto: 220, codigo_estado: "LISTO", estado: "Listo para transferir" },
  { ...base, id: 2, id_proveedor: 11850, proveedor: "VAN CARGO", monto: 480, codigo_estado: "PENGER", estado: "Pendiente por Gerencia", aprobadoadministracionflag: true, usuario_aprobadoadministracion: "admin.qa", fecha_aprobadoadministracion: "2026-11-12 09:45" },
  { ...base, id: 3, id_proveedor: 11792, proveedor: "PLS ADUANA", monto: 1433.64, codigo_estado: "PENADM", estado: "Pendiente por Administración" },
  { ...base, id: 4, id_proveedor: 40, proveedor: "MSL", monto: 650, codigo_estado: "PAGADO", estado: "Pagado", pagadoflag: true, fechapago: "2026-11-10", soporte_path: "https://example.com/s.pdf" },
  { ...base, id: 5, id_proveedor: 41, proveedor: "TRANSFERIDO SAC", monto: 90, codigo_estado: "PAGADO", estado: "Pagado", pagadoflag: true, fechapago: "2026-11-11", id_pagoegreso: 77, numerooperacion_pago: "OP-123" },
  { ...base, id: 6, id_proveedor: 42, proveedor: "RECHAZO SAC", monto: 15, codigo_estado: "RECHAZADA", estado: "Rechazada", rechazadoflag: true, area_rechazo: "ADM", usuario_rechazo: "adm.rechazo", fecha_rechazo: "2026-11-12 11:00", motivo_rechazo: "Cuenta errada" },
];

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  // Administración la revisa el perfil 04 y Gerencia el 01
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1, position_code: ["01", "04"] }]));
  httpMock.mockImplementation(async () => ({ data: accepted(ROWS) }));
});
afterEach(() => wrapper?.unmount());

async function render(actions: string[]) {
  sessionStorage.setItem(
    "permissions",
    JSON.stringify({
      screens: [
        { route: "listControlGastos", actions },
        { route: "registroPayForProveedor", actions },
      ],
      controlled: ["listControlGastos", "registroPayForProveedor"],
    }),
  );
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(SolicitudesPago, {
    props: { idMaster: 10 },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await flushPromises();
  return wrapper;
}

test("lists the requests with the action that each state needs", async () => {
  const w = await render(["VER", "NUEVO", "MODIFICAR"]);
  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({ url: URL_MAIN + "solicitud_pago_listar", params: { id_master: 10 } }),
  );
  const rows = w.findAll("tbody tr");
  expect(rows).toHaveLength(6);
  const aprobacion = (fila: number) => rows[fila]!.findAll(".solpago__aprob").map((c) => c.text());
  expect(w.find("thead").text()).not.toContain("Acción");
  // LISTO: se sube el soporte desde la columna Soporte; Transferir aparece recién con el soporte
  expect(rows[0]!.find('[title="Subir soporte de pago"]').attributes("disabled")).toBeUndefined();
  expect(rows[0]!.text()).not.toContain("REGISTRAR EN BANCO");
  // el botón de cada área está en su columna y desaparece al aprobar
  // fecha y hora van en dos líneas (<br>), por eso el texto queda junto
  expect(aprobacion(1)).toEqual(["admin.qa12-Nov-202609:45", "Aprobar"]);
  expect(aprobacion(2)).toEqual(["Aprobar", "—"]);
  expect(rows[3]!.text()).toContain("REGISTRAR EN BANCO");
  expect(rows[4]!.text()).toContain("Salida N° OP-123");
  expect(rows[4]!.text()).not.toContain("REGISTRAR EN BANCO");
  expect(aprobacion(5)[0]).toContain("Rechazado");
  expect(aprobacion(5)[0]).toContain("adm.rechazo");
  // monto y moneda en una sola columna
  expect(rows[2]!.find(".solpago__monto").text()).toBe("1,433.64 USD");
  // sin cabecera ni contador: solo la tabla
  expect(w.text()).not.toContain("resultados");
});

test("the web table shows who approved and when", async () => {
  const w = await render(["VER"]);
  const row = w.findAll("tbody tr")[1]!;
  expect(row.text()).toContain("admin.qa");
  expect(row.find(".solpago__aprobfecha").html()).toMatch(/12-Nov-2026<br[^>]*>\s*09:45/);
  expect(w.findAll("tbody tr")[2]!.findAll(".solpago__aprob").map((c) => c.text())).toEqual(["—", "—"]);
});

test("approving sends the approval type and reloads the list", async () => {
  const w = await render(["VER", "MODIFICAR"]);
  const button = w.findAll("tbody tr")[2]!.find(".solpago__revisar");
  await button.trigger("click");
  await flushPromises();
  expect(Swal.fire).toHaveBeenCalled();
  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({ method: "put", url: URL_MAIN + "solicitud_pago_aprobar/3", data: { tipo: "ADM" } }),
  );
});

test("transferring a paid request opens the bank payment with its token", async () => {
  const w = await render(["VER", "NUEVO", "MODIFICAR"]);
  httpMock.mockImplementation(async (config: { url: string }) =>
    ({ data: accepted(config.url.includes("transferir") ? [{ token: "tok-1" }] : ROWS) }));
  await w.findAll("button").find((b) => b.text() === "REGISTRAR EN BANCO")!.trigger("click");
  await flushPromises();
  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({ method: "put", url: URL_MAIN + "solicitud_pago_transferir/4" }),
  );
  expect(push).toHaveBeenCalledWith({ name: "registroPagoSolicitud", params: { token: "tok-1" } });
});

test("rejecting asks for the reason and sends it", async () => {
  const w = await render(["VER", "MODIFICAR"]);
  vi.mocked(Swal.fire)
    .mockResolvedValueOnce({ isConfirmed: false, isDenied: true, isDismissed: false })
    .mockResolvedValueOnce({ isConfirmed: true, isDenied: false, isDismissed: false, value: "Monto errado" });
  await w.findAll("tbody tr")[1]!.find(".solpago__revisar").trigger("click");
  await flushPromises();
  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({ method: "put", url: URL_MAIN + "solicitud_pago_rechazar/2", data: { tipo: "GER", motivo: "Monto errado" } }),
  );
});

test("each area is reviewed by its profile (Administración: 04 o 01, Gerencia: 01)", async () => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1, position_code: ["04"] }]));
  let w = await render(["VER", "MODIFICAR"]);
  let rows = w.findAll("tbody tr");
  // fila 2: pendiente por Administración -> el perfil 04 revisa
  expect(rows[2]!.find(".solpago__revisar").exists()).toBe(true);
  // fila 1: pendiente por Gerencia -> sin perfil 01 no hay botón
  expect(rows[1]!.find(".solpago__revisar").exists()).toBe(false);
  w.unmount();

  // el 01 ve los dos botones
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1, position_code: ["01"] }]));
  w = await render(["VER", "MODIFICAR"]);
  rows = w.findAll("tbody tr");
  expect(rows[2]!.find(".solpago__revisar").exists()).toBe(true);
  expect(rows[1]!.find(".solpago__revisar").exists()).toBe(true);
});

test("without Modificar nobody can approve or transfer", async () => {
  const w = await render(["VER"]);
  expect(w.find(".solpago__revisar").exists()).toBe(false);
  expect(w.text()).not.toContain("REGISTRAR EN BANCO");
});
