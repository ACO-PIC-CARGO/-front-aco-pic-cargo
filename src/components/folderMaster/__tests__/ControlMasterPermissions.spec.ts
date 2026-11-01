import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Component } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ControlMasterComponent from "@/components/folderMaster/ControlMasterComponent.vue";
import HouseListMaster from "@/components/folderMaster/HouseListMaster.vue";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

const route = vi.hoisted(() => ({ name: "controlMasterEditar", params: { id: "5" } as Record<string, string> }));

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => route }));
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

const SUBSECTIONS = { dataGen: true, dataEmbar: true, dataFechas: true, houselist: true };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4 }]));
  httpMock.mockImplementation(async () => ({ data: accepted([]) }));
});
afterEach(() => wrapper?.unmount());

async function mountOn(component: Component, routeName: string, actions: string[], stubs: Record<string, boolean> = {}) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listMaster", actions }], controlled: ["listMaster"] }));
  route.name = routeName;
  route.params = routeName === "controlMaster" ? {} : { id: "5" };
  const pinia = createPinia();
  setActivePinia(pinia);
  useMastersStore().statusData = true;
  useAppStore().itemsHouseList = [{ id: 9, code_house: "H-9" }] as never;
  wrapper?.unmount();
  wrapper = mount(component, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs },
    attachTo: document.body,
  });
  await flushPromises();
  const actionsDial = document.body.querySelector<HTMLButtonElement>("button[aria-label='Acciones']");
  actionsDial?.click();
  await flushPromises();
}

const shows = (text: string) =>
  [...document.body.querySelectorAll("button")].some((button) => (button.textContent ?? "").trim() === text);
const hasIcon = (name: string) => document.body.querySelector(`button .${name}`) !== null;

test("a new master is saved only with Nuevo", async () => {
  await mountOn(ControlMasterComponent, "controlMaster", ["VER", "MODIFICAR"], SUBSECTIONS);
  expect(shows("Guardar")).toBe(false);

  await mountOn(ControlMasterComponent, "controlMaster", ["VER", "NUEVO"], SUBSECTIONS);
  expect(shows("Guardar")).toBe(true);
});

test("an open master is edited only with Modificar and gets houses only with Nuevo", async () => {
  await mountOn(ControlMasterComponent, "controlMasterEditar", ["VER"], SUBSECTIONS);
  expect({ guardar: shows("Guardar Cambios"), agregar: shows("Agregar House") }).toEqual({ guardar: false, agregar: false });

  await mountOn(ControlMasterComponent, "controlMasterEditar", ["VER", "MODIFICAR"], SUBSECTIONS);
  expect({ guardar: shows("Guardar Cambios"), agregar: shows("Agregar House") }).toEqual({ guardar: true, agregar: false });

  await mountOn(ControlMasterComponent, "controlMasterEditar", ["VER", "NUEVO"], SUBSECTIONS);
  expect({ guardar: shows("Guardar Cambios"), agregar: shows("Agregar House") }).toEqual({ guardar: false, agregar: true });
});

test("the read-only master offers to edit it only with Modificar", async () => {
  await mountOn(ControlMasterComponent, "controlMasterVer", ["VER"], SUBSECTIONS);
  expect(hasIcon("mdi-pencil")).toBe(false);

  await mountOn(ControlMasterComponent, "controlMasterVer", ["VER", "MODIFICAR"], SUBSECTIONS);
  expect(hasIcon("mdi-pencil")).toBe(true);
});

test("a house of the master is deleted only with Eliminar and moved to another master only with Modificar", async () => {
  const houseControls = () => ({ eliminar: hasIcon("mdi-delete"), mover: hasIcon("mdi-folder-arrow-up-down") });

  await mountOn(HouseListMaster, "controlMasterEditar", ["VER"]);
  expect(houseControls()).toEqual({ eliminar: false, mover: false });

  await mountOn(HouseListMaster, "controlMasterEditar", ["VER", "ELIMINAR"]);
  expect(houseControls()).toEqual({ eliminar: true, mover: false });

  await mountOn(HouseListMaster, "controlMasterEditar", ["VER", "MODIFICAR"]);
  expect(houseControls()).toEqual({ eliminar: false, mover: true });
});
