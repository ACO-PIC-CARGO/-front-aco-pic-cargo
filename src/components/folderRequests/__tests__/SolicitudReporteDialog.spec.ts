import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { beforeEach, expect, test, vi } from "vitest";
import SolicitudReporteDialog from "../SolicitudReporteDialog.vue";

const { httpMock, requestMock, swalMock } = vi.hoisted(() => ({ httpMock: vi.fn(), requestMock: vi.fn(), swalMock: vi.fn() }));
vi.mock("@/api/http", () => ({ default: httpMock }));
vi.mock("@/utils/request", () => ({
  CONNECTION_ERROR_MESSAGE: "error",
  notifySuccess: vi.fn(),
  request: requestMock,
}));
vi.mock("@/utils/sesion", async (importOriginal) => ({ ...(await importOriginal<object>()), sessionBranchId: () => 1 }));
vi.mock("sweetalert2", () => ({ default: { fire: swalMock } }));

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const expediente = (id_master: number, monto: number, extra: Record<string, unknown> = {}) => ({
  id_master,
  id_proveedor: 464,
  expediente: `EXP-${id_master}`,
  nro_master: String(id_master),
  id_correlativo: 1,
  correlativo: "0001",
  id_coins: 1,
  moneda: "USD",
  monto,
  fecha_disponibilidad: "2026-11-01",
  id_solicitud: null,
  codigo_solicitud: null,
  codigo_estado: null,
  estado: null,
  multiexpedienteflag: false,
  ...extra,
});
const expedientes = [
  expediente(273, 445.3),
  expediente(460, 448.84),
  expediente(493, 100, { moneda: "PEN", id_coins: 2 }),
  expediente(500, 50, { id_solicitud: 44, codigo_solicitud: "N° 44", codigo_estado: "PENADM", estado: "Pendiente por Administración" }),
];

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const vuetify = createVuetify({ components, directives });
const render = () =>
  mount(SolicitudReporteDialog, {
    props: { modelValue: false, tipo: "pago" as const, entidad: { id: 464, nombre: "PROVEEDOR QA" } },
    global: { plugins: [vuetify, createPinia()] },
    attachTo: document.body,
  });

beforeEach(() => {
  document.body.innerHTML = "";
  swalMock.mockReset().mockResolvedValue({ isConfirmed: true });
  httpMock.mockReset().mockResolvedValue({ data: { data: [{ id: 68, namebanks: "BCP", namecoins: "USD", accountnumber: "191-1", symbol: "USD" }] } });
  requestMock.mockReset().mockImplementation(({ url }: { url: string }) => {
    if (url.endsWith("cargar_master_detalle_tipo_pago_solicitud")) {
      return Promise.resolve({ estadoflag: true, data: [{ id: 2131, codigo: "01", descripcion: "Transferencia" }, { id: 2132, codigo: "02", descripcion: "Código de pago" }] });
    }
    if (url.endsWith("solicitud_pago_reporte_expedientes")) return Promise.resolve({ estadoflag: true, data: expedientes });
    return Promise.resolve({ estadoflag: true, mensaje: "Solicitud de pago N° 45 registrada con 2 expediente(s).", tipomensaje: "TMSGINF", data: [] });
  });
});

test("paso 1 con la cuenta del proveedor, paso 2 totaliza y envía una sola solicitud con los expedientes", async () => {
  const w = render();
  await w.setProps({ modelValue: true });
  await flushPromises();
  const body = () => document.body;

  // paso 1: transferencia con la única cuenta del proveedor ya elegida -> Siguiente habilitado
  expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
    url: URL_MAIN + "solicitud_pago_reporte_expedientes",
    params: { id_proveedor: 464 },
  }));
  const siguiente = [...body().querySelectorAll("button")].find((b) => b.textContent?.includes("SIGUIENTE"))!;
  expect(siguiente.disabled).toBe(false);
  siguiente.click();
  await flushPromises();

  // paso 2: el amarrado se pinta con su solicitud y el de otra moneda queda bloqueado
  expect(body().textContent).toContain("N° 44");
  const filas = [...body().querySelectorAll(".solrep__fila:not(.solrep__fila--head)")] as HTMLElement[];
  expect(filas).toHaveLength(4);
  expect(filas[2]!.classList.contains("solrep__fila--bloq")).toBe(true);
  expect(filas[3]!.classList.contains("solrep__fila--amarrado")).toBe(true);

  filas[0]!.click();
  filas[1]!.click();
  filas[2]!.click(); // PEN: no se puede con una cuenta en USD
  filas[3]!.click(); // ya amarrado
  await flushPromises();
  expect(body().querySelector(".solrep__total")!.textContent).toContain("USD 894.14");

  const enviar = [...body().querySelectorAll("button")].find((b) => b.textContent?.includes("ENVIAR SOLICITUD"))!;
  enviar.click();
  await flushPromises();

  expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
    method: "post",
    url: URL_MAIN + "solicitud_pago_reporte_insertar",
    data: expect.objectContaining({
      id_proveedor: 464,
      id_tipopago: 2131,
      id_cuenta: 68,
      codigopago: null,
      expedientes: [{ id_master: 273, id_correlativo: 1 }, { id_master: 460, id_correlativo: 1 }],
    }),
  }));
  expect(w.emitted("guardado")).toHaveLength(1);
  const cierres = w.emitted("update:modelValue") ?? [];
  expect(cierres[cierres.length - 1]).toEqual([false]);
});

