import { expect, test, vi } from "vitest";
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
