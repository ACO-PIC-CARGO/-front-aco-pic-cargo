import { expect, test, vi } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import HouseStepItem from "@/components/HouseFile/HouseStepItem.vue";
import type { HouseTrackingStep } from "@/types/houseTracking";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const blockedStep: HouseTrackingStep = {
  id: 2,
  name: "Mercancía lista para envío",
  icon: "mdi-package-variant-closed",
  number: 2,
  visible_to_client: true,
  confirmed_at: null,
  confirmed_by: null,
  sent_at: null,
  scheduled_at: null,
  validation: null,
  validation_result: null,
  validation_result_code: null,
  quote_validity: null,
  state: "blocked",
  comments: [],
};

test("a blocked step tells keyboard and screen reader users which step comes first", () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(HouseStepItem, {
    props: { houseId: 1, step: blockedStep, blockedBy: "Pago al proveedor" },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  expect(wrapper.find('input[type="checkbox"]').attributes("aria-label")).toContain(
    "Primero confirma «Pago al proveedor»",
  );
  wrapper.unmount();
});

// jsdom toggles a checkbox on click but never fires "input"; a browser fires it unless the click was cancelled.
async function clickLikeABrowser(input: HTMLInputElement) {
  const notCancelled = input.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  if (notCancelled) input.dispatchEvent(new Event("input", { bubbles: true }));
  await nextTick();
}

function mountStep(step: HouseTrackingStep) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(HouseStepItem, {
    props: { houseId: 1, step, blockedBy: null },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
}

test("every click on the switch of the next step asks to confirm it, even after cancelling", async () => {
  const wrapper = mountStep({ ...blockedStep, state: "next" });
  const toggle = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;
  await clickLikeABrowser(toggle);
  await clickLikeABrowser(toggle);
  expect(wrapper.emitted("confirm")).toHaveLength(2);
  expect(toggle.checked).toBe(false);
  wrapper.unmount();
});

test("the switch of a confirmed step asks to unconfirm it and stays on until that happens", async () => {
  const wrapper = mountStep({ ...blockedStep, state: "confirmed", confirmed_at: "2026-10-26T15:00:00Z" });
  const toggle = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;
  await clickLikeABrowser(toggle);
  expect(wrapper.emitted("unconfirm")).toHaveLength(1);
  expect(wrapper.emitted("confirm")).toBeUndefined();
  expect(toggle.checked).toBe(true);
  wrapper.unmount();
});

test("a step with comments starts collapsed and a click on its row opens and closes them", async () => {
  const comment = { id: 7, comment: "Documentos recibidos.", sent_at: null, author: "Ana", created_at: "2026-10-27T15:00:00Z" };
  const wrapper = mountStep({ ...blockedStep, state: "next", comments: [comment] });
  const commentsShown = () => wrapper.text().includes("Documentos recibidos.");
  const clickRow = async () => {
    await wrapper.findAll("span").find((span) => span.text() === blockedStep.name)!.trigger("click");
    await nextTick();
  };
  expect(commentsShown()).toBe(false);
  await clickRow();
  expect(commentsShown()).toBe(true);
  await clickRow();
  expect(commentsShown()).toBe(false);
  wrapper.unmount();
});

test("the controls of a step row do their own action without opening its comments", async () => {
  const wrapper = mountStep({ ...blockedStep, state: "next" });
  await wrapper.find('button[aria-label="Poner fecha a Mercancía lista para envío"]').trigger("click");
  await nextTick();
  expect(wrapper.emitted("edit-date")).toHaveLength(1);
  expect(wrapper.text()).not.toContain("Aún no hay comentarios en este paso.");
  wrapper.unmount();
});
