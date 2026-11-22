import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import SolicitudAmarradaChip from "@/components/folderRequests/SolicitudAmarradaChip.vue";
import type { ExpedienteSolicitudReporte } from "@/types/solicitudReporte";

const vuetify = createVuetify({ components });
const sol = (multiexpedienteflag: boolean) => ({
  id_master: 1, expediente: "EXP-1", nro_master: null, id_correlativo: 1, correlativo: "0001", id_coins: 1, moneda: "USD",
  monto: 100, fecha_disponibilidad: null, id_solicitud: 9, codigo_solicitud: "SP-000009", codigo_estado: "PENADM",
  estado: "Pendiente por Administración", multiexpedienteflag,
}) as ExpedienteSolicitudReporte;

const montar = (multi: boolean, tipo: "pago" | "cobro") =>
  mount(SolicitudAmarradaChip, { props: { solicitud: sol(multi), tipo }, global: { plugins: [vuetify] } });

test("a request made from Control de Gastos shows where to review it", () => {
  expect(montar(false, "pago").text()).toContain("Solicitada por Control de Gastos");
  expect(montar(false, "pago").text()).toContain("Revisar Solicitudes de Pago Pendiente");
  expect(montar(false, "cobro").text()).toContain("Revisar Solicitudes de Cobro Pendiente");
});

test("a request made from the report itself has no note", () => {
  expect(montar(true, "pago").text()).not.toContain("Solicitada por");
});
