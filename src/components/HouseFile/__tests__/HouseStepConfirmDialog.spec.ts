import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import HouseStepConfirmDialog from "@/components/HouseFile/HouseStepConfirmDialog.vue";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import type { HouseTrackingStep } from "@/types/houseTracking";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { resolve: (path: string) => ({ href: `/#${path}` }), push: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const stepPastQuoteValidity: HouseTrackingStep = {
  id: 6,
  name: "ETD (Salida de origen)",
  icon: "mdi-ferry",
  number: 6,
  visible_to_client: true,
  confirmed_at: null,
  confirmed_by: null,
  sent_at: null,
  scheduled_at: null,
  validation: { code: "quote_validity", name: "Vigencia de cotización" },
  validation_result: null,
  validation_result_code: null,
  quote_validity: { quote_id: 7092, valid_until: "2025-11-14", kept_by: null, kept_at: null },
  state: "next",
  skipped: false,
  allows_skip: false,
  comments: [],
};
const QuoteValidityChoice = { name: "QuoteValidityDialog", template: "<div />", emits: ["skip", "kept"] };
let wrapper: VueWrapper | undefined;

afterEach(() => wrapper?.unmount());

test("skipping the quote validity warning confirms the step, as the user meant to", async () => {
  setActivePinia(createPinia());
  const confirm = vi.spyOn(useHouseTrackingStore(), "confirm").mockResolvedValue(null);
  wrapper = mount(HouseStepConfirmDialog, {
    props: { houseId: 2830, step: stepPastQuoteValidity, mode: "confirm", modelValue: false },
    global: { plugins: [createVuetify({ components, directives })], stubs: { QuoteValidityDialog: QuoteValidityChoice } },
    attachTo: document.body,
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();

  await (wrapper.vm as unknown as { submit(): Promise<void> }).submit();
  expect(confirm).not.toHaveBeenCalled();
  wrapper.findComponent({ name: "QuoteValidityDialog" }).vm.$emit("skip");
  await flushPromises();

  expect(confirm).toHaveBeenCalledWith(2830, 6, expect.any(String), undefined);
});
