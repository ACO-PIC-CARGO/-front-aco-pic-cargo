import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import Swal from "sweetalert2";
import RechazarSolicitudDialog from "@/components/folderBilling/RechazarSolicitudDialog.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

const vuetify = createVuetify({ components, directives });

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1, nombrecompleto: "Dayana Jordan", position_code: ["01"] }]));
  httpMock.mockResolvedValue({ data: accepted([]) });
});

const montar = () =>
  mount(RechazarSolicitudDialog, {
    props: { modelValue: false, solicitud: { id: "SC-000001", area: "ADM" }, tipo: "INGRESO", ruta: "solicitud_cobro_rechazar" },
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });

test("rejects the pending step with the date, the reason and the signed-in user", async () => {
  const w = montar();
  await w.setProps({ modelValue: true });
  await flushPromises();
  expect(document.body.textContent).toContain("RECHAZAR INGRESO");
  expect(document.body.textContent).toContain("Dayana Jordan");

  await w.findComponent({ name: "VTextarea" }).setValue("El monto no cuadra con el voucher.");
  document.querySelectorAll("button").forEach((b) => b.textContent?.includes("Confirmar rechazo") && b.click());
  await flushPromises();

  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({
    method: "put",
    url: URL_MAIN + "solicitud_cobro_rechazar/SC-000001",
    data: { tipo: "ADM", motivo: "El monto no cuadra con el voucher.", fecha: hoy },
  }));
  expect(w.emitted("rechazado")).toHaveLength(1);
  w.unmount();
});

test("the reason is required", async () => {
  const w = montar();
  await w.setProps({ modelValue: true });
  await flushPromises();
  document.querySelectorAll("button").forEach((b) => b.textContent?.includes("Confirmar rechazo") && b.click());
  await flushPromises();
  expect(httpMock).not.toHaveBeenCalled();
  expect(vi.mocked(Swal.fire)).not.toHaveBeenCalled();
  w.unmount();
});
