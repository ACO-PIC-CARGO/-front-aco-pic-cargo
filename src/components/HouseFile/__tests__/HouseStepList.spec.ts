import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import Swal from "sweetalert2";
import type { SweetAlertResult } from "sweetalert2";
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

const mountList = (step: HouseTrackingStep) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useHouseTrackingStore();
  store.phases = [phaseWith(step)];
  const wrapper = mount(HouseStepList, {
    props: { houseId: 2830, loadError: "" },
    global: {
      plugins: [createVuetify({ components, directives }), pinia],
      stubs: { HouseStepItem: true, HouseStepConfirmDialog: true, HouseStepWeightCheckDialog: true, TrackingLinkButton: true },
    },
  });
  return { store, wrapper };
};

const confirmedEtd = (sentAt: string | null): HouseTrackingStep => ({
  ...etd(null),
  state: "confirmed",
  confirmed_at: "2026-10-26T15:00:00Z",
  sent_at: sentAt,
});

test("a step is unconfirmed only after the user accepts the question", async () => {
  const { store, wrapper } = mountList(confirmedEtd(null));
  const unconfirm = vi.spyOn(store, "unconfirm").mockResolvedValue(null);
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as SweetAlertResult);
  wrapper.findComponent(HouseStepItem).vm.$emit("unconfirm");
  await flushPromises();
  expect(unconfirm).not.toHaveBeenCalled();

  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as SweetAlertResult);
  wrapper.findComponent(HouseStepItem).vm.$emit("unconfirm");
  await flushPromises();
  expect(unconfirm).toHaveBeenCalledWith(2830, 6);
});

test("unconfirming a step the client already sees warns that it leaves the client tracking", async () => {
  const { store, wrapper } = mountList(confirmedEtd("2026-10-26T16:00:00Z"));
  vi.spyOn(store, "unconfirm").mockResolvedValue(null);
  vi.mocked(Swal.fire).mockClear().mockResolvedValueOnce({ isConfirmed: false } as SweetAlertResult);
  wrapper.findComponent(HouseStepItem).vm.$emit("unconfirm");
  await flushPromises();
  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ text: expect.stringContaining("tracking del cliente") });
});

test("the date modal always works on the latest tracking of the step it was opened for", async () => {
  const { store, wrapper } = mountList(etd(null));
  wrapper.findComponent(HouseStepItem).vm.$emit("confirm");
  await flushPromises();

  store.phases = [phaseWith(etd("2026-10-27T15:45:00Z"))];
  await flushPromises();

  expect(wrapper.findComponent(HouseStepConfirmDialog).props("step")?.quote_validity?.kept_at).toBe("2026-10-27T15:45:00Z");
});
