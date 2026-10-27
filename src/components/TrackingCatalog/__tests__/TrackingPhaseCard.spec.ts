import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import http from "@/api/http";
import TrackingPhaseCard from "@/components/TrackingCatalog/TrackingPhaseCard.vue";
import type { TrackingPhase } from "@/types/trackingCatalog";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const httpMock = http as unknown as Mock<(config: { method: string; url: string }) => Promise<{ data: unknown }>>;
const phase: TrackingPhase = {
  id: 1,
  name: "Origen",
  icon: "mdi-airplane",
  sort_order: 1,
  active: true,
  first_step_number: 1,
  last_step_number: 1,
  steps: [
    {
      id: 5,
      name: "Pago al proveedor",
      icon: "mdi-currency-usd",
      sort_order: 1,
      number: 1,
      visible_to_client: true,
      active: true,
      validation_id: null,
    },
  ],
};
let wrapper: VueWrapper;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockResolvedValue({
    data: { estadoflag: true, mensaje: null, tipomensaje: null, data: [{ id: 1, comment: "Documentos recibidos." }] },
  });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(TrackingPhaseCard, {
    props: { phase, isFirst: true, isLast: true },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
});

afterEach(() => wrapper.unmount());

const commentsShown = () => wrapper.text().includes("Documentos recibidos.");

async function clickStep() {
  await wrapper.findAll("span").find((span) => span.text() === "Pago al proveedor")!.trigger("click");
  await flushPromises();
}

test("clicking a step shows its predefined comments and clicking it again hides them", async () => {
  expect(commentsShown()).toBe(false);

  await clickStep();
  expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({ method: "get", url: "tracking_steps/5/comments" }));
  expect(commentsShown()).toBe(true);

  await clickStep();
  expect(commentsShown()).toBe(false);
});

test("the step buttons do their own action without opening or closing its comments", async () => {
  await wrapper.find('button[aria-label="Editar paso Pago al proveedor"]').trigger("click");
  await flushPromises();

  expect(wrapper.emitted("edit-step")).toHaveLength(1);
  expect(commentsShown()).toBe(false);
});
