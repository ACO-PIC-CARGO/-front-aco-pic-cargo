import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import http from "@/api/http";
import NuevoClienteComponent from "@/components/folderEntities/Cliente/NuevoClienteComponent.vue";
import NuevoProveedorComponent from "@/components/folderEntities/Proveedor/NuevoProveedorComponent.vue";
import SeccionEmailTarifaComponent from "@/components/folderEntities/Proveedor/SeccionEmailTarifaComponent.vue";
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
  vi.mocked(http).mockClear();
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

const previousRateContacts = [{ id: 3, code: "I", contacto: "Luis", email: "luis@anterior.com", telefono: "" }];

test("a new provider starts without the last viewed provider's emails and main flag", async () => {
  const entities = await mountWithStore(
    NuevoProveedorComponent,
    () => {
      useEntitiesStore().lstEmails = [...previousEmails];
      useEntitiesStore().proveedor.proveedorprincipalflag = true;
    },
    {
      SeccionProveedor: true,
      SeccionTelefonos: true,
      SeccionConvenios: true,
      SeccionInformacionBancaria: true,
      SeccionEmailTarifaComponent: true,
    },
  );

  expect(entities.lstEmails).toEqual([]);
  expect(entities.proveedor.proveedorprincipalflag).toBe(false);
});

test("the rate-contact step of a new provider starts empty and loads nothing, even inside a quote", async () => {
  route.params = { id: "77" };
  const pinia = createPinia();
  setActivePinia(pinia);
  Object.assign(useEntitiesStore(), {
    itemsImportacion: [...previousRateContacts],
    itemsExportacion: [{ ...previousRateContacts[0], code: "E" }],
  });

  const wrapper = mount(SeccionEmailTarifaComponent, {
    props: { isNew: true, guardarFlag: false },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await flushPromises();

  expect(useEntitiesStore().itemsImportacion).toEqual([]);
  expect(useEntitiesStore().itemsExportacion).toEqual([]);
  expect(vi.mocked(http)).not.toHaveBeenCalled();
  wrapper.unmount();
});

test("a new client form opens without required-field errors", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const SeccionCliente = (await import("@/components/folderEntities/Cliente/SeccionCliente.vue")).default;
  const wrapper = mount(SeccionCliente, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { VOverlay: true } },
    attachTo: document.body,
  });
  await flushPromises();

  expect(wrapper.findAll(".v-input--error").map((field) => field.find("label").text())).toEqual([]);
  wrapper.unmount();
});
