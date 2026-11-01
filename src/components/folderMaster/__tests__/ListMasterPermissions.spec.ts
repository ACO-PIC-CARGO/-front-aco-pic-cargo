import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListMasterComponent from "@/components/folderMaster/ListMasterComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ name: "listMaster", params: {} }) }));
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

const master = (id: number, fields: Record<string, unknown>) => ({
  id,
  code_master: `M-${id}`,
  status: 1,
  statuslock: 0,
  statuslockadm: 0,
  list_comentarios: [],
  list_houses: [],
  ...fields,
});
const MASTERS = [master(1, {}), master(2, { statuslock: 1, statuslockadm: 1 }), master(3, { status: 0 })];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4 }]));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.startsWith(URL_MAIN + "getMasterList") ? MASTERS : []),
  }));
});
afterEach(() => wrapper?.unmount());

async function mountList(actions: string[]) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listMaster", actions }], controlled: ["listMaster"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(ListMasterComponent, {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
  for (const menu of wrapper.findAll(".mdi-menu")) await menu.trigger("click");
  await flushPromises();
}

const shows = (text: string) =>
  [...document.body.querySelectorAll("button, .v-list-item-title")].some((control) =>
    (control.textContent ?? "").replace(/\s+/g, " ").includes(text));

const controls = () => ({
  nuevo: shows("NUEVO EXPEDIENTE"),
  editar: shows("Editar Master"),
  fechas: document.body.querySelector(".mdi-calendar-edit") !== null,
  cerrar: shows("Cerrar Expediente Operativo") && shows("Cerrar Expediente Administrativo"),
  abrir: shows("Abrir Expediente Operativo") && shows("Abrir Expediente Administrativo"),
  activar: shows("Activar"),
  anular: shows("Anular"),
});

const NONE = { nuevo: false, editar: false, fechas: false, cerrar: false, abrir: false, activar: false, anular: false };

test("a user who may only look at masters sees no control that changes them", async () => {
  await mountList(["VER"]);

  expect(controls()).toEqual(NONE);
  expect(document.body.querySelector(".mdi-eye")).not.toBeNull();
});

test("each master action shows only with its own permission", async () => {
  await mountList(["VER", "NUEVO"]);
  expect(controls()).toEqual({ ...NONE, nuevo: true });
  wrapper!.unmount();

  await mountList(["VER", "MODIFICAR"]);
  expect(controls()).toEqual({ ...NONE, editar: true, fechas: true, cerrar: true, abrir: true, activar: true });
  wrapper!.unmount();

  await mountList(["VER", "ELIMINAR"]);
  expect(controls()).toEqual({ ...NONE, anular: true });
});

test("the folder dialog opens the folder for everyone and saves a new URL only with Modificar", async () => {
  const savesFolder = async (actions: string[]) => {
    await mountList(actions);
    await wrapper!.find("button .mdi-folder").trigger("click");
    await flushPromises();
    const offered = { abrir: shows("Abrir"), guardar: shows("Guardar") };
    wrapper!.unmount();
    return offered;
  };

  expect(await savesFolder(["VER"])).toEqual({ abrir: true, guardar: false });
  expect(await savesFolder(["VER", "MODIFICAR"])).toEqual({ abrir: true, guardar: true });
});
