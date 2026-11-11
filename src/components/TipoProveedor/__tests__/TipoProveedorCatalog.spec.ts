import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TipoProveedorCatalog from "@/components/TipoProveedor/TipoProveedorCatalog.vue";
import { accepted, httpMock, rejected, URL_MAIN } from "@/stores/__tests__/catalogHttp";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const NAVIERA = {
  id: 4,
  id_branch: 7,
  code: 10,
  id_proveedor: null,
  name: "Naviera",
  description: "Líneas marítimas",
  status: 1,
  created_at: "2021-04-13T10:00:00.000Z",
  updated_at: "2024-08-08T23:12:28.512Z",
  categoria: "Transporte",
};
const AGENTE = {
  ...NAVIERA,
  id: 5,
  code: 11,
  name: "Agente antiguo",
  description: null,
  status: 0,
  categoria: null,
};
const saved = (mensaje: string) => ({ ...accepted([{ id: 4 }]), mensaje });

let wrapper: VueWrapper | undefined;

function respondBy(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async ({ method, url }) => {
    const key = `${method} ${url.slice(URL_MAIN.length)}`;
    if (!(key in bodies)) throw new Error(`unexpected request ${key}`);
    const body = bodies[key];
    if (body instanceof Error) throw body;
    return { data: body };
  });
}

const BODIES = {
  "get listar_table_role": accepted([NAVIERA, AGENTE]),
  "post insertar_table_role": saved("Se creó el tipo de proveedor."),
  "put actualizar_table_role": saved("Se actualizó el tipo de proveedor."),
  "put eliminar_table_role": saved("Se eliminó el tipo de proveedor."),
};

const requests = () => httpMock.mock.calls.map(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}`);
const sent = (key: string) =>
  httpMock.mock.calls.find(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}` === key)?.[0];
const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name);
const labelled = (label: string) => document.body.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
const openDrawer = () => document.body.querySelector(".tipo-drawer.v-navigation-drawer--active");
const rows = () =>
  [...document.body.querySelectorAll(".tipo-table tbody tr")].map((row) =>
    [...row.querySelectorAll("td")].slice(1).map((cell) => cell.textContent?.trim()),
  );

async function settle() {
  for (let round = 0; round < 5; round++) await flushPromises();
}

async function click(element: HTMLElement | null | undefined) {
  element!.click();
  await settle();
}

async function type(selector: string, value: string) {
  const input = document.body.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await settle();
}

async function mountCatalog(actions?: string[]) {
  if (actions) {
    sessionStorage.setItem(
      "permissions",
      JSON.stringify({ screens: [{ route: "tipoProveedor", actions }], controlled: ["tipoProveedor"] }),
    );
  }
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { TipoProveedorCatalog }, template: "<v-app><TipoProveedorCatalog /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await settle();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  respondBy(BODIES);
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("dataUser");
  sessionStorage.removeItem("permissions");
});

test("lists the active types of the branch, sending every filter and an empty category", { timeout: 15_000 }, async () => {
  await mountCatalog();

  expect(sent("get listar_table_role")!.params).toEqual({ id_branch: 7, code: "", name: "", categoria: "", status: 1 });
  expect(rows()).toEqual([
    ["10", "Naviera", "Líneas marítimas", "Activo", "2021-04-13", "2024-08-08"],
    ["11", "Agente antiguo", "", "Inactivo", "2021-04-13", "2024-08-08"],
  ]);
  expect(document.body.querySelector(".tipo-table thead")!.textContent).not.toContain("Categoría");
});

test("the filters chosen in the drawer are sent to the listing", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(buttonNamed("Filtrar"));
  expect(document.body.querySelector(".tipo-filter-drawer")!.textContent).not.toContain("Categoría");
  await type("#filtro-code", " 10 ");
  await type("#filtro-name", "Navi");
  await click([...document.body.querySelectorAll<HTMLElement>(".tipo-filter-drawer label")].find((label) => label.textContent === "Todos"));
  httpMock.mockClear();

  await click(buttonNamed("Aceptar"));

  expect(sent("get listar_table_role")!.params).toEqual({ id_branch: 7, code: "10", name: "Navi", categoria: "", status: "" });
});

