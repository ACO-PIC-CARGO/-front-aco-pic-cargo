import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import Swal from "sweetalert2";
import SeccionEmailTarifaComponent from "@/components/folderEntities/Proveedor/SeccionEmailTarifaComponent.vue";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { accepted, rejected, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "editarProveedor", params: { id: "64" } }) }));
vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }), showLoading: vi.fn(), close: vi.fn() },
}));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const saveRateContacts = async (answer: unknown) => {
  respond({ "entitie/cargar_datos_tarifas": accepted([{ datos: [] }]), "entitie/guardar_datos_tarifas": answer });
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(SeccionEmailTarifaComponent, {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await flushPromises();
  vi.mocked(Swal.fire).mockClear();

  await wrapper.findAll("button").find((button) => button.text() === "Guardar contactos")!.trigger("click");
  await flushPromises();
  wrapper.unmount();
};

test("a saved list of rate contacts keeps its confirmation on screen", async () => {
  await saveRateContacts(accepted([]));

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
  expect(Swal.close).not.toHaveBeenCalled();
});

test.each([
  ["the reason the server gives", { ...rejected("No pudimos guardar los contactos para pedir tarifa."), tipomensaje: "TMSGERR" }, "No pudimos guardar los contactos para pedir tarifa."],
  ["the connection message when there is no answer", new Error("network"), CONNECTION_ERROR_MESSAGE],
])("a failed save shows %s", async (_, answer, message) => {
  await saveRateContacts(answer);

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: message }));
});
