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
import ListaContenedoresComponent from "@/components/FolderContainers/ListaContenedoresComponent.vue";
import ListaDocumentosComponent from "@/components/FolderDocument/ListaDocumentosComponent.vue";
import ListaGastosComponent from "@/components/FolderGasto/ListaGastosComponent.vue";
import ListaIngresosComponent from "@/components/FolderIngresos/ListaIngresosComponent.vue";
import ListaMonedasComponent from "@/components/FolderCoins/ListaMonedasComponent.vue";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const ROW = { id: 9, code: "X1", name: "Fila", description: "Fila activa", calculoflag: false, status: 1 };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  httpMock.mockImplementation(async (config) => ({
    data: accepted(/^(listar|ver)_/.test(config.url.slice(URL_MAIN.length)) ? [{ ...ROW }] : []),
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
  await flushPromises();
  httpMock.mockClear();
};

const listReloads = (list: string) =>
  httpMock.mock.calls.filter(([config]) => config.url.slice(URL_MAIN.length).startsWith(list)).length;

const buttonNamed = (name: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name)!;

const typeInto = async (label: string, value: string) => {
  const input = [...document.body.querySelectorAll(".v-navigation-drawer--active .v-text-field")]
    .find((field) => field.querySelector("label")?.textContent?.trim() === label)!
    .querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

describe.each([
  { screen: "Contenedores", component: ListaContenedoresComponent, list: "listar_containers" },
  { screen: "Tipos de documento", component: ListaDocumentosComponent, list: "listar_documents" },
  { screen: "Tipos de gasto", component: ListaGastosComponent, list: "listar_gasto" },
  { screen: "Tipos de ingreso", component: ListaIngresosComponent, list: "listar_ingreso" },
])("$screen", ({ component, list }) => {
  test("inactivating a row reloads the list once", { timeout: 15_000 }, async () => {
    await mountScreen(component);

    document.body.querySelector<HTMLElement>(".mdi-delete")!.closest("button")!.click();
    await flushPromises();

    expect(httpMock.mock.calls.some(([config]) => config.method === "put")).toBe(true);
    expect(listReloads(list)).toBe(1);
  });
});

test("saving a new container reloads the list once", { timeout: 15_000 }, async () => {
  await mountScreen(ListaContenedoresComponent);
  buttonNamed("Nuevo").click();
  await flushPromises();
  httpMock.mockClear();
  await typeInto("Nombre (*)", "Flat rack");
  for (const label of ["Largo (*)", "Ancho (*)", "Altura (*)", "Peso Máximo (*)", "Volumen Máximo (*)"]) {
    await typeInto(label, "1");
  }

  buttonNamed("Aceptar", document.body.querySelector(".v-navigation-drawer--active")!).click();
  await flushPromises();

  expect(listReloads("insertar_containers")).toBe(1);
  expect(listReloads("listar_containers")).toBe(1);
});

test("clearing the containers filter reloads the list once", { timeout: 15_000 }, async () => {
  await mountScreen(ListaContenedoresComponent);
  buttonNamed("Filtrar").click();
  await flushPromises();

  buttonNamed("Limpiar", document.body.querySelector(".v-navigation-drawer--active")!).click();
  await flushPromises();

  expect(listReloads("listar_containers")).toBe(1);
});

test("saving an edited currency reloads the list once", { timeout: 15_000 }, async () => {
  await mountScreen(ListaMonedasComponent);
  document.body.querySelector<HTMLElement>(".mdi-pencil")!.click();
  await flushPromises();
  await typeInto("Nombre (*)", "Euro");
  httpMock.mockClear();

  buttonNamed("Aceptar", document.body.querySelector(".v-navigation-drawer--active")!).click();
  await flushPromises();

  expect(listReloads("actualizar_coins")).toBe(1);
  expect(listReloads("listar_coins")).toBe(1);
});
