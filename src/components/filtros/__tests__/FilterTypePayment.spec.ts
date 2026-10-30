import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import FilterTypePayment from "@/components/filtros/FilterTypePayment.vue";
import { useTypepaymentStore } from "@/stores/typepayment";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

afterEach(() => wrapper?.unmount());

const saveNewTypeAnswered = async (saveAnswer: unknown) => {
  httpMock.mockImplementation(async (config) => ({ data: config.method === "post" ? saveAnswer : accepted([]) }));
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useTypepaymentStore();
  store.tipo = "nuevo";
  store.model = { id: "", code: "", name: "Transferencia QA", description: "", status: true };
  wrapper = mount(
    defineComponent({ components: { FilterTypePayment }, template: "<v-app><FilterTypePayment /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  store.drawer = true;
  await flushPromises();

  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Aceptar")!.click();
  await flushPromises();
  return store;
};

test("a saved payment type closes the panel", { timeout: 15_000 }, async () => {
  const store = await saveNewTypeAnswered(accepted([]));

  expect(store.drawer).toBe(false);
});

test("a refused payment type keeps the panel open", { timeout: 15_000 }, async () => {
  const store = await saveNewTypeAnswered(rejected("No pudimos guardar el tipo de pago.", undefined));

  expect(store.drawer).toBe(true);
});
