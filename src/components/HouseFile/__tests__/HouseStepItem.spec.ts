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

test("the switch of a confirmed step does not ask to confirm it again", async () => {
  const wrapper = mountStep({ ...blockedStep, state: "confirmed", confirmed_at: "2026-10-26T15:00:00Z" });
  await clickLikeABrowser(wrapper.find('input[type="checkbox"]').element as HTMLInputElement);
  expect(wrapper.emitted("confirm")).toBeUndefined();
  wrapper.unmount();
});
