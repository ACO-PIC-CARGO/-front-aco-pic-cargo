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
