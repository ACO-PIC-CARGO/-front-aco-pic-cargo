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
];

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  httpMock.mockImplementation(async () => ({ data: accepted(ROWS) }));
});
afterEach(() => wrapper?.unmount());

async function render(actions: string[]) {
  sessionStorage.setItem(
    "permissions",
    JSON.stringify({ screens: [{ route: "listControlGastos", actions }], controlled: ["listControlGastos"] }),
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
  expect(rows).toHaveLength(4);
  expect(rows[0]!.text()).toContain("Transferir");
  expect(rows[1]!.text()).toContain("Aprobar Gerencia");
  expect(rows[2]!.text()).toContain("Aprobar Administración");
  expect(rows[3]!.find(".mdi-check-decagram").exists()).toBe(true);
  expect(w.text()).toContain("4 resultados");
});

test("the web table shows who approved and when", async () => {
  const w = await render(["VER"]);
  const row = w.findAll("tbody tr")[1]!;
  expect(row.text()).toContain("admin.qa");
  expect(row.text()).toContain("12-Nov-2026 09:45");
  expect(w.findAll("tbody tr")[2]!.findAll(".solpago__aprob").map((c) => c.text())).toEqual(["—", "—"]);
});

test("approving sends the approval type and reloads the list", async () => {
  const w = await render(["VER", "MODIFICAR"]);
  const button = w.findAll("button").find((b) => b.text() === "Aprobar Administración")!;
  await button.trigger("click");
  await flushPromises();
  expect(Swal.fire).toHaveBeenCalled();
  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({ method: "put", url: URL_MAIN + "solicitud_pago_aprobar/3", data: { tipo: "ADM" } }),
  );
});

test("without Modificar nobody can approve or transfer", async () => {
  const w = await render(["VER"]);
  expect(w.text()).not.toContain("Aprobar Administración");
  expect(w.text()).not.toContain("Aprobar Gerencia");
  expect(w.text()).not.toContain("Transferir");
});
