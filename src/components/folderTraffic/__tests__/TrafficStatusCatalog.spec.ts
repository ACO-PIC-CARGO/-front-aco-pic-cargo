import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficStatusCatalog from "@/components/folderTraffic/TrafficStatusCatalog.vue";
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

const SHIPPED = { id: 1, name: "Nunca embarcó", position: 2 };
const saved = (mensaje: string) => ({ ...accepted([{ id: 1 }]), mensaje });

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

const requests = () => httpMock.mock.calls.map(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}`);
const sentData = (key: string) =>
  httpMock.mock.calls.find(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}` === key)?.[0].data;
const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name);
const labelled = (label: string) => document.body.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
const openDialog = () => document.body.querySelector(".v-dialog.v-overlay--active");
const nameInput = () => document.body.querySelector<HTMLInputElement>("#traffic-status-name")!;

async function typeName(value: string) {
  nameInput().value = value;
  nameInput().dispatchEvent(new Event("input"));
  await flushPromises();
}

async function click(element: HTMLElement | null | undefined) {
  element!.click();
  for (let round = 0; round < 5; round++) await flushPromises();
}

async function mountCatalog(actions?: string[]) {
  if (actions) {
    sessionStorage.setItem(
      "permissions",
      JSON.stringify({ screens: [{ route: "lstTrafficStatus", actions }], controlled: ["lstTrafficStatus"] }),
    );
  }
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { TrafficStatusCatalog }, template: "<v-app><TrafficStatusCatalog /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  for (let round = 0; round < 5; round++) await flushPromises();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  respondBy({
    "get traffic_status": accepted([SHIPPED]),
    "post traffic_status": saved("Se guardó el estatus."),
    "put traffic_status/1": saved("Se guardó el estatus."),
    "delete traffic_status/1": saved("Se eliminó el estatus."),
  });
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("permissions");
});

test("a valid new status is saved, announced and the list reloads", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(buttonNamed("Nuevo estatus"));
  await typeName("En negociación");
  httpMock.mockClear();

  await click(buttonNamed("Crear estatus"));

  expect(requests()).toEqual(["post traffic_status", "get traffic_status"]);
  expect(sentData("post traffic_status")).toMatchObject({ name: "En negociación" });
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ titleText: "Se guardó el estatus." }));
  expect(openDialog()).toBeNull();
});

test("editing a status sends the change to that status", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(labelled("Editar Nunca embarcó"));
  expect(nameInput().value).toBe("Nunca embarcó");
  await typeName("Nunca embarcó (cliente)");
  httpMock.mockClear();

  await click(buttonNamed("Guardar cambios"));

  expect(requests()).toEqual(["put traffic_status/1", "get traffic_status"]);
  expect(sentData("put traffic_status/1")).toMatchObject({ id: 1, name: "Nunca embarcó (cliente)", position: 2 });
});

test("a refused save keeps the dialog open and shows the server message", { timeout: 15_000 }, async () => {
  respondBy({
    "get traffic_status": accepted([SHIPPED]),
    "post traffic_status": { ...rejected("Ya existe un estatus con ese nombre. Usa otro nombre."), tipomensaje: "TMSGADV" },
  });
  await mountCatalog();
  await click(buttonNamed("Nuevo estatus"));
  await typeName("nunca embarcó");
  httpMock.mockClear();

  await click(buttonNamed("Crear estatus"));

  expect(requests()).toEqual(["post traffic_status"]);
  expect(openDialog()?.textContent).toContain("Ya existe un estatus con ese nombre. Usa otro nombre.");
});

test("a blank name is refused without calling the server", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(buttonNamed("Nuevo estatus"));
  await typeName("   ");
  httpMock.mockClear();

  await click(buttonNamed("Crear estatus"));

  expect(requests()).toEqual([]);
  expect(openDialog()?.textContent).toContain("Escribe el nombre del estatus.");
});

test("deleting a status asks by name, then deletes it and reloads", { timeout: 15_000 }, async () => {
  await mountCatalog();
  httpMock.mockClear();

  await click(labelled("Eliminar Nunca embarcó"));

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ titleText: expect.stringContaining("Nunca embarcó") });
  expect(requests()).toEqual(["delete traffic_status/1", "get traffic_status"]);
});

test("a cancelled delete keeps the status", { timeout: 15_000 }, async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  await mountCatalog();
  httpMock.mockClear();

  await click(labelled("Eliminar Nunca embarcó"));

  expect(requests()).toEqual([]);
});

test("a list that cannot load tells the user", { timeout: 15_000 }, async () => {
  respondBy({ "get traffic_status": new Error("Network Error") });

  await mountCatalog();

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: CONNECTION_ERROR_MESSAGE }));
});

test("an empty catalog is not reported as an error", { timeout: 15_000 }, async () => {
  respondBy({ "get traffic_status": rejected("No se encontraron registros") });

  await mountCatalog();

  expect(Swal.fire).not.toHaveBeenCalled();
});

describe("each action is offered only with its permission", () => {
  const controls = {
    NUEVO: () => buttonNamed("Nuevo estatus"),
    MODIFICAR: () => labelled("Editar Nunca embarcó"),
    ELIMINAR: () => labelled("Eliminar Nunca embarcó"),
  };
  const actions = Object.keys(controls) as (keyof typeof controls)[];

  test.each(actions)("without %s", { timeout: 15_000 }, async (missing) => {
    await mountCatalog(actions.filter((action) => action !== missing));

    for (const action of actions) {
      if (action === missing) expect(controls[action](), action).toBeFalsy();
      else expect(controls[action](), action).toBeTruthy();
    }
  });
});
