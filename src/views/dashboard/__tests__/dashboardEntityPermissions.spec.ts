import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DashboardMain from "@/views/dashboard/DashboardMain.vue";
import { useEntitiesStore } from "@/stores/entities";

const route = vi.hoisted(() => ({ name: "nuevoClientes", params: {}, fullPath: "/" }));
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn(), resolve: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: {} }), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));
vi.mock("socket.io-client", () => ({ io: () => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() }) }));

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, esnuevoflag: false }]));
});
afterEach(() => wrapper?.unmount());

const appBarWith = async (screen: string, actions: string[]) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: screen, actions }], controlled: [screen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  useEntitiesStore().showBtnSaveFlag = true;
  wrapper = shallowMount(DashboardMain, { global: { plugins: [pinia], renderStubDefaultSlot: true, stubs: { RouterView: true } } });
  await flushPromises();
  return wrapper.find("v-app-bar-stub").text().replace(/\s+/g, " ").toUpperCase();
};

describe.each([
  ["nuevoClientes", "listClientes", "GUARDAR CLIENTE"],
  ["nuevoProveedor", "listProveedor", "GUARDAR PROVEEDOR"],
])("on %s, the top bar save", (routeName, screen, control) => {
  beforeEach(() => {
    route.name = routeName;
  });

  test("is hidden without Nuevo", async () => {
    expect(await appBarWith(screen, ["VER", "MODIFICAR", "ELIMINAR", "EXPORTAR"])).not.toContain(control);
  });

  test("shows with Nuevo", async () => {
    expect(await appBarWith(screen, ["VER", "NUEVO"])).toContain(control);
  });
});
