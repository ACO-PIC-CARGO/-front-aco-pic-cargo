import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import RoleDetailComponent from "@/components/Roles/RoleDetailComponent.vue";
import { accepted, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "5" } }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const role = (editable: boolean) => ({
  id: 5,
  code: "E5",
  name: "Ventas",
  description: "Equipo comercial",
  estado: true,
  system: !editable,
  editable,
  users: [
    { id: 4, users: "ana", nombrecompleto: "Ana Díaz", assigned: true },
    { id: 8, users: "pepe", nombrecompleto: "Pepe Ruiz", assigned: false },
  ],
});

let wrapper: VueWrapper | undefined;

beforeEach(() => vi.clearAllMocks());
afterEach(() => wrapper?.unmount());

const mountDetail = async (editable: boolean, actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstPosition", actions }], controlled: ["lstPosition"] }));
  respond({ "roles/5": accepted(role(editable)), "permissions/catalog": accepted([]) });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { RoleDetailComponent }, template: "<v-app><RoleDetailComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] } },
  );
  await flushPromises();
};

const hasButton = (name: string) => wrapper!.findAll("button").some((button) => button.text().trim() === name);

test("lists only the users who hold the role", async () => {
  await mountDetail(true, ["VER"]);

  expect(wrapper!.text()).toContain("Ana Díaz");
  expect(wrapper!.text()).not.toContain("Pepe Ruiz");
});

test("offers Editar only to a user who may modify a role they can edit", async () => {
  await mountDetail(true, ["VER"]);
  expect(hasButton("Editar")).toBe(false);
  wrapper!.unmount();

  await mountDetail(false, ["VER", "MODIFICAR"]);
  expect(hasButton("Editar")).toBe(false);
  wrapper!.unmount();

  await mountDetail(true, ["VER", "MODIFICAR"]);
  expect(hasButton("Editar")).toBe(true);
});
