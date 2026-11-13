import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { beforeEach, expect, test, vi } from "vitest";
import SolicitudesPagoBandeja from "../SolicitudesPagoBandejaComponent.vue";

const { httpMock, requestMock } = vi.hoisted(() => ({ httpMock: vi.fn(), requestMock: vi.fn() }));
vi.mock("@/api/http", () => ({ default: { get: httpMock } }));
vi.mock("@/utils/request", () => ({
  CONNECTION_ERROR_MESSAGE: "error",
  hasFailed: (r: { estadoflag: boolean; tipomensaje: string }) => !r.estadoflag && r.tipomensaje !== "TMSGINF",
  request: requestMock,
}));
vi.mock("@/composables/usePermissions", () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const fila = {
  total: 12,
  id: 7,
  fechasolicitud: "2026-11-06 10:00",
  id_master: 1,
  expediente: "EXP-00456",
  id_proveedor: 11960,
  proveedor: "ALFOSAC",
  correlativo: "0001",
  monto: 220,
  moneda: "USD",
  codigo_tipopago: "02",
  tipopago: "Código de Pago",
  banco: "BCP",
  nrocuenta: "191-1",
  codigopago: "1234567890",
  codigo_estado: "RECHAZADA",
  estado: "Rechazada",
  area_rechazo: "ADM",
  usuario_rechazo: "adm.qa",
  fecha_rechazo: "2026-11-07 09:00",
  motivo_rechazo: "Cuenta errada",
  soporte_path: null,
};

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const vuetify = createVuetify({ components, directives });
const render = (tab: "PEN" | "REC" | "HIS") =>
  mount(SolicitudesPagoBandeja, {
    props: { tab, opciones: [{ tipo: "PROV", valor: "11960", titulo: "ALFOSAC (11960)" }] },
    // el panel de filtros necesita el layout de la app
    global: { plugins: [vuetify, createPinia()], stubs: { VNavigationDrawer: true } },
    attachTo: document.body,
  });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  requestMock.mockReset().mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "", data: [fila] });
  httpMock.mockReset();
});

test("loads the first page of its tab and shows the rejection columns", async () => {
  const w = render("REC");
  await flushPromises();
  expect(requestMock).toHaveBeenCalledWith(
    expect.objectContaining({
      url: URL_MAIN + "solicitud_pago_bandeja",
      params: expect.objectContaining({ tab: "REC", page: 1, limit: 10 }),
    }),
  );
  expect(w.text()).toContain("12 resultados");
  // el rechazo se ve en la columna del área que rechazó (Administración)
  expect(w.find(".spb__rechazotag").text()).toBe("Rechazado");
  expect(w.text()).toContain("adm.qa");
  expect(w.text()).toContain("Cuenta errada");
  // código de pago: se muestra el código, no la cuenta
  expect(w.text()).toContain("1234567890");
  expect(w.text()).not.toContain("Fecha de pago");
  expect(w.emitted("total")![0]).toEqual([12]);
  w.unmount();
});

test("search is debounced and goes back to page 1", async () => {
  const w = render("HIS");
  await flushPromises();
  requestMock.mockClear();
  await w.find("input[type='text']").setValue("alf");
  await w.find("input[type='text']").setValue("alfo");
  expect(requestMock).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(450);
  await flushPromises();
  expect(requestMock).toHaveBeenCalledTimes(1);
  expect(requestMock.mock.calls[0]![0].params).toMatchObject({ tab: "HIS", search: "alfo", page: 1 });
  w.unmount();
});

test("an empty list is not an error", async () => {
  requestMock.mockResolvedValue({ estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [] });
  const w = render("PEN");
  await flushPromises();
  expect(w.text()).toContain("0 resultados");
  expect(w.text()).toContain("No hay solicitudes de pago.");
  w.unmount();
});

test("approve buttons follow the profile: 04 Administración, 01 Gerencia", async () => {
  const pendientes = [
    { ...fila, id: 1, codigo_estado: "PENADM", estado: "Pendiente por Administración", area_rechazo: null, usuario_rechazo: null },
    { ...fila, id: 2, codigo_estado: "PENGER", estado: "Pendiente por Gerencia", area_rechazo: null, usuario_rechazo: null,
      usuario_aprobadoadministracion: "adm.qa", fecha_aprobadoadministracion: "2026-11-12 09:00" },
    { ...fila, id: 3, codigo_estado: "LISTO", estado: "Listo para transferir", area_rechazo: null, usuario_rechazo: null },
  ];
  requestMock.mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "", data: pendientes });

  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1, position_code: ["01"] }]));
  let w = render("PEN");
  await flushPromises();
  let rows = w.findAll("tbody tr");
  expect(rows[0]!.find(".spb__revisar").exists()).toBe(false); // sin 04 no aprueba Administración
  expect(rows[1]!.find(".spb__revisar").exists()).toBe(true); // 01 aprueba Gerencia
  expect(rows[1]!.text()).toContain("adm.qa");
  // LISTO: se habilita subir el soporte
  expect(rows[2]!.find('[title="Subir soporte de pago"]').attributes("disabled")).toBeUndefined();
  expect(rows[0]!.find('[title="Subir soporte de pago"]').attributes("disabled")).toBeDefined();
  w.unmount();

  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1, position_code: ["04"] }]));
  w = render("PEN");
  await flushPromises();
  rows = w.findAll("tbody tr");
  expect(rows[0]!.find(".spb__revisar").exists()).toBe(true);
  expect(rows[1]!.find(".spb__revisar").exists()).toBe(false);
  w.unmount();
});
