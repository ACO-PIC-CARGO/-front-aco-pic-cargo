import { beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VChip, VForm, VTextarea } from "vuetify/components";
import Swal from "sweetalert2";
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
  sent_at: null,
  scheduled_at: null,
  validation: null,
  validation_result: null,
  validation_result_code: null,
  quote_validity: null,
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

function mountComments(withStep = step) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(
    { render: () => h(VForm, { readonly: true }, () => h(HouseStepComments, { houseId: 1, step: withStep })) },
    { global: { plugins: [createVuetify({ components, directives }), pinia] } },
  );
}

async function openCommentForm() {
  const wrapper = mountComments();
  await wrapper.findAll("button").find((button) => button.text().includes("Agregar comentario"))!.trigger("click");
  await flushPromises();
  return wrapper;
}

const clickPredefined = (wrapper: Awaited<ReturnType<typeof openCommentForm>>, text: string) =>
  wrapper.findAllComponents(VChip).find((chip) => chip.text() === text)!.trigger("click");

test("comments stay writable inside the read-only house form", async () => {
  const wrapper = await openCommentForm();
  expect(wrapper.findComponent(VTextarea).classes()).not.toContain("v-input--readonly");
  wrapper.unmount();
});

test("clicking a predefined comment adds its text after what is already written", async () => {
  const wrapper = await openCommentForm();
  await wrapper.findComponent(VTextarea).find("textarea").setValue("Llegó el BL.");
  await clickPredefined(wrapper, "Documentos recibidos.");
  expect(wrapper.findComponent(VTextarea).find("textarea").element.value).toBe("Llegó el BL. Documentos recibidos.");
  wrapper.unmount();
});

test("saving sends the written comment for the step", async () => {
  const wrapper = await openCommentForm();
  await clickPredefined(wrapper, "Documentos recibidos.");
  await wrapper.findAll("button").find((button) => button.text().includes("Guardar"))!.trigger("submit");
  await flushPromises();
  const posted = httpMock.mock.calls.map(([config]) => config).find((config) => config.method === "post");
  expect(posted).toMatchObject({ url: "house_tracking/1/steps/1/comments" });
  expect(posted!.data).toStrictEqual({ comment: "Documentos recibidos." });
  wrapper.unmount();
});

test("a saved comment is deleted only after the user confirms", async () => {
  const saved = { id: 7, comment: "Documentos recibidos.", sent_at: null, author: "Ana", created_at: "2026-10-27T15:00:00Z" };
  const wrapper = mountComments({ ...step, comments: [saved] });
  const deleteRequests = () => httpMock.mock.calls.filter(([config]) => config.method === "delete");
  const clickDelete = async () => {
    await wrapper.find('button[aria-label="Eliminar comentario 1"]').trigger("click");
    await flushPromises();
  };

  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  await clickDelete();
  expect(deleteRequests()).toEqual([]);

  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as never);
  await clickDelete();
  expect(deleteRequests().map(([config]) => config.url)).toEqual(["house_tracking/1/comments/7"]);
  wrapper.unmount();
});
