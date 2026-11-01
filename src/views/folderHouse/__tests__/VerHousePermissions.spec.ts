import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import VerHouse from "@/views/folderHouse/VerHouse.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

const route = vi.hoisted(() => ({ name: "controlHouseVer", params: { id: "9" } }));

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useRoute: () => route }));
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

const SECTIONS = {
  dataGen: true,
  dataEmbar: true,
  HouseStepList: true,
  ClientTrackingPreview: true,
  HouseCustomsCard: true,
  HouseMasterDates: true,
  HouseArrivalNoticeDialog: true,
  HouseClientRequiredDialog: true,
};
const HOUSE = { id: 9, id_master: 5, nro_hbl: "H-9", modality: "Importación" };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4 }]));
  httpMock.mockImplementation(async (config) => ({ data: accepted(config.url.includes("house_ver") ? [HOUSE] : []) }));
});
afterEach(() => wrapper?.unmount());

async function openHouse(routeName: string, actions: string[]) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listHouse", actions }], controlled: ["listHouse"] }));
  route.name = routeName;
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(VerHouse, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: SECTIONS },
    attachTo: document.body,
  });
  await flushPromises();
  document.body.querySelector<HTMLElement>("button .mdi-tools")?.closest("button")?.click();
  await flushPromises();
}

const shows = (text: string) =>
  [...document.body.querySelectorAll("button")].some((button) => (button.textContent ?? "").trim() === text);
const houseControls = () => ({
  acciones: document.body.querySelector("button .mdi-tools, button .mdi-close") !== null,
  eliminar: shows("Eliminar"),
  imprimir: shows("Imprimir"),
  notificaciones: shows("Notificaciones"),
  editar: shows("Editar"),
});
const NONE = { acciones: false, eliminar: false, imprimir: false, notificaciones: false, editar: false };

test("a user who may only look at houses gets no house actions", async () => {
  await openHouse("controlHouseVer", ["VER"]);

  expect(houseControls()).toEqual(NONE);
});

test("each house action shows only with its own permission", async () => {
  await openHouse("controlHouseVer", ["VER", "ELIMINAR"]);
  expect(houseControls()).toEqual({ ...NONE, acciones: true, eliminar: true });

  await openHouse("controlHouseVer", ["VER", "EXPORTAR"]);
  expect(houseControls()).toEqual({ ...NONE, acciones: true, imprimir: true });

  await openHouse("controlHouseVer", ["VER", "MODIFICAR"]);
  expect(houseControls()).toEqual({ ...NONE, acciones: true, notificaciones: true, editar: true });
});

test("the edit address opens the house read-only without Modificar", async () => {
  await openHouse("controlHouseEditar", ["VER", "NUEVO", "ELIMINAR", "EXPORTAR"]);
  expect(shows("Guardar cambios")).toBe(false);

  await openHouse("controlHouseEditar", ["VER", "MODIFICAR"]);
  expect(shows("Guardar cambios")).toBe(true);
});
