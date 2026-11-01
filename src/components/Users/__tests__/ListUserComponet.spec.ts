import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListUserComponet from "@/components/Users/ListUserComponet.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const activeUser = { id: 4, nombrecompleto: "Ana Díaz", users: "ana", phone: "999", status: 1, json_position: [], json_menu: [] };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.startsWith(URL_MAIN + "listar_usuarios") ? [activeUser] : []),
  }));
});

afterEach(() => wrapper?.unmount());

const mountList = async (actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listUser", actions }], controlled: ["listUser"] }));
  setActivePinia(createPinia());
  wrapper = mount(ListUserComponet, { global: { plugins: [createVuetify({ components, directives })] } });
  await flushPromises();
};

const shows = () => ({
  nuevo: wrapper!.findAll("button").some((button) => button.text().trim() === "NUEVO"),
  editar: wrapper!.find(".mdi-pencil").exists(),
  eliminar: wrapper!.find(".mdi-delete").exists(),
});

test("a user who may only look at users sees no Nuevo, Editar or Eliminar", async () => {
  await mountList(["VER"]);

  expect(shows()).toEqual({ nuevo: false, editar: false, eliminar: false });
  expect(wrapper!.find(".mdi-eye").exists()).toBe(true);
});

test("each users action shows only with its own permission", async () => {
  await mountList(["VER", "NUEVO"]);
  expect(shows()).toEqual({ nuevo: true, editar: false, eliminar: false });
  wrapper!.unmount();

  await mountList(["VER", "MODIFICAR", "ELIMINAR"]);
  expect(shows()).toEqual({ nuevo: false, editar: true, eliminar: true });
});
