import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VAutocomplete } from "vuetify/components";
import * as directives from "vuetify/directives";
import PermissionListComponent from "@/components/Roles/PermissionListComponent.vue";
import { accepted, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const sales = { id: 5, name: "Ventas" };
const admin = { id: 1, name: "MASTER" };
const row = (module: string, screen: string, action: string, roles: { id: number; name: string }[]) => ({
  module,
  group_name: "Grupo",
  menu_id: screen.length,
  route: screen,
  screen,
  action,
  roles,
});
const rows = [
  row("SEGURIDAD", "Usuarios", "VER", [sales, admin]),
  row("SEGURIDAD", "Roles", "NUEVO", [admin]),
  row("PRICING", "Cotizaciones", "VER", [sales]),
];

let wrapper: VueWrapper | undefined;
afterEach(() => wrapper?.unmount());

const mountList = async () => {
  respond({ "permissions/list": accepted(rows) });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(PermissionListComponent, { global: { plugins: [createVuetify({ components, directives }), pinia] } });
  await flushPromises();
};

const filter = async (label: string, value: unknown) => {
  await wrapper!.findAllComponents(VAutocomplete).find((field) => field.props("label") === label)!.setValue(value);
  await flushPromises();
};
const screensShown = () =>
  wrapper!
    .findAll("tbody tr")
    .map((tableRow) => tableRow.findAll("td")[2]?.text())
    .filter(Boolean);

test("lists every screen and action with the roles that grant it", async () => {
  await mountList();

  expect(screensShown()).toEqual(["Usuarios", "Roles", "Cotizaciones"]);
});

test("the module filter keeps only that module's screens", async () => {
  await mountList();

  await filter("Módulo", "SEGURIDAD");

  expect(screensShown()).toEqual(["Usuarios", "Roles"]);
});

test("the role filter keeps only what that role grants, and both filters combine", async () => {
  await mountList();

  await filter("Rol", 5);
  expect(screensShown()).toEqual(["Usuarios", "Cotizaciones"]);

  await filter("Módulo", "SEGURIDAD");
  expect(screensShown()).toEqual(["Usuarios"]);
});
