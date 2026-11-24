import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { beforeEach, expect, test, vi } from "vitest";
import ExpedienteVarios from "../ExpedienteVarios.vue";

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock("@/utils/request", () => ({ CONNECTION_ERROR_MESSAGE: "error", request: requestMock }));
vi.mock("@/utils/sesion", async (importOriginal) => ({ ...(await importOriginal<object>()), sessionBranchId: () => 1 }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const vuetify = createVuetify({ components, directives });
const fila = (expediente: string, cliente_pago: string, pr: number, op: number) => ({
  proveedor: "HYDE (GUANGZHOU)", fechasolicitud: "2026-11-23", moneda: "USD", monto_solicitud: 28550,
  id_master: 1, expediente, correlativo: "0001", cliente: "PIC CARGO SAC", cliente_pago,
  monto_pricing: pr, monto_operaciones: op, ganancia: pr - op,
});

beforeEach(() => {
  document.body.innerHTML = "";
  requestMock.mockReset().mockResolvedValue({
    estadoflag: true,
    data: [fila("2026MBL01647", "SI", 9500, 9200), fila("2026MBL01658", "NO", 7800, 7680)],
  });
});

const montar = (solicitud: Record<string, unknown>) =>
  mount(ExpedienteVarios, {
    props: { tipo: "pago" as const, solicitud },
    slots: { default: "<span class='original'>EXP-UNO</span>" },
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });

test("una solicitud con un solo expediente muestra el expediente de siempre", () => {
  const w = montar({ id: 7, expediente: "2026MBL01647", multiexpedienteflag: true });
  expect(w.text()).toContain("EXP-UNO");
  expect(w.text()).not.toContain("Varios");
  w.unmount();
});

test("con varios expedientes muestra Varios y Ver Detalle abre los expedientes asociados", async () => {
  const w = montar({ id: 42, expediente: "2026MBL01647, 2026MBL01658", multiexpedienteflag: true });
  expect(w.text()).toContain("Varios");
  expect(w.text()).not.toContain("EXP-UNO");
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Ver Detalle"))!.click();
  await flushPromises();
  expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({ url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_detalle_expedientes/42" }));
  const texto = document.body.textContent ?? "";
  expect(texto).toContain("Expedientes Asociados");
  expect(texto).toContain("HYDE (GUANGZHOU)");
  expect(texto).toContain("Totales del Expediente (2)");
  expect(texto).toContain("17,300.00 USD"); // pricing
  expect(texto).toContain("420.00 USD"); // ganancia total
  w.unmount();
});

test("un expediente con varios clientes dice Cliente Varios y Ver Expediente abre su Control de Gastos", async () => {
  requestMock.mockResolvedValue({
    estadoflag: true,
    data: [
      { ...fila("2026MBL01436", "NO", 100, 90), id_master: 1436, cliente: "ALFREDO, DAIVITS", clientes_cantidad: 2 },
      { ...fila("2026MBL01647", "SI", 9500, 9200), clientes_cantidad: 1 },
    ],
  });
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  const w = montar({ id: 42, expediente: "2026MBL01436, 2026MBL01647", multiexpedienteflag: true });
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Ver Detalle"))!.click();
  await flushPromises();
  const texto = document.body.textContent ?? "";
  expect(texto).toContain("Cliente Varios");
  expect(texto).toContain("PIC CARGO SAC");
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Ver Expediente"))!.click();
  expect(open).toHaveBeenCalledWith("/home/folderBilling/editControlGastos/view/1436/1", "Instructivo", "width=1593,height=1293");
  open.mockRestore();
  w.unmount();
});
