import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import FlujoOperacionPorMes from "@/components/balances/FlujoOperacionPorMes.vue";
import { useAppStore } from "@/stores/app";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: {} } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

const answerCashFlowWith = (cashFlow: unknown) =>
  httpMock.mockImplementation(async (config) => ({
    data: config.url.includes("flujo_dinero_por_mes") ? cashFlow : accepted([]),
  }));

const mountScreen = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const errorHandler = vi.fn();
  wrapper = mount(
    defineComponent({ components: { FlujoOperacionPorMes }, template: "<v-app><FlujoOperacionPorMes /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia], config: { errorHandler } }, attachTo: document.body },
  );
  await flushPromises();
  return errorHandler;
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

afterEach(() => wrapper?.unmount());

test("finishes loading without breaking when the cash flow comes back empty", async () => {
  answerCashFlowWith(rejected());

  const errorHandler = await mountScreen();

  expect(errorHandler).not.toHaveBeenCalled();
  expect(useAppStore().spiner).toBe(false);
});

test("finishes loading without breaking when the cash flow is refused", async () => {
  answerCashFlowWith({ ...rejected("Escribe solo el número del expediente."), tipomensaje: "TMSGADV" });

  const errorHandler = await mountScreen();

  expect(errorHandler).not.toHaveBeenCalled();
  expect(useAppStore().spiner).toBe(false);
  expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Escribe solo el número del expediente." });
});
