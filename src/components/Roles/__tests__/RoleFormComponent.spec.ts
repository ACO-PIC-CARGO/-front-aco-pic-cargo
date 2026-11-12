import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import RoleFormComponent from "@/components/Roles/RoleFormComponent.vue";
import { accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

const routeParams: { id?: string } = {};
const push = vi.fn();

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: routeParams }), useRouter: () => ({ push }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const screen = (menu_id: number, granted: string[] = []) => ({
  module_id: 1,
  module: "SEGURIDAD",
  module_order: 1,
  group_id: 12,
  group_name: "EMPRESA Y USUARIO",
  menu_id,
  route: `route${menu_id}`,
  screen: `Pantalla ${menu_id}`,
  actions: ["VER", "NUEVO"].map((name, id) => ({ id, code: `0${id}`, name, granted: granted.includes(name), grantable: true })),
});
const role = {
  id: 5,
  code: "E5",
  name: "Ventas",
  description: "Equipo comercial",
  estado: true,
  system: false,
  editable: true,
  users: [
    { id: 4, users: "ana", nombrecompleto: "Ana Díaz", assigned: true },
    { id: 8, users: "pepe", nombrecompleto: "Pepe Ruiz", assigned: false },
  ],
};

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  delete routeParams.id;
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

afterEach(() => wrapper?.unmount());

const mountForm = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { RoleFormComponent }, template: "<v-app><RoleFormComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const typeInto = async (label: string, value: string) => {
  const field = wrapper!.findAll(".v-text-field").find((candidate) => candidate.find("label").text().trim() === label)!;
  await field.find("input").setValue(value);
};
const clickButton = async (name: string) => {
  await wrapper!.findAll("button").find((button) => button.text().trim() === name)!.trigger("click");
  await flushPromises();
};
const requestsTo = (method: string, path: string) =>
  httpMock.mock.calls.map(([config]) => config).filter((config) => config.method === method && config.url.endsWith(path));

test("a new role is sent with its name, description, estado and the screens checked in the matrix", async () => {
  respond({ "permissions/catalog": accepted([screen(7), screen(8)]), roles: accepted({ id: 9 }) });
  await mountForm();

  await typeInto("Nombre (*)", "Ventas");
  await typeInto("Descripción", "Equipo comercial");
  for (const panel of ["SEGURIDAD", "EMPRESA Y USUARIO"]) {
    await wrapper!.findAll("button").find((button) => button.text().startsWith(`${panel} `))!.trigger("click");
  }
  await wrapper!.find('input[aria-label="Nuevo en Pantalla 7"]').setValue(true);
  await clickButton("Guardar");

  expect(requestsTo("post", "roles").map((config) => config.data)).toEqual([
    { name: "Ventas", description: "Equipo comercial", estado: true, permissions: [{ menu_id: 7, actions: ["VER", "NUEVO"] }] },
  ]);
  expect(push).toHaveBeenCalledWith({ name: "lstPosition" });
});

test("a name shorter than 3 characters is not sent", async () => {
  respond({ "permissions/catalog": accepted([screen(7)]) });
  await mountForm();

  await typeInto("Nombre (*)", "Ve");
  await clickButton("Guardar");

  expect(requestsTo("post", "roles")).toEqual([]);
  expect(wrapper!.text()).toContain("El nombre debe tener entre 3 y 100 caracteres.");
});

test("editing a role starts from its current grants and saves them back unchanged", async () => {
  routeParams.id = "5";
  respond({ "roles/5": accepted(role), "permissions/catalog": accepted([screen(7, ["VER"]), screen(8)]) });
  await mountForm();

  await clickButton("Guardar");

  expect(requestsTo("put", "roles/5").map((config) => config.data)).toEqual([
    { name: "Ventas", description: "Equipo comercial", estado: true, permissions: [{ menu_id: 7, actions: ["VER"] }] },
  ]);
});

test("a refused save shows the server's reason and keeps the user on the form", async () => {
  respond({
    "permissions/catalog": accepted([screen(7)]),
    roles: { ...rejected("Ya existe un rol con ese nombre. Elige otro nombre."), tipomensaje: "TMSGADV" },
  });
  await mountForm();

  await typeInto("Nombre (*)", "Ventas");
  await clickButton("Guardar");

  expect(vi.mocked(Swal.fire).mock.lastCall![0]).toMatchObject({
    icon: "error",
    text: "Ya existe un rol con ese nombre. Elige otro nombre.",
  });
  expect(push).not.toHaveBeenCalled();
});

test("the Usuarios tab sends exactly the users checked for the role", async () => {
  routeParams.id = "5";
  respond({ "roles/5": accepted(role), "permissions/catalog": accepted([screen(7, ["VER"])]), "roles/5/users": accepted([]) });
  await mountForm();

  await wrapper!.findAll(".v-tab").find((tab) => tab.text().includes("Usuarios"))!.trigger("click");
  await flushPromises();
  await wrapper!.findAll("tr").find((row) => row.text().includes("pepe"))!.find("input").trigger("click");
  await clickButton("Guardar usuarios");

  expect(requestsTo("put", "roles/5/users").map((config) => config.data)).toEqual([{ users: [4, 8] }]);
});

test("a role the company cannot see explains itself instead of showing an empty form", async () => {
  routeParams.id = "77";
  respond({ "roles/77": rejected(), "permissions/catalog": accepted([]) });
  await mountForm();

  expect(wrapper!.text()).toContain("No encontramos este rol");
  expect(wrapper!.findAll("button").some((button) => button.text().trim() === "Guardar")).toBe(false);
});
