import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaGastosComponent from "@/components/FolderGasto/ListaGastosComponent.vue";
import ListaIngresosComponent from "@/components/FolderIngresos/ListaIngresosComponent.vue";
import { useGastosStore } from "@/stores/gastos";
import { useIngresosStore } from "@/stores/ingresos";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const viewedInactiveType = { id: 9, code: "VIEJO", description: "Visto antes", calculoflag: false, status: false };
const SCREENS = [
  { screen: "Tipos de gastos", component: ListaGastosComponent, useStore: useGastosStore, kind: "gasto" },
  { screen: "Tipos de ingresos", component: ListaIngresosComponent, useStore: useIngresosStore, kind: "ingreso" },
];
let wrapper: VueWrapper | undefined;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const buttonNamed = (name: string, within = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === name)!;
const openDrawer = () => document.body.querySelector<HTMLElement>(".v-navigation-drawer--active")!;
const posts = () => httpMock.mock.calls.filter(([config]) => config.method === "post");

const typeInto = async (label: string, value: string) => {
  const field = [...openDrawer().querySelectorAll(".v-text-field")].find(
    (element) => element.querySelector("label")?.textContent?.trim() === label,
  )!;
  const input = field.querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

afterEach(() => wrapper?.unmount());

describe.each(SCREENS)("$screen", ({ component, useStore, kind }) => {
  const answerCodeCheck = (answer: unknown, delayMs = 0) =>
    httpMock.mockImplementation(async (config) => {
      if (config.url.includes(`validar_nuevo_codigo_${kind}`)) {
        await wait(delayMs);
        return { data: answer };
      }
      return { data: accepted([]) };
    });

  const mountScreen = async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useStore().record = viewedInactiveType;
    wrapper = mount(defineComponent({ components: { component }, template: "<v-app><component /></v-app>" }), {
      global: { plugins: [createVuetify({ components, directives }), pinia] },
      attachTo: document.body,
    });
    await flushPromises();
  };

  const submitNewType = async () => {
    buttonNamed("Nuevo").click();
    await flushPromises();
    await typeInto("Código (*)", "NUEVO");
    await typeInto("Descripción (*)", "Tipo nuevo");
    buttonNamed("Aceptar", openDrawer()).click();
    await flushPromises();
  };

  test("Nuevo starts an empty, active type even after viewing an inactive one", { timeout: 15_000 }, async () => {
    answerCodeCheck(accepted([]));
    await mountScreen();

    await submitNewType();

    expect(posts()[0]![0].data).toEqual({ code: "NUEVO", description: "Tipo nuevo", calculoflag: true, status: true });
  });

  test("a code the company already uses stops the save, even when the check answers late", { timeout: 15_000 }, async () => {
    answerCodeCheck(rejected("Ya existe un tipo con el código NUEVO."), 30);
    await mountScreen();

    await submitNewType();
    await wait(60);
    await flushPromises();

    expect(posts()).toEqual([]);
  });

  test("a saved type closes the Nuevo panel, so it cannot be saved twice", { timeout: 15_000 }, async () => {
    answerCodeCheck(accepted([]));
    await mountScreen();

    await submitNewType();

    expect(posts()).toHaveLength(1);
    expect(document.body.querySelectorAll(".v-navigation-drawer--active")).toHaveLength(0);
  });
});
