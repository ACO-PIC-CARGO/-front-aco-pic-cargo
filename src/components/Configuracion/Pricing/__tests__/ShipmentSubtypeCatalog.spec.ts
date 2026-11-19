import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ShipmentSubtypeCatalog from "@/components/Configuracion/Pricing/ShipmentSubtypeCatalog.vue";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";

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

const GRUPAL = {
  id: 1,
  codigo: "001",
  id_shipment: 3,
  shipment: "Marítimo / LCL",
  name: "Grupal",
  created_at: "2026-11-19 00:36:50",
  updated_at: null,
};
const saved = (mensaje: string) => ({ ...accepted([{ id: 1, codigo: "001" }]), mensaje });

let wrapper: VueWrapper | undefined;

function respondBy(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async ({ method, url }) => {
    const key = `${method} ${url.slice(URL_MAIN.length)}`;
    if (!(key in bodies)) throw new Error(`unexpected request ${key}`);
    return { data: bodies[key] };
  });
}

const requests = () => httpMock.mock.calls.map(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}`);
const sentData = (key: string) =>
  httpMock.mock.calls.find(([{ method, url }]) => `${method} ${url.slice(URL_MAIN.length)}` === key)?.[0].data;
const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name);
const labelled = (label: string) => document.body.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
const openDialog = () => document.body.querySelector(".v-dialog.v-overlay--active");

async function settle() {
  for (let round = 0; round < 5; round++) await flushPromises();
}

async function click(element: HTMLElement | null | undefined) {
  element!.click();
  await settle();
}

async function mountCatalog(actions?: string[]) {
  if (actions) {
    sessionStorage.setItem(
      "permissions",
      JSON.stringify({ screens: [{ route: "lstShipmentSubtype", actions }], controlled: ["lstShipmentSubtype"] }),
    );
  }
  const pinia = createPinia();
  setActivePinia(pinia);
  usePricingStore().listShipment = [
    { id: 3, embarque: "Marítimo / LCL" },
    { id: 4, embarque: "Marítimo / FCL" },
  ] as never;
  wrapper = mount(
    defineComponent({ components: { ShipmentSubtypeCatalog }, template: "<v-app><ShipmentSubtypeCatalog /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await settle();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  respondBy({
    "get shipment_subtype": accepted([GRUPAL]),
    "post shipment_subtype": saved("Se guardó el sub tipo de embarque 003."),
    "put shipment_subtype/1": saved("Se guardó el sub tipo de embarque 001."),
    "delete shipment_subtype/1": saved("Se eliminó el sub tipo de embarque."),
  });
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("permissions");
});

test("the list shows the code, the shipment type and the name of each subtype", { timeout: 15_000 }, async () => {
  await mountCatalog();

  const text = document.body.textContent ?? "";
  expect(text).toContain("001");
  expect(text).toContain("Marítimo / LCL");
  expect(text).toContain("Grupal");
});

test("editing a subtype sends its shipment type and new name to that subtype", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(labelled("Editar Grupal"));
  const input = document.body.querySelector<HTMLInputElement>("#shipment-subtype-name")!;
  input.value = "Grupal consolidado";
  input.dispatchEvent(new Event("input"));
  await settle();
  httpMock.mockClear();

  await click(buttonNamed("Guardar cambios"));

  expect(requests()).toEqual(["put shipment_subtype/1", "get shipment_subtype"]);
  expect(sentData("put shipment_subtype/1")).toEqual({ id_shipment: 3, name: "Grupal consolidado" });
  expect(openDialog()).toBeNull();
});

test("a new subtype without a name is not sent", { timeout: 15_000 }, async () => {
  await mountCatalog();
  await click(buttonNamed("Nuevo sub tipo"));
  httpMock.mockClear();

  await click(buttonNamed("Crear sub tipo"));

  expect(requests()).toEqual([]);
  expect(openDialog()).not.toBeNull();
});

test("the eye opens the subtype read only", { timeout: 15_000 }, async () => {
  await mountCatalog();

  await click(labelled("Ver Grupal"));

  expect(openDialog()?.textContent).toContain("Sub tipo 001");
  expect(requests()).toEqual(["get shipment_subtype"]);
});

test("deleting asks first, then removes the subtype and reloads the list", { timeout: 15_000 }, async () => {
  await mountCatalog();
  httpMock.mockClear();

  await click(labelled("Eliminar Grupal"));

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ titleText: expect.stringContaining("Grupal") });
  expect(requests()).toEqual(["delete shipment_subtype/1", "get shipment_subtype"]);
});

test("a user who may only look sees the eye but not edit, delete or create", { timeout: 15_000 }, async () => {
  await mountCatalog(["VER"]);

  expect(labelled("Ver Grupal")).not.toBeNull();
  expect(labelled("Editar Grupal")).toBeNull();
  expect(labelled("Eliminar Grupal")).toBeNull();
  expect(buttonNamed("Nuevo sub tipo")).toBeUndefined();
});
