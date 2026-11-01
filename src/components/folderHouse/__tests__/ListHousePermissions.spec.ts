import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListHouseComponent from "@/components/folderHouse/ListHouseComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const HOUSE = { id: 31, id_master: 7, code_house: "H-31", list_comentarios: [], status: 1 };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22, id: 4 }]));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.startsWith(URL_MAIN + "listado_houses") ? [HOUSE] : []),
  }));
});
afterEach(() => wrapper?.unmount());

async function mountList(screen: string, actions: string[], props: Record<string, unknown> = {}) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: screen, actions }], controlled: [screen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(ListHouseComponent, {
    props,
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
}

const savesFolder = async () => {
  await wrapper!.find(".mdi-folder").trigger("click");
  await flushPromises();
  return [...document.body.querySelectorAll("button")].some((button) => (button.textContent ?? "").includes("Guardar"));
};
const rowControls = () => ({
  comentar: wrapper!.find(".mdi-chat-plus").exists(),
  editar: wrapper!.find(".mdi-pencil").exists(),
});

test("a user who may only look at houses can open them but not comment, edit or change their folder", async () => {
  await mountList("listHouse", ["VER"]);

  expect(rowControls()).toEqual({ comentar: false, editar: false });
  expect(wrapper!.find(".mdi-eye").exists()).toBe(true);
  expect(await savesFolder()).toBe(false);
});

test("a house comment needs Nuevo, and editing the house or its folder needs Modificar", async () => {
  await mountList("listHouse", ["VER", "NUEVO"]);
  expect(rowControls()).toEqual({ comentar: true, editar: false });

  await mountList("listHouse", ["VER", "MODIFICAR"]);
  expect(rowControls()).toEqual({ comentar: false, editar: true });
  expect(await savesFolder()).toBe(true);
});

test("inside Control de gastos the folder URL is saved with that screen's Modificar", async () => {
  await mountList("listControlGastos", ["VER"], { statusList: "2" });
  expect(await savesFolder()).toBe(false);

  await mountList("listControlGastos", ["VER", "MODIFICAR"], { statusList: "2" });
  expect(await savesFolder()).toBe(true);
});
