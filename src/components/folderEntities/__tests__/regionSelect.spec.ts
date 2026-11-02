import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import SeccionCliente from "@/components/folderEntities/Cliente/SeccionCliente.vue";
import SeccionProveedor from "@/components/folderEntities/Proveedor/SeccionProveedor.vue";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { estadoflag: true, data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "nuevoClientes", params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const regionShown = async (section: unknown, record: "cliente" | "proveedor") => {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  useEntitiesStore()[record].id_ciudad = 0;
  useAppStore().itemsState = [{ id: 15, name: "LIMA" }] as never;
  const wrapper = mount(section as never, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { VOverlay: true } },
  });
  await flushPromises();
  const region = wrapper.findAll(".v-input").find((input) => input.find("label").text().startsWith("Región"))!;
  const text = region.find(".v-autocomplete__selection-text");
  const shown = text.exists() ? text.text() : "";
  wrapper.unmount();
  return shown;
};

test.each([
  { name: "client", section: SeccionCliente, record: "cliente" as const },
  { name: "provider", section: SeccionProveedor, record: "proveedor" as const },
])("a $name without a region leaves Región empty instead of showing 0", async ({ section, record }) => {
  expect(await regionShown(section, record)).toBe("");
});
