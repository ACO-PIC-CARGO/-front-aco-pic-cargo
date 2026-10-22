import { expect, test, vi } from "vitest";
import { h } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VForm } from "vuetify/components";
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

test("comments stay writable inside the read-only house form", () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(
    { render: () => h(VForm, { readonly: true }, () => h(HouseStepComments, { houseId: 1, step })) },
    { global: { plugins: [createVuetify({ components, directives }), pinia] } },
  );
  expect(wrapper.find("textarea").attributes("readonly")).toBeUndefined();
  expect(wrapper.find('input[type="checkbox"]').attributes("readonly")).toBeUndefined();
  wrapper.unmount();
});
