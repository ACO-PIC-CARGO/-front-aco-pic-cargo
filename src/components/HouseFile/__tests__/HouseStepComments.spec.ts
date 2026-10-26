import { beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VForm, VSelect } from "vuetify/components";
import http from "@/api/http";
import HouseStepComments from "@/components/HouseFile/HouseStepComments.vue";
import type { HouseTrackingStep } from "@/types/houseTracking";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

interface RequestConfig {
  method: string;
  url: string;
  data?: unknown;
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;

const step: HouseTrackingStep = {
  id: 1,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  number: 1,
  visible_to_client: true,
  confirmed_at: null,
  confirmed_by: null,
  state: "next",
  comments: [],
};

const predefined = [{ id: 41, comment: "Documentos recibidos." }];

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockImplementation(async ({ method, url }) => ({
    data:
      method === "get" && url === "tracking_steps/1/comments"
        ? { estadoflag: true, mensaje: null, tipomensaje: null, data: predefined }
        : { estadoflag: true, mensaje: "Guardamos el comentario.", tipomensaje: "TMSGINF", data: [] },
  }));
});

async function openCommentForm() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(
    { render: () => h(VForm, { readonly: true }, () => h(HouseStepComments, { houseId: 1, step })) },
    { global: { plugins: [createVuetify({ components, directives }), pinia] } },
  );
  await wrapper.findAll("button").find((button) => button.text().includes("Agregar comentario"))!.trigger("click");
  await flushPromises();
  return wrapper;
}

test("comments stay writable inside the read-only house form", async () => {
  const wrapper = await openCommentForm();
  expect(wrapper.findComponent(VSelect).classes()).not.toContain("v-input--readonly");
  expect(wrapper.find('input[type="checkbox"]').attributes("readonly")).toBeUndefined();
  wrapper.unmount();
});

test("saving sends the predefined comment chosen for the step", async () => {
  const wrapper = await openCommentForm();
  await wrapper.findComponent(VSelect).setValue(41);
  await wrapper.findAll("button").find((button) => button.text().includes("Guardar"))!.trigger("submit");
  await flushPromises();
  const posted = httpMock.mock.calls.map(([config]) => config).find((config) => config.method === "post");
  expect(posted).toMatchObject({ url: "house_tracking/1/steps/1/comments", data: { step_comment_id: 41, is_public: false } });
  wrapper.unmount();
});
