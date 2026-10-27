import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import http from "@/api/http";
import TrackingStepDialog from "@/components/TrackingCatalog/TrackingStepDialog.vue";
import { useTrackingCatalogStore } from "@/stores/trackingCatalog";
import type { TrackingPhase, TrackingStep } from "@/types/trackingCatalog";

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

interface RequestConfig {
  method: string;
  url: string;
  data?: Record<string, unknown>;
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;
const step: TrackingStep = {
  id: 5,
  name: "Confirmo de ingreso en almacén de origen",
  icon: "mdi-warehouse",
  sort_order: 1,
  number: 5,
  visible_to_client: true,
  active: true,
  validation_id: 1,
};
const phase: TrackingPhase = {
  id: 7,
  name: "Puerto de salida",
  icon: "mdi-ferry",
  sort_order: 1,
  active: true,
  first_step_number: 5,
  last_step_number: 5,
  steps: [step],
};
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockImplementation(async () => ({
    data: { estadoflag: true, mensaje: "Guardamos el paso.", tipomensaje: "TMSGINF", data: [phase] },
  }));
});

afterEach(() => wrapper?.unmount());

const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button, .v-list-item")].find(
    (element) => element.textContent?.trim() === name,
  )!;

test("choosing «Sin validación» removes the step's validation when saving", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useTrackingCatalogStore();
  store.phases = [phase];
  store.validations = [{ id: 1, code: "weight_volume", name: "Peso y volumen" }];
  wrapper = mount(TrackingStepDialog, {
    props: { step, phaseId: 7, modelValue: false },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();

  const field = [...document.body.querySelectorAll(".v-select")].find((element) =>
    element.textContent?.includes("Validar antes de confirmar"),
  )!;
  field.querySelector(".v-field")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  await flushPromises();
  buttonNamed("Sin validación").click();
  await flushPromises();
  buttonNamed("Guardar cambios").click();
  await flushPromises();

  const saved = httpMock.mock.calls.find(([config]) => config.method === "put")![0];
  expect(saved.data).toMatchObject({ validation_id: null });
});
