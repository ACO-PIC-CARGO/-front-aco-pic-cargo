import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { expect, test, vi } from "vitest";
import SolicitudesPagoMovil from "../SolicitudesPagoMovil.vue";
import type { SolicitudPagoMovilItem } from "../SolicitudesPagoMovil.vue";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const fila = (id: number, codigo_estado: string, estado: string, extra: Partial<SolicitudPagoMovilItem> = {}): SolicitudPagoMovilItem => ({
  id,
  id_proveedor: 40,
  proveedor: "MSL",
  expediente: "2026MBL01747",
  monto: 100,
  moneda: "USD",
  codigo_estado,
  estado,
  banco: "BCP",
  tipopago: "Transferencia",
  codigo_tipopago: "01",
  nrocuenta: "191-1",
  fechasolicitud: "2026-11-13 10:00",
  usuario_solicitud: "qa",
  fecha_aprobadoadministracion: null,
  fecha_aprobadogerencia: null,
  pagadoflag: false,
  fechapago: null,
  soporte_path: null,
  ...extra,
});

const render = (items: SolicitudPagoMovilItem[]) =>
  mount(SolicitudesPagoMovil, {
    props: { items, puedeAprobar: false, puedeTransferir: false, puedeEditar: true, puedeEliminar: true },
    global: { plugins: [createVuetify({ components, directives })] },
  });

test("groups by state in order, with deleted ones at the very end", () => {
  const w = render([
    fila(1, "ELIMINADA", "Eliminada", { fecha_anulado: "2026-11-13 11:00" }),
    fila(2, "RECHAZADA", "Rechazada"),
    fila(3, "PENADM", "Pendiente por Administración"),
    fila(4, "LISTO", "Listo para transferir"),
  ]);
  const titulos = w.findAll(".mov__grouphead").map((g) => g.text());
  expect(titulos).toEqual([
    expect.stringContaining("Listo para transferir (1)"),
    expect.stringContaining("Pendiente por Administración (1)"),
    expect.stringContaining("Rechazada (1)"),
    expect.stringContaining("Eliminada (1)"),
  ]);
});

test("a card expands on click; a deleted one has no edit or delete", async () => {
  const w = render([fila(4, "LISTO", "Listo para transferir"), fila(1, "ELIMINADA", "Eliminada", { fecha_anulado: "2026-11-13 11:00" })]);
  const [abierta, eliminada] = w.findAll(".mov__card");
  await abierta!.find(".mov__cardhead").trigger("click");
  expect(abierta!.text()).toContain("191-1");
  expect(abierta!.text()).toContain("Editar");
  expect(eliminada!.text()).not.toContain("Editar");
  expect(eliminada!.text()).not.toContain("Eliminar");
  expect(eliminada!.text()).toContain("Ver solicitud");
});

test("paid requests already registered in Bancos go below the ones still to register", () => {
  const w = render([
    fila(7, "PAGADO", "Pagado", { pagadoflag: true, id_pagoegreso: 7088, numerooperacion_pago: "OP-1", proveedor: "CON SALIDA" }),
    fila(8, "PAGADO", "Pagado", { pagadoflag: true, proveedor: "SIN SALIDA" }),
  ]);
  expect(w.findAll(".mov__provname").map((n) => n.text())).toEqual(["SIN SALIDA (40)", "CON SALIDA (40)"]);
});

test("a closed card shows the bank exit number as a chip once it is registered", () => {
  const w = render([fila(7, "PAGADO", "Pagado", { pagadoflag: true, id_pagoegreso: 7088, numerooperacion_pago: "OP-77" })]);
  expect(w.find(".mov__chip--salida").text()).toContain("Salida N° OP-77");
});
