import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import HouseStepList from "@/components/HouseFile/HouseStepList.vue";
import HouseStepConfirmDialog from "@/components/HouseFile/HouseStepConfirmDialog.vue";
import HouseStepItem from "@/components/HouseFile/HouseStepItem.vue";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import type { HouseTrackingPhase, HouseTrackingStep } from "@/types/houseTracking";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), resolve: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const etd = (keptAt: string | null): HouseTrackingStep => ({
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
  quote_validity: { quote_id: 7092, valid_until: "2025-11-14", kept_by: keptAt && "Carlos Ramírez", kept_at: keptAt },
  state: "next",
  comments: [],
});
const phaseWith = (step: HouseTrackingStep): HouseTrackingPhase => ({
  id: 2,
  name: "Puerto de salida",
  icon: "mdi-ferry",
  sort_order: 2,
  status: "in_progress",
  completed_at: null,
  steps: [step],
});

test("the date modal always works on the latest tracking of the step it was opened for", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useHouseTrackingStore();
  store.phases = [phaseWith(etd(null))];
  const wrapper = mount(HouseStepList, {
    props: { houseId: 2830, loadError: "" },
    global: {
      plugins: [createVuetify({ components, directives }), pinia],
      stubs: { HouseStepItem: true, HouseStepConfirmDialog: true, HouseStepWeightCheckDialog: true, TrackingLinkButton: true },
    },
  });
  wrapper.findComponent(HouseStepItem).vm.$emit("confirm");
  await flushPromises();

  store.phases = [phaseWith(etd("2026-10-27T15:45:00Z"))];
  await flushPromises();

  expect(wrapper.findComponent(HouseStepConfirmDialog).props("step")?.quote_validity?.kept_at).toBe("2026-10-27T15:45:00Z");
});
