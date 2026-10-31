import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import CustomAutocomplete from "@/components/folderEntities/CustomAutocomplete.vue";
import SeccionCliente from "@/components/folderEntities/Cliente/SeccionCliente.vue";
import SeccionProveedor from "@/components/folderEntities/Proveedor/SeccionProveedor.vue";
import { useEntitiesStore } from "@/stores/entities";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  httpMock.mockResolvedValue({ data: accepted([]) });
});
afterEach(() => vi.useRealTimers());

const searchesTo = (path: string) =>
  httpMock.mock.calls.filter(([config]) => config.url.slice(URL_MAIN.length).startsWith(path)).map(([config]) => config.params);

test.each([
  ["the client form", SeccionCliente, "Nro De Documento", "validar_documento_cliente", { id_tipodocumento: "", nro_documento: "20451" }],
  ["the provider form", SeccionProveedor, "Nro De Documento", "validar_documento_proveedor", { id_tipodocumento: "", nro_documento: "20451" }],
  ["the provider form", SeccionProveedor, "Nombre Comercial o Razón Social", "validar_nombre_proveedor", { nombre: "20451" }],
])("typing quickly in %s > %s checks once, for the final text", async (_, section, label, path, params) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(section, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { VOverlay: true } },
  });
  await flushPromises();
  vi.useFakeTimers();
  const field = wrapper.findAllComponents(CustomAutocomplete).find((input) => input.props("label") === label)!;

  for (const text of ["2", "20", "204", "2045", "20451"]) {
    field.vm.$emit("search", text);
    vi.advanceTimersByTime(100);
  }
  expect(searchesTo(path)).toEqual([]);
  await vi.advanceTimersByTimeAsync(300);

  expect(searchesTo(path)).toEqual([params]);
  expect(useEntitiesStore().lstProveedores_x_documento).toEqual([]);
  wrapper.unmount();
});
