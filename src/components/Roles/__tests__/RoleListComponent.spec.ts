import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import RoleListComponent from "@/components/Roles/RoleListComponent.vue";
import { accepted, httpMock, respond } from "@/stores/__tests__/catalogHttp";

const push = vi.fn();

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const companyRole = { id: 5, code: "E5", name: "Ventas", description: "Equipo comercial", estado: true, system: false, editable: true, users: 2 };
const systemRole = { id: 1, code: "01", name: "MASTER", description: "", estado: true, system: true, editable: false, users: 9 };
const catalogScreen = { module_id: 1, module: "M", module_order: 1, group_id: 1, group_name: "G", menu_id: 7, route: "r", screen: "S",
  actions: [{ id: 4, code: "04", name: "VER", granted: true, grantable: true }] };

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  respond({ roles: accepted([companyRole, systemRole]), "permissions/catalog": accepted([catalogScreen]), "roles/5": accepted({ id: 5 }) });
});

afterEach(() => wrapper?.unmount());

const mountList = async (actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstPosition", actions }], controlled: ["lstPosition"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { RoleListComponent }, template: "<v-app><RoleListComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find(
    (button) => button.getAttribute("aria-label") === name || button.textContent?.trim() === name,
  );
const listRequests = () => httpMock.mock.calls.map(([config]) => config).filter((config) => config.url.endsWith("roles"));

test("a user who may only look at roles sees no Nuevo, Editar or Desactivar", async () => {
  await mountList(["VER"]);

  expect(buttonNamed("Ver Ventas")).toBeDefined();
  expect(buttonNamed("Nuevo")).toBeUndefined();
  expect(buttonNamed("Editar Ventas")).toBeUndefined();
  expect(buttonNamed("Desactivar Ventas")).toBeUndefined();
});

test("a user who may create and modify roles gets Nuevo, and Editar or Desactivar only on roles they can edit", async () => {
  await mountList(["VER", "NUEVO", "MODIFICAR"]);

  expect(buttonNamed("Nuevo")).toBeDefined();
  expect(buttonNamed("Editar Ventas")).toBeDefined();
  expect(buttonNamed("Desactivar Ventas")).toBeDefined();
  expect(buttonNamed("Editar MASTER")).toBeUndefined();
  expect(buttonNamed("Desactivar MASTER")).toBeUndefined();
});

test("Desactivar asks first, then saves the role switched off with its permissions and reloads the list", async () => {
  await mountList(["VER", "MODIFICAR"]);
  const loadsBefore = listRequests().length;

  buttonNamed("Desactivar Ventas")!.click();
  await flushPromises();

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ title: "¿Desactivar el rol?", showCancelButton: true });
  const update = httpMock.mock.calls.map(([config]) => config).find((config) => config.method === "put")!;
  expect(update.data).toEqual({ name: "Ventas", description: "Equipo comercial", estado: false, permissions: [{ menu_id: 7, actions: ["VER"] }] });
  expect(listRequests().length).toBe(loadsBefore + 1);
});

test("Desactivar sends nothing when the user cancels", async () => {
  await mountList(["VER", "MODIFICAR"]);
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);

  buttonNamed("Desactivar Ventas")!.click();
  await flushPromises();

  expect(httpMock.mock.calls.some(([config]) => config.method === "put")).toBe(false);
});

test("the filters send the search text and Todos as an empty estado", async () => {
  await mountList(["VER"]);

  buttonNamed("Filtrar")!.click();
  await flushPromises();
  const drawer = document.body.querySelector(".v-navigation-drawer--active")!;
  const search = drawer.querySelector<HTMLInputElement>('input[type="text"]')!;
  search.value = "ven";
  search.dispatchEvent(new Event("input"));
  [...drawer.querySelectorAll<HTMLInputElement>('input[type="radio"]')].find((radio) => radio.value === "")!.click();
  await flushPromises();
  [...drawer.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Aceptar")!.click();
  await flushPromises();

  expect(listRequests().slice(-1)[0]!.params).toEqual({ search: "ven", estado: "" });
});
