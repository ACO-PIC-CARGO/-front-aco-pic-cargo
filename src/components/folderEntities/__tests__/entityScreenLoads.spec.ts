import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import VerClienteComponent from "@/components/folderEntities/Cliente/VerClienteComponent.vue";
import EditarClienteComponent from "@/components/folderEntities/Cliente/EditarClienteComponent.vue";
import SeccionCliente from "@/components/folderEntities/Cliente/SeccionCliente.vue";
import SeccionProveedor from "@/components/folderEntities/Proveedor/SeccionProveedor.vue";
import { httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";
import type { HttpConfig } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: { id: "656" } } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "656" } }), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const CLIENT = {
  id: 656,
  id_pais: 139,
  correlativo: "656",
  lsttelefonos: [],
  lstcontactos: [],
  lstconvenios: [],
  lsttarifas: [],
  lstcuentas: [],
  lstshippers: [],
  lstemails: [],
  informacionentrega: [{ id_departamento: 15, id_provincia: 1501 }],
};
const SECTIONS = {
  SeccionCliente: true,
  SeccionTelefonos: true,
  SeccionConvenios: true,
  SeccionInformacionBancaria: true,
  SeccionShippers: true,
  SeccionInformacionEntrega: true,
};

const pathOf = (config: HttpConfig) => config.url.slice(URL_MAIN.length).split("?")[0]!;
const requested = () => httpMock.mock.calls.map(([config]) => pathOf(config));
let answers: (() => void)[] = [];

const mountWith = (component: unknown, stubs: Record<string, boolean> = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(component as never, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { VOverlay: true, ...stubs } },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  answers = [];
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id_pais: 139 }]));
  httpMock.mockImplementation(
    (config) =>
      new Promise((resolve) => {
        const data = pathOf(config) === "ver_cliente" ? [CLIENT] : [];
        answers.push(() => resolve({ data: { estadoflag: true, token: "tok", data } }));
      }),
  );
});

const answerAll = async () => {
  while (answers.length) {
    answers.splice(0).forEach((answer) => answer());
    await flushPromises();
  }
};

test("opening Ver Cliente asks for every catalog and the client at once, each one time", async () => {
  const wrapper = mountWith(VerClienteComponent, SECTIONS);
  await flushPromises();

  const beforeAnyAnswer = requested();
  expect(beforeAnyAnswer).toContain("ver_cliente");
  expect(beforeAnyAnswer).toHaveLength(12);

  await answerAll();
  const all = requested();
  expect(new Set(all).size).toBe(all.length);
  expect(all).toHaveLength(15);
  wrapper.unmount();
});

test("Ver Cliente shows its five tabs, with phones and contacts joined to the client's data", async () => {
  const wrapper = mountWith(VerClienteComponent, SECTIONS);
  await answerAll();

  expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual([
    "Datos y Contactos",
    "Convenios y Tarifas",
    "Información Bancaria",
    "Shipper",
    "Destinatario",
  ]);
  expect(wrapper.find('[aria-selected="true"]').text()).toBe("Datos y Contactos");
  await wrapper.findAll('[role="tab"]')[2]!.trigger("click");
  expect(wrapper.find('[aria-selected="true"]').text()).toBe("Información Bancaria");
  wrapper.unmount();
});

test("Editar in Ver Cliente first checks whether the client has movements", async () => {
  const wrapper = mountWith(VerClienteComponent, SECTIONS);
  await answerAll();
  httpMock.mockClear();

  await wrapper.findAll("button").find((button) => button.text() === "Editar")!.trigger("click");
  await flushPromises();

  expect(requested()).toEqual(["entities/validar_eliminar_cliente"]);
  wrapper.unmount();
});

test("Editar Cliente reuses the same card and opens editing once the client's edit is approved", async () => {
  const wrapper = mountWith(EditarClienteComponent, SECTIONS);
  await answerAll();

  expect(requested()).toContain("entities/validar_eliminar_cliente");
  expect(wrapper.findAll('[role="tab"]')).toHaveLength(5);
  const buttons = wrapper.findAll("button").map((button) => button.text());
  expect(buttons).toEqual(expect.arrayContaining(["Cancelar", "Guardar"]));
  expect(buttons).not.toContain("Editar");
  wrapper.unmount();
});

test("Ver Cliente loads the client's departments, provinces and districts together once the client arrives", async () => {
  const wrapper = mountWith(VerClienteComponent, SECTIONS);
  await flushPromises();
  await Promise.all(answers.splice(0).map((answer) => answer()));
  await flushPromises();

  const geo = httpMock.mock.calls.slice(12).map(([config]) => [pathOf(config), config.data ?? config.url]);
  expect(geo).toEqual([
    ["cargar_state", expect.stringContaining("id_pais=139")],
    ["getCity", JSON.stringify({ idState: 15 })],
    ["getTown", JSON.stringify({ idCity: 1501 })],
  ]);
  wrapper.unmount();
});

test("Editar Cliente loads the client's departments, provinces and districts together once the client arrives", async () => {
  const wrapper = mountWith(EditarClienteComponent, SECTIONS);
  await flushPromises();
  await Promise.all(answers.splice(0).map((answer) => answer()));
  await flushPromises();

  expect(httpMock.mock.calls.slice(12).map(([config]) => pathOf(config))).toEqual(["cargar_state", "getCity", "getTown"]);
  wrapper.unmount();
});

test.each([
  ["client", SeccionCliente],
  ["provider", SeccionProveedor],
])("the %s form does not download the whole client list it never shows", async (_, section) => {
  const wrapper = mountWith(section);
  await answerAll();

  expect(requested()).not.toContain("CargarClientes");
  wrapper.unmount();
});
