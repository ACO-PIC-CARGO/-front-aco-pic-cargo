import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaContenedoresComponent from "@/components/FolderContainers/ListaContenedoresComponent.vue";
import { useContainersStore } from "@/stores/containers";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const viewedContainer = {
  id: 9,
  code: "40HC",
  name: "40 High Cube",
  description: "Alto",
  long: 12,
  width: 2.35,
  height: 2.69,
  maximumweight: 26,
  maximunvolumen: 76,
  status: 0,
};
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  httpMock.mockResolvedValue({ data: accepted([]) });
});

afterEach(() => wrapper?.unmount());

const mountScreen = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useContainersStore().record = viewedContainer;
  wrapper = mount(
    defineComponent({ components: { ListaContenedoresComponent }, template: "<v-app><ListaContenedoresComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === name)!;

const typeInto = async (label: string, value: string) => {
  const field = [...document.body.querySelectorAll(".v-text-field")].find(
    (element) => element.querySelector("label")?.textContent?.trim() === label && element.closest(".v-navigation-drawer--active"),
  )!;
  const input = field.querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

test("Nuevo starts an empty, active container even after viewing another one", { timeout: 15_000 }, async () => {
  await mountScreen();

  buttonNamed("Nuevo").click();
  await flushPromises();
  await typeInto("Nombre (*)", "Flat rack");
  for (const label of ["Largo (*)", "Ancho (*)", "Altura (*)", "Peso Máximo (*)", "Volumen Máximo (*)"]) {
    await typeInto(label, "1");
  }
  [...document.body.querySelectorAll<HTMLElement>(".v-navigation-drawer--active button")]
    .find((element) => element.textContent?.trim() === "Aceptar")!
    .click();
  await flushPromises();

  const saved = httpMock.mock.calls.find(([config]) => config.method === "post")![0];
  expect(saved.data).toMatchObject({ name: "Flat rack", status: 1 });
});

test("a saved container closes the Nuevo panel, so it cannot be submitted twice", { timeout: 15_000 }, async () => {
  await mountScreen();

  buttonNamed("Nuevo").click();
  await flushPromises();
  await typeInto("Nombre (*)", "Flat rack");
  for (const label of ["Largo (*)", "Ancho (*)", "Altura (*)", "Peso Máximo (*)", "Volumen Máximo (*)"]) {
    await typeInto(label, "1");
  }
  [...document.body.querySelectorAll<HTMLElement>(".v-navigation-drawer--active button")]
    .find((element) => element.textContent?.trim() === "Aceptar")!
    .click();
  await flushPromises();

  expect(document.body.querySelectorAll(".v-navigation-drawer--active")).toHaveLength(0);
});

test.each(["mdi-eye", "mdi-pencil"])(
  "clicking anywhere on a row's %s button opens its panel, not only on the icon",
  { timeout: 15_000 },
  async (icon) => {
    httpMock.mockResolvedValue({ data: accepted([viewedContainer]) });
    await mountScreen();

    document.body.querySelector(`tbody .${icon}`)!.closest("button")!.click();
    await flushPromises();

    expect(document.body.querySelectorAll(".v-navigation-drawer--active")).toHaveLength(1);
  },
);

test.each(["mdi-eye", "mdi-pencil", "Nuevo"])("opening %s does not ask the server for the list again", { timeout: 15_000 }, async (opener) => {
  httpMock.mockResolvedValue({ data: accepted([viewedContainer]) });
  await mountScreen();
  const listRequests = () => httpMock.mock.calls.filter(([config]) => /listar_containers|list_containers|containers_list/i.test(config.url)).length;
  const before = listRequests();

  const button = opener === "Nuevo" ? buttonNamed("Nuevo") : document.body.querySelector(`tbody .${opener}`)!.closest("button")!;
  button.click();
  await flushPromises();

  expect(listRequests()).toBe(before);
});
