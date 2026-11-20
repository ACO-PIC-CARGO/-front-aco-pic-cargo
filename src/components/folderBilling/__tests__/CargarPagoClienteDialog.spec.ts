import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import CargarPagoClienteDialog from "@/components/folderBilling/CargarPagoClienteDialog.vue";
import { useBancosStore } from "@/stores/bancos";
import { useAppStore } from "@/stores/app";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";
import type { SolicitudCobro } from "@/types/solicitudCobro";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

const vuetify = createVuetify({ components, directives });
const destino = { id_house: 5, id_correlativo: 1, cliente: "PLASMAME LIMA (11460)", correlativo: "0001", deuda: 1666.58 };
const soporte = (codigo: string, monto: number) => ({
  codigo, monto, id_cuentabancaria: 1, cuenta: "BCP", banco: "BCP", nrocuenta: "1", id_banco_origen: 2, banco_origen: "BCP",
  fechadeposito: "2026-11-17", numerooperacion: "OP", id_path_voucher: 9, voucher_path: "x", voucher_nombre: "v.jpg",
  comentario: null, usuario_registro: null, fecha_registro: null, id_pagoingreso: null, numerooperacion_ingreso: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  useBancosStore().cuentas = [{ id: 1, label: "USD - BCP", cuenta: "1", cci: "", symbol: "USD" }];
  useAppStore().itemsDataBanksList = [{ id: 2, acronym: "BCP" }] as never;
  httpMock.mockResolvedValue({ data: accepted([]) });
});

async function abrir(props: Record<string, unknown>) {
  const w = mount(CargarPagoClienteDialog, {
    props: { modelValue: false, destino, ...props },
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });
  await w.setProps({ modelValue: true });
  await flushPromises();
  return w;
}
const boton = (texto: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(texto))!;

test("a new payment starts with an empty amount and a partial one can be sent", async () => {
  const solicitud = { codigo: "SC-000001", monto: 1666.58, moneda: "USD", enviadoflag: false, soportes: [soporte("SCS-000001", 1000)] } as unknown as SolicitudCobro;
  const w = await abrir({ solicitud });
  // el voucher es obligatorio desde que se abre el formulario
  expect(document.querySelector(".pagocli__drop--error")).not.toBeNull();
  // nuevo pago: el monto no se llena solo
  expect((document.querySelector("#pagocli-monto") as HTMLInputElement).value).toBe("");

  await w.findComponent({ name: "VTextField" }).setValue("500");
  await flushPromises();
  expect(document.body.textContent).toContain("SALDO PENDIENTE");
  expect(document.body.textContent).toContain("USD 166.58");
  // pago parcial: se puede enviar (el voucher aún falta, por eso sigue desactivado aquí)
  expect(boton("GUARDAR Y ENVIAR").title).toContain("pago parcial");

  // cobro: puede pasar el saldo; no es error, se muestra el excedente en verde
  await w.findComponent({ name: "VTextField" }).setValue("700");
  await flushPromises();
  expect(document.body.textContent).not.toContain("No puede ser mayor");
  expect(document.body.textContent).toContain("EXCEDENTE");
  expect(document.body.textContent).toContain("USD 33.42");
  expect(document.querySelector(".pagocli__saldo--ok")).not.toBeNull();
  expect(document.querySelector(".pagocli__monto--excede")).not.toBeNull();
  w.unmount();
});

test("editing a payment sends its code, the amount and enviar=false with Guardar", async () => {
  const solicitud = { codigo: "SC-000001", monto: 1666.58, moneda: "USD", enviadoflag: false, soportes: [soporte("SCS-000001", 1000), soporte("SCS-000002", 300)] } as unknown as SolicitudCobro;
  const w = await abrir({ solicitud, soporte: soporte("SCS-000002", 300) });
  boton("GUARDAR").click();
  await flushPromises();
  expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({
    method: "post",
    data: expect.objectContaining({ id_house: 5, codigo_soporte: "SCS-000002", monto: 300, enviar: false, id_path: 9 }),
  }));
  w.unmount();
});

test("only offers the company accounts in the currency of the correlativo", async () => {
  useBancosStore().cuentas = [
    { id: 1, label: "USD - BCP", cuenta: "1", cci: "", symbol: "USD", id_coins: 1 },
    { id: 2, label: "PEN - BCP", cuenta: "2", cci: "", symbol: "S/", id_coins: 2 },
  ];
  const w = await abrir({ destino: { ...destino, id_coins: 1 } });
  const cuentas = w.findAllComponents({ name: "VAutocomplete" })[0]!;
  expect((cuentas.props("items") as { id: number }[]).map((c) => c.id)).toEqual([1]);
  w.unmount();
});

test("a new payment only offers the company's main account", async () => {
  useBancosStore().cuentas = [
    { id: 1, label: "USD - BCP", cuenta: "1", cci: "", symbol: "USD", id_coins: 1 },
    { id: 3, label: "USD - BBVA (principal)", cuenta: "3", cci: "", symbol: "USD", id_coins: 1, esprincipalflag: true },
  ];
  const w = await abrir({ destino: { ...destino, id_coins: 1 } });
  const combo = w.findAllComponents({ name: "VAutocomplete" })[0]!;
  expect((combo.props("items") as { id: number }[]).map((c) => c.id)).toEqual([3]);
  expect(combo.props("modelValue")).toBe(3);
  w.unmount();
});

test("N° de operación 'No aplica' is not required and is sent empty", async () => {
  const w = await abrir({ soporte: { ...soporte("SCS-000009", 300), numerooperacion: null }, solicitud: { codigo: "SC-1", monto: 1666.58, moneda: "USD", enviadoflag: false, soportes: [soporte("SCS-000009", 300)] } });
  // sin número guardado abre en "No aplica"
  expect(w.findAllComponents({ name: "VSelect" }).find((c) => c.attributes("aria-label") === "¿Aplica N° de operación?" || c.props("items")?.length === 2)!.props("modelValue")).toBe(false);
  boton("GUARDAR").click();
  await flushPromises();
  expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ numerooperacion: null, aplica_nrooperacion: false }),
  }));
  w.unmount();
});