test("ver una solicitud del reporte: sin pasos, sus datos y solo sus expedientes", async () => {
  requestMock.mockImplementation(({ url }: { url: string }) => {
    if (url.endsWith("cargar_master_detalle_tipo_pago_solicitud")) {
      return Promise.resolve({ estadoflag: true, data: [{ id: 2131, codigo: "01", descripcion: "Transferencia" }] });
    }
    if (url.endsWith("solicitud_pago_reporte_expedientes")) return Promise.resolve({ estadoflag: true, data: expedientes });
    if (url.endsWith("solicitud_pago_ver/44")) {
      return Promise.resolve({ estadoflag: true, data: [{ id: 44, codigo_tipopago: "01", nrocuenta: "191-1", comentario: "del reporte" }] });
    }
    return Promise.resolve({ estadoflag: false, data: [] });
  });
  const w = mount(SolicitudReporteDialog, {
    props: { modelValue: false, tipo: "pago" as const, entidad: { id: 464, nombre: "PROVEEDOR QA" }, solicitud: { id: 44 } },
    global: { plugins: [vuetify, createPinia()] },
    attachTo: document.body,
  });
  await w.setProps({ modelValue: true });
  await flushPromises();
  const texto = document.body.textContent ?? "";
  expect(document.querySelector(".solrep__steps")).toBeNull();
  expect(texto).not.toContain("Paso");
  expect(texto).toContain("EXP-500");
  expect(texto).not.toContain("EXP-273");
  expect(texto).not.toContain("ENVIAR SOLICITUD");
  expect((document.querySelector("#solrep-obs") as HTMLTextAreaElement | null)?.value).toBe("del reporte");
  w.unmount();
});

test("editar una solicitud del reporte guarda los datos del paso 1 con la autorización del administrador", async () => {
  requestMock.mockImplementation(({ url }: { url: string }) => {
    if (url.endsWith("cargar_master_detalle_tipo_pago_solicitud")) {
      return Promise.resolve({ estadoflag: true, data: [{ id: 2131, codigo: "01", descripcion: "Transferencia" }] });
    }
    if (url.endsWith("solicitud_pago_reporte_expedientes")) return Promise.resolve({ estadoflag: true, data: expedientes });
    if (url.endsWith("solicitud_pago_ver/44")) {
      return Promise.resolve({ estadoflag: true, data: [{ id: 44, codigo_tipopago: "01", nrocuenta: "191-1", comentario: "" }] });
    }
    return Promise.resolve({ estadoflag: true, mensaje: "ok", data: [] });
  });
  const autorizacion = { usuario: "admin", clave: "x" };
  const w = mount(SolicitudReporteDialog, {
    props: { modelValue: false, tipo: "pago" as const, entidad: { id: 464, nombre: "PROVEEDOR QA" }, solicitud: { id: 44 }, modo: "editar" as const, autorizacion },
    global: { plugins: [vuetify, createPinia()] },
    attachTo: document.body,
  });
  await w.setProps({ modelValue: true });
  await flushPromises();
  const guardar = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("GUARDAR CAMBIOS"))!;
  expect(guardar.disabled).toBe(false);
  guardar.click();
  await flushPromises();
  expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
    method: "put",
    url: URL_MAIN + "solicitud_pago_reporte_editar/44",
    data: expect.objectContaining({ id_tipopago: 2131, id_cuenta: 68, autorizacion }),
  }));
  w.unmount();
});
