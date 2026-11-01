import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Component } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VAutocomplete } from "vuetify/components";
import * as directives from "vuetify/directives";
import BitacoraHouse from "@/components/folderHouse/BitacoraHouse.vue";
import ControlHouseComponent from "@/components/folderHouse/ControlHouseComponent.vue";
import DataGen from "@/components/folderHouse/DataGen.vue";
import ServicesHouse from "@/components/folderHouse/ServicesHouse.vue";
import { useHousesStore } from "@/stores/houses";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ name: "controlHouseId", params: { id: "9" } }) }));
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

const SECTIONS = { dataGen: true, dataEmbar: true, services: true, Bitacora: true, HouseArrivalNoticeDialog: true };
const BITACORA_ENTRY = { id: 3, namebitacora: "Zarpe", comentario: "Salió", date: "2026-10-01", visible_cliente: true, orden: 1 };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4 }]));
  httpMock.mockImplementation(async () => ({ data: accepted([]) }));
});
afterEach(() => wrapper?.unmount());

async function mountAs(component: Component, actions: string[], stubs: Record<string, boolean> = {}) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listHouse", actions }], controlled: ["listHouse"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(component, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs },
    attachTo: document.body,
  });
  await flushPromises();
}

const shows = (text: string) =>
  [...document.body.querySelectorAll("button")].some((button) => (button.textContent ?? "").trim() === text);

test("the house file actions show only with the House permission for each action", async () => {
  const fileActions = async (actions: string[]) => {
    await mountAs(ControlHouseComponent, actions, SECTIONS);
    document.body.querySelector<HTMLButtonElement>("button[aria-label='Acciones']")!.click();
    await flushPromises();
    return {
      eliminar: shows("Eliminar"),
      imprimir: shows("Imprimir"),
      notificaciones: shows("Notificaciones"),
      guardar: shows("Guardar"),
      tracking: shows("Tracking"),
    };
  };
  const NONE = { eliminar: false, imprimir: false, notificaciones: false, guardar: false, tracking: true };

  expect(await fileActions(["VER"])).toEqual(NONE);
  expect(await fileActions(["VER", "ELIMINAR"])).toEqual({ ...NONE, eliminar: true });
  expect(await fileActions(["VER", "EXPORTAR"])).toEqual({ ...NONE, imprimir: true });
  expect(await fileActions(["VER", "MODIFICAR"])).toEqual({ ...NONE, notificaciones: true, guardar: true });
});

test("a bitácora entry is added with Nuevo, shown to the client with Modificar and deleted with Eliminar", async () => {
  const bitacoraControls = async (actions: string[]) => {
    await mountAs(BitacoraHouse, actions);
    useHousesStore().itemsBitacora = [BITACORA_ENTRY] as never;
    await flushPromises();
    const switches = wrapper!.findAll<HTMLInputElement>('input[type="checkbox"]');
    return {
      agregar: shows("Agregar"),
      nuevoEstado: wrapper!.find(".mdi-plus").exists(),
      visible: !switches[switches.length - 1]!.element.disabled,
      eliminar: wrapper!.find("tbody .mdi-delete").exists(),
    };
  };
  const NONE = { agregar: false, nuevoEstado: false, visible: false, eliminar: false };

  expect(await bitacoraControls(["VER"])).toEqual(NONE);
  expect(await bitacoraControls(["VER", "NUEVO"])).toEqual({ ...NONE, agregar: true, nuevoEstado: true });
  expect(await bitacoraControls(["VER", "MODIFICAR"])).toEqual({ ...NONE, visible: true });
  expect(await bitacoraControls(["VER", "ELIMINAR"])).toEqual({ ...NONE, eliminar: true });
});

test("the telex release is confirmed only with Modificar", async () => {
  const offersTelex = async (actions: string[]) => {
    await mountAs(ServicesHouse, actions);
    useHousesStore().telexconfirmado = true as never;
    await flushPromises();
    return shows("Confirmar Telex");
  };

  expect(await offersTelex(["VER", "NUEVO", "ELIMINAR"])).toBe(false);
  expect(await offersTelex(["VER", "MODIFICAR"])).toBe(true);
});

test("a quote is associated to the house, which approves it, only with Modificar", async () => {
  httpMock.mockImplementation(async (config) =>
    config.url.includes("listar_montos_finales")
      ? new Promise(() => {})
      : { data: accepted(config.url.includes("house_ver") ? [{ id: 9, id_cot: null, id_quoteaduana: null }] : []) });
  const associates = async (actions: string[]) => {
    sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listHouse", actions }], controlled: ["listHouse"] }));
    const pinia = createPinia();
    setActivePinia(pinia);
    wrapper?.unmount();
    wrapper = mount(DataGen, { global: { plugins: [createVuetify({ components, directives }), pinia] } });
    await flushPromises();
    return wrapper
      .findAllComponents(VAutocomplete)
      .filter((field) => ["Cot Nro", "Aduana Asociado al House"].includes(field.props("label") as string))
      .map((field) => !field.props("disabled"));
  };

  expect(await associates(["VER", "NUEVO", "ELIMINAR"])).toEqual([false, false]);
  expect(await associates(["VER", "MODIFICAR"])).toEqual([true, true]);
});

test("the house file locks its shipment and services sections without Modificar", async () => {
  const sectionsLocked = async (actions: string[]) => {
    await mountAs(ControlHouseComponent, actions, SECTIONS);
    return ["data-embar-stub", "services-stub"].map(
      (stub) => wrapper!.find(stub).attributes("isformactionsdisabled") === "true",
    );
  };

  expect(await sectionsLocked(["VER", "NUEVO", "ELIMINAR"])).toEqual([true, true]);
  expect(await sectionsLocked(["VER", "MODIFICAR"])).toEqual([false, false]);
});
