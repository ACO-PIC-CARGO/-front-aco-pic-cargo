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
import FilterSubGasto from "@/components/filtros/FilterSubGasto.vue";
import FilterSubIngreso from "@/components/filtros/FilterSubIngreso.vue";
import { useGastosStore } from "@/stores/gastos";
import { useIngresosStore } from "@/stores/ingresos";
import { useSubgastoStore } from "@/stores/subgasto";
import { useSubingresoStore } from "@/stores/subingreso";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const FORMS = [
  { form: "Sub tipo de gasto", component: FilterSubGasto, kind: "gasto", parentKey: "id_gasto", useStore: useSubgastoStore, useParents: useGastosStore },
  { form: "Sub tipo de ingresos", component: FilterSubIngreso, kind: "ingreso", parentKey: "id_ingreso", useStore: useSubingresoStore, useParents: useIngresosStore },
];
let wrapper: VueWrapper | undefined;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const posts = () => httpMock.mock.calls.filter(([config]) => config.method === "post");
const clickAceptar = async () => {
  [...document.body.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === "Aceptar")!.click();
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

afterEach(() => wrapper?.unmount());

const mountInApp = (component: Component, pinia: ReturnType<typeof createPinia>, config = {}) =>
  mount(defineComponent({ components: { component }, template: "<v-app><component /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia], config },
    attachTo: document.body,
  });

describe.each(FORMS)("$form", ({ component, kind, parentKey, useStore, useParents }) => {
  const answerCodeCheck = (answer: unknown, delayMs = 0) =>
    httpMock.mockImplementation(async (config) => {
      if (config.url.endsWith(`validate_code_sub${kind}`)) {
        await wait(delayMs);
        return { data: answer };
      }
      return { data: accepted([]) };
    });

  const openNewSubType = async (code: string) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useParents().list = [{ id: 1, code: "T1", description: "Tipo", descripcion: "Tipo", status: true } as never];
    const store = useStore();
    store.tipo = "nuevo";
    store.drawer = true;
    store.model = { [parentKey]: 1, code, description: "Subtipo nuevo", status: true, calculoflag: true, mostrarflag: true };
    wrapper = mountInApp(component, pinia);
    await flushPromises();
    return store;
  };

  test("a code the company already uses stops the save, even when the check answers late", { timeout: 15_000 }, async () => {
    answerCodeCheck(rejected("Ya existe un subtipo con el código AB1."), 30);
    await openNewSubType("AB1");

    await clickAceptar();
    await wait(60);
    await flushPromises();

    expect(posts()).toEqual([]);
  });

  test("a saved sub type closes the panel, so it cannot be saved twice", { timeout: 15_000 }, async () => {
    answerCodeCheck(accepted([]));
    const store = await openNewSubType("AB1");

    await clickAceptar();

    expect(posts()).toHaveLength(1);
    expect(store.drawer).toBe(false);
  });

  test("opening the filter panel before any form raises no error", { timeout: 15_000 }, async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const errorHandler = vi.fn();
    wrapper = mountInApp(component, pinia, { errorHandler });
    await flushPromises();

    useStore().drawer = true;
    await flushPromises();

    expect(errorHandler).not.toHaveBeenCalled();
  });

  test("a code of exactly 5 characters is accepted", { timeout: 15_000 }, async () => {
    answerCodeCheck(accepted([]));
    await openNewSubType("ABCDE");

    await clickAceptar();

    expect(posts()[0]![0].data).toMatchObject({ code: "ABCDE" });
  });
});
