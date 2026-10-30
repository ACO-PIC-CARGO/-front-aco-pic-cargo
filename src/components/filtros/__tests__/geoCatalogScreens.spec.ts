import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete } from "vuetify/components";
import ListCity from "@/views/City/ListCity.vue";
import ListState from "@/views/State/ListState.vue";
import ListTown from "@/views/Town/ListTown.vue";
import { useCityStore } from "@/stores/city";
import { useStatesStore } from "@/stores/states";
import { useTownStore } from "@/stores/town";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";
import type { HttpConfig } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;
let listRows: unknown[] = [];

const settle = async () => {
  await vi.dynamicImportSettled();
  for (let round = 0; round < 5; round++) await flushPromises();
};
const requestsTo = (path: string) =>
  httpMock.mock.calls.map(([config]) => config).filter((config: HttpConfig) => config.url === URL_MAIN + path);
const buttonNamed = (name: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === name)!;
const openDrawer = () => document.body.querySelector<HTMLElement>(".v-navigation-drawer--active");
const rowIcon = (icon: string) => document.body.querySelector<HTMLElement>(`tbody .${icon}`)!;

const pickInFilter = async (label: string, value: unknown) => {
  const field = wrapper!.findAllComponents(VAutocomplete).find((autocomplete) => autocomplete.props("label") === label)!;
  field.vm.$emit("update:modelValue", value);
  await settle();
};

const typeInto = async (label: string, value: string) => {
  const field = [...openDrawer()!.querySelectorAll(".v-text-field")].find(
    (element) => element.querySelector("label")?.textContent?.trim() === label,
  )!;
  const input = field.querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await settle();
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.method === "get" && config.url.includes("listar_") ? listRows : []),
  }));
});

afterEach(() => wrapper?.unmount());

const mountScreen = async (screen: Component) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ components: { screen }, template: "<v-app><screen /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await settle();
};

describe("Departamento", () => {
  const amazonas = { id: 1, id_pais: 139, code: 1, name: "Amazonas", description: null, status: 1, editableflag: true };

  beforeEach(() => {
    listRows = [amazonas];
  });

  test("editing a department without description saves it and closes the panel", { timeout: 15_000 }, async () => {
    await mountScreen(ListState);
    rowIcon("mdi-pencil").click();
    await settle();

    buttonNamed("Aceptar", openDrawer()!).click();
    await settle();

    expect(requestsTo("actualizar_state").map((config) => config.data)).toEqual([
      expect.objectContaining({ id: 1, description: null }),
    ]);
    expect(openDrawer()).toBeNull();
  });

  test("a double click on Aceptar saves the new department once and closes the panel", { timeout: 15_000 }, async () => {
    await mountScreen(ListState);
    buttonNamed("NUEVO").click();
    await settle();
    useStatesStore().StateModel.id_pais = 139;
    await typeInto("Nombre (*)", "QA Departamento");

    const accept = buttonNamed("Aceptar", openDrawer()!);
    accept.click();
    accept.click();
    await settle();

    expect(requestsTo("insertar_state")).toHaveLength(1);
    expect(openDrawer()).toBeNull();
  });

  test("inactivating a department keeps the user's filter", { timeout: 15_000 }, async () => {
    await mountScreen(ListState);
    useStatesStore().StateFilter.name = "Ama";

    rowIcon("mdi-delete").click();
    await settle();

    expect(requestsTo("listar_state").at(-1)!.params).toMatchObject({ name: "Ama" });
  });
});

describe("Ciudades", () => {
  const chachapoyas = { id: 1, id_pais: 139, id_state: 1, code: 1, name: "Chachapoyas", description: null, status: 1, editableflag: true };

  beforeEach(() => {
    listRows = [chachapoyas];
  });

  test("choosing a country in the filter clears the filter's department and leaves the form alone", { timeout: 15_000 }, async () => {
    await mountScreen(ListCity);
    buttonNamed("FILTRAR").click();
    await settle();
    const cityStore = useCityStore();
    cityStore.filtros.id_state = 5;
    cityStore.model.id_state = 9;

    await pickInFilter("Pais", 139);

    expect(cityStore.filtros.id_state).toBe("");
    expect(cityStore.model.id_state).toBe(9);
  });

  test("editing a city without description saves it and closes the panel", { timeout: 15_000 }, async () => {
    await mountScreen(ListCity);
    rowIcon("mdi-pencil").click();
    await settle();

    buttonNamed("Aceptar", openDrawer()!).click();
    await settle();

    expect(requestsTo("actualizar_city").map((config) => config.data)).toEqual([
      expect.objectContaining({ id: 1, description: null }),
    ]);
    expect(openDrawer()).toBeNull();
  });

  test("a double click on Aceptar saves the new city once and closes the panel", { timeout: 15_000 }, async () => {
    await mountScreen(ListCity);
    buttonNamed("NUEVO").click();
    await settle();
    Object.assign(useCityStore().model, { id_pais: 139, id_state: 1 });
    await typeInto("Nombre (*)", "QA Ciudad");

    const accept = buttonNamed("Aceptar", openDrawer()!);
    accept.click();
    accept.click();
    await settle();

    expect(requestsTo("insertar_city")).toHaveLength(1);
    expect(openDrawer()).toBeNull();
  });
});

describe("Distritos", () => {
  const chachapoyas = { id: 1, id_pais: 139, id_state: 1, id_city: 1, code: 1, name: "Chachapoyas", description: "QA", status: 1, editableflag: true };

  beforeEach(() => {
    listRows = [chachapoyas];
  });

  test("choosing a country or a department in the filter clears the filter's lower levels and leaves the form alone", { timeout: 15_000 }, async () => {
    await mountScreen(ListTown);
    buttonNamed("FILTRAR").click();
    await settle();
    const townStore = useTownStore();
    Object.assign(townStore.filtros, { id_state: 5, id_city: 6 });
    Object.assign(townStore.model, { id_state: 9, id_city: 10 });

    await pickInFilter("Pais", 139);
    const afterCountry = { id_state: townStore.filtros.id_state, id_city: townStore.filtros.id_city };
    townStore.filtros.id_city = 6;
    await pickInFilter("Estado (Región)", 1);

    expect(afterCountry).toEqual({ id_state: "", id_city: "" });
    expect(townStore.filtros.id_city).toBe("");
    expect(townStore.model).toMatchObject({ id_state: 9, id_city: 10 });
  });

  test("a double click on Aceptar saves the new district once and closes the panel", { timeout: 15_000 }, async () => {
    await mountScreen(ListTown);
    buttonNamed("NUEVO").click();
    await settle();
    Object.assign(useTownStore().model, { id_pais: 139, id_state: 1, id_city: 1 });
    await settle();
    await typeInto("Nombre (*)", "QA Distrito");
    await typeInto("Descripción (*)", "QA");

    const accept = buttonNamed("Aceptar", openDrawer()!);
    accept.click();
    accept.click();
    await settle();

    expect(requestsTo("insertar_town")).toHaveLength(1);
    expect(openDrawer()).toBeNull();
  });
});
