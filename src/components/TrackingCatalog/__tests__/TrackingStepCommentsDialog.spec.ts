import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import Swal from "sweetalert2";
import http from "@/api/http";
import TrackingStepCommentsDialog from "@/components/TrackingCatalog/TrackingStepCommentsDialog.vue";
import type { TrackingStep } from "@/types/trackingCatalog";

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
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;
const step: TrackingStep = {
  id: 5,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  sort_order: 1,
  number: 1,
  visible_to_client: true,
  active: true,
};
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockImplementation(async ({ method }) => ({
    data:
      method === "get"
        ? { estadoflag: true, mensaje: null, tipomensaje: null, data: [{ id: 1, comment: "Documentos recibidos." }] }
        : { estadoflag: true, mensaje: "Eliminamos el comentario predefinido.", tipomensaje: "TMSGINF", data: [] },
  }));
});

afterEach(() => wrapper?.unmount());

const deleteRequests = () => httpMock.mock.calls.filter(([config]) => config.method === "delete");

async function clickDelete() {
  const button = document.body.querySelector<HTMLButtonElement>('button[aria-label="Eliminar comentario 1"]')!;
  button.click();
  await flushPromises();
}

test("a predefined comment is deleted only after the user confirms", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(TrackingStepCommentsDialog, {
    props: { step, modelValue: false },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();

  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  await clickDelete();
  expect(deleteRequests()).toEqual([]);

  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as never);
  await clickDelete();
  expect(deleteRequests().map(([config]) => config.url)).toEqual(["tracking_step_comments/1"]);
});
