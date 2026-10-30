import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import NuevoClienteComponent from "@/components/folderEntities/Cliente/NuevoClienteComponent.vue";
import { useEntitiesStore } from "@/stores/entities";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { estadoflag: true, data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
const route = { name: "nuevoClientes", params: {} as Record<string, string> };
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const previousEmails = [{ id: 5, description: "Ventas", email: "ventas@anterior.com", estado: true }];

const mountWithStore = async (form: unknown, prepare: () => void, stubs: Record<string, boolean>) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  prepare();
  const wrapper = mount(form as never, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { VOverlay: true, ...stubs } },
  });
  await flushPromises();
  wrapper.unmount();
  return useEntitiesStore();
};

beforeEach(() => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  route.params = {};
});

test("a new client starts without the emails of the last client viewed", async () => {
  const entities = await mountWithStore(
    NuevoClienteComponent,
    () => {
      useEntitiesStore().lstEmails = [...previousEmails];
    },
    {
      SeccionCliente: true,
      SeccionTelefonos: true,
      SeccionConvenios: true,
      SeccionInformacionBancaria: true,
      SeccionShippers: true,
      SeccionInformacionEntrega: true,
    },
  );

  expect(entities.lstEmails).toEqual([]);
});
