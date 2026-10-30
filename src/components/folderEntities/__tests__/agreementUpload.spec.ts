import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VFileInput } from "vuetify/components";
import * as directives from "vuetify/directives";
import ProviderAgreements from "@/components/folderEntities/Proveedor/SeccionConvenios.vue";
import ClientAgreements from "@/components/folderEntities/Cliente/SeccionConvenios.vue";
import { useEntitiesStore } from "@/stores/entities";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { data: [{ insertid: 55 }] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

test.each([
  ["provider", ProviderAgreements],
  ["client", ClientAgreements],
])("a file uploaded on a new %s agreement is attached only to that agreement", async (_, section) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const entities = useEntitiesStore();
  entities.isReadonly = false;
  entities.lstConvenios = [
    { fecha: "2026-10-01", dias_credito: 10, email_soporte: "" },
    { fecha: "2026-10-02", dias_credito: 20, email_soporte: "" },
  ];
  const wrapper = mount(section as never, {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await flushPromises();

  wrapper.findAllComponents(VFileInput)[1]!.vm.$emit("update:modelValue", new File(["pdf"], "convenio.pdf"));
  await flushPromises();

  expect(entities.lstConvenios.map((agreement) => agreement.id_path)).toEqual([undefined, 55]);
  wrapper.unmount();
});