test("Limpiar goes back to the active types without filters", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(buttonNamed("Filtrar"));
  await type("#filtro-name", "Navi");
  httpMock.mockClear();

  await click(buttonNamed("Limpiar"));

  expect(sent("get listar_table_role")!.params).toEqual({ id_branch: 7, code: "", name: "", categoria: "", status: 1 });
});

test("Nuevo creates a type with the fields the endpoint expects and reloads", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(buttonNamed("Nuevo"));
  await type("#tipo-name", " Courier ");
  await type("#tipo-description", "Envíos express");
  httpMock.mockClear();

  await click(buttonNamed("Crear tipo"));

  expect(requests()).toEqual(["post insertar_table_role", "get listar_table_role"]);
  expect(sent("post insertar_table_role")!.data).toEqual({
    name: "Courier",
    description: "Envíos express",
    categoria: "",
    id_proveedor: null,
  });
  expect(openDrawer()).toBeNull();
});

test("without Nuevo permission the button is hidden", { timeout: 15_000 }, async () => {
  await mountCatalog(["VER", "MODIFICAR"]);

  expect(buttonNamed("Nuevo")).toBeUndefined();
});

test("editing a type sends the change with its id and reloads", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(labelled("Editar Naviera"));
  await type("#tipo-name", "Naviera internacional");
  httpMock.mockClear();

  await click(buttonNamed("Guardar cambios"));

  expect(requests()).toEqual(["put actualizar_table_role", "get listar_table_role"]);
  expect(sent("put actualizar_table_role")!.data).toEqual({
    id: 4,
    id_branch: 7,
    code: 10,
    name: "Naviera internacional",
    description: "Líneas marítimas",
    categoria: "",
    status: 1,
  });
  expect(openDrawer()).toBeNull();
});

test("a type without name is not sent", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(labelled("Editar Naviera"));
  await type("#tipo-name", "  ");
  httpMock.mockClear();

  await click(buttonNamed("Guardar cambios"));

  expect(requests()).toEqual([]);
  expect(openDrawer()).not.toBeNull();
});

test("a refused update stays open and shows why", { timeout: 15_000 }, async () => {
  respondBy({ ...BODIES, "put actualizar_table_role": rejected("Ya existe un tipo con ese nombre.") });
  await mountCatalog();
  await click(labelled("Editar Naviera"));

  await click(buttonNamed("Guardar cambios"));

  expect(openDrawer()?.textContent).toContain("Ya existe un tipo con ese nombre.");
});

test("deleting a type sends its id after confirming and reloads", { timeout: 15_000 }, async () => {
  await mountCatalog();
  httpMock.mockClear();

  await click(labelled("Eliminar Naviera"));

  expect(requests()).toEqual(["put eliminar_table_role", "get listar_table_role"]);
  expect(sent("put eliminar_table_role")!.data).toEqual({ id: 4 });
});

test("cancelling the delete keeps the type", { timeout: 15_000 }, async () => {
  await mountCatalog();
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  httpMock.mockClear();

  await click(labelled("Eliminar Naviera"));

  expect(requests()).toEqual([]);
});

test("without Modificar or Eliminar the actions are hidden", { timeout: 15_000 }, async () => {
  await mountCatalog(["VER"]);

  expect(labelled("Editar Naviera")).toBeNull();
  expect(labelled("Eliminar Naviera")).toBeNull();
});

test("a connection failure is reported", { timeout: 15_000 }, async () => {
  respondBy({ ...BODIES, "get listar_table_role": new Error("offline") });
  await mountCatalog();

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: CONNECTION_ERROR_MESSAGE }));
});
