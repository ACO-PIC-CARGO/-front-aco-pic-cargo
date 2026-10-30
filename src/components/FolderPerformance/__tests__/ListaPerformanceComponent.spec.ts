import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaPerformanceComponent from "@/components/FolderPerformance/ListaPerformanceComponent.vue";
import { usePerformanceStore } from "@/stores/performance";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const creditNote = { id: 5, code: "07", description: "NOTA DE CRÉDITO", status: 0, editableflag: true };
let wrapper: VueWrapper | undefined;

const savedTypes = () =>
  httpMock.mock.calls.map(([config]) => config).filter((config) => config.url.endsWith("insertar_performance"));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  httpMock.mockImplementation(async (config) => ({ data: accepted(config.method === "get" ? [creditNote] : []) }));
});

afterEach(() => wrapper?.unmount());

const mountScreen = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  usePerformanceStore().record = creditNote;
  wrapper = mount(
    defineComponent({ components: { ListaPerformanceComponent }, template: "<v-app><ListaPerformanceComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const buttonNamed = (name: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === name)!;
const openDrawers = () => document.body.querySelectorAll<HTMLElement>(".v-navigation-drawer--active");

const startNewType = async (description: string) => {
  await mountScreen();
  buttonNamed("Nuevo").click();
  await flushPromises();
  const input = openDrawers()[0]!.querySelector<HTMLInputElement>(".v-text-field input")!;
  input.value = description;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
  return buttonNamed("Aceptar", openDrawers()[0]!);
};

test("Nuevo starts an empty, active type even after viewing another one", { timeout: 15_000 }, async () => {
  (await startNewType("RECIBO QA")).click();
  await flushPromises();

  expect(savedTypes().map((config) => config.data)).toEqual([{ description: "RECIBO QA", status: 1 }]);
});

test("a double click on Aceptar saves the new type once and closes the panel", { timeout: 15_000 }, async () => {
  const accept = await startNewType("RECIBO QA");
  accept.click();
  accept.click();
  await flushPromises();

  expect(savedTypes()).toHaveLength(1);
  expect(openDrawers()).toHaveLength(0);
});

test("a description of only spaces is not sent", { timeout: 15_000 }, async () => {
  (await startNewType("   ")).click();
  await flushPromises();

  expect(savedTypes()).toHaveLength(0);
});
