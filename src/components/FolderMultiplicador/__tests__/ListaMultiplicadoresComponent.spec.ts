import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VAutocomplete } from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaMultiplicadoresComponent from "@/components/FolderMultiplicador/ListaMultiplicadoresComponent.vue";
import { accepted, httpMock, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const FCL = 2;
const LCL = 3;
const CONTAINER = 5;
const lclMultiplier = { id: 30, id_shipment: LCL, type_carga: "LCL", code: "1", name: "LCL", valor: 0.5, status: 1, id_containers: null };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

afterEach(() => wrapper?.unmount());

const mountScreen = async (listed: unknown[]) => {
  respond({
    listar_multiplicador: accepted(listed),
    cargar_shipment: accepted([
      { id: FCL, name: "FCL" },
      { id: LCL, name: "LCL" },
    ]),
    getContainersList: accepted([{ id: CONTAINER, name: "20 Standard" }]),
    nuevo_multiplicador: accepted([]),
    actualizar_multiplicador: accepted([]),
  });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { ListaMultiplicadoresComponent }, template: "<v-app><ListaMultiplicadoresComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const inDrawer = <T extends Element>(selector: string) =>
  [...document.body.querySelectorAll<T>(`.v-navigation-drawer--active ${selector}`)];

const click = async (element: HTMLElement) => {
  element.click();
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 150));
  await flushPromises();
};

const clickButton = (name: string) =>
  click(
    [...document.body.querySelectorAll<HTMLElement>("button")].find(
      (element) => element.textContent?.trim() === name && (name !== "Nuevo" || !element.closest(".v-navigation-drawer")),
    )!,
  );

const clickDrawerButton = (name: string) =>
  click(inDrawer<HTMLElement>("button").find((element) => element.textContent?.trim() === name)!);

const choose = async (label: string, value: number) => {
  wrapper!
    .findAllComponents(VAutocomplete)
    .find((field) => field.props("label") === label && field.element.closest(".v-navigation-drawer--active"))!
    .vm.$emit("update:modelValue", value);
  await flushPromises();
};

const typeInto = async (label: string, value: string) => {
  const input = inDrawer(".v-text-field")
    .find((field) => field.querySelector("label")?.textContent?.trim() === label)!
    .querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

const sent = (path: string) =>
  httpMock.mock.calls.filter(([config]) => config.url.endsWith(path)).map(([config]) => config.data);

test("Nuevo saves an active multiplier with its cargo type id, even when listed ones have no container", async () => {
  await mountScreen([lclMultiplier]);

  await clickButton("Nuevo");
  await choose("Tipo de Carga (*)", LCL);
  await typeInto("Nombre (*)", "LCL Lima");
  await typeInto("Valor (*)", "0.35");
  await clickDrawerButton("Nuevo");

  expect(sent("nuevo_multiplicador")).toEqual([expect.objectContaining({ name: "LCL Lima", valor: "0.35", id_shipment: LCL, status: 1 })]);
});

test("Nuevo does not save without a cargo type", async () => {
  await mountScreen([]);

  await clickButton("Nuevo");
  await typeInto("Nombre (*)", "LCL Lima");
  await typeInto("Valor (*)", "0.35");
  await clickDrawerButton("Nuevo");

  expect(sent("nuevo_multiplicador")).toEqual([]);
});

test("Nuevo refuses a container another multiplier already uses", async () => {
  await mountScreen([{ ...lclMultiplier, id: 31, id_shipment: FCL, type_carga: "FCL", id_containers: CONTAINER }]);

  await clickButton("Nuevo");
  await choose("Tipo de Carga (*)", FCL);
  await choose("Contenedor Asociado", CONTAINER);
  await typeInto("Valor (*)", "0.35");
  await clickDrawerButton("Nuevo");

  expect(sent("nuevo_multiplicador")).toEqual([]);
  expect(vi.mocked(Swal.fire).mock.lastCall![0]).toMatchObject({ icon: "error" });
});

test("editing saves the new cargo type and container", async () => {
  await mountScreen([lclMultiplier]);

  await click(document.body.querySelector<HTMLElement>(".mdi-pencil")!);
  await choose("Tipo de Carga (*)", FCL);
  await choose("Contenedor Asociado", CONTAINER);
  await clickDrawerButton("Actualizar");

  expect(sent("actualizar_multiplicador")).toEqual([
    expect.objectContaining({ id: lclMultiplier.id, id_shipment: FCL, id_containers: CONTAINER, name: "20 Standard" }),
  ]);
});

test("turning Estado off while editing saves status 0 and keeps the name", async () => {
  await mountScreen([lclMultiplier]);

  await click(document.body.querySelector<HTMLElement>(".mdi-pencil")!);
  await click(inDrawer<HTMLInputElement>(".v-switch input")[0]!);
  await clickDrawerButton("Actualizar");

  expect(sent("actualizar_multiplicador")).toEqual([expect.objectContaining({ id: lclMultiplier.id, name: "LCL", status: 0 })]);
});

test("a saved multiplier closes the Nuevo panel, so it cannot be submitted twice", async () => {
  await mountScreen([lclMultiplier]);

  await clickButton("Nuevo");
  await choose("Tipo de Carga (*)", LCL);
  await typeInto("Nombre (*)", "LCL Lima");
  await typeInto("Valor (*)", "0.35");
  await clickDrawerButton("Nuevo");

  expect(inDrawer("button")).toEqual([]);
});
