import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import axios from "@/api/http";
import HouseMasterDates from "@/components/HouseFile/HouseMasterDates.vue";

vi.mock("@/api/http", () => ({ default: vi.fn() }));

const mountDates = async (masterId: number | null) => {
  const wrapper = mount(HouseMasterDates, {
    props: { masterId },
    global: { plugins: [createVuetify({ components, directives })] },
  });
  await flushPromises();
  return wrapper;
};

test("the master's three dates and their confirmations show read-only, even while the house is edited", async () => {
  vi.mocked(axios).mockResolvedValueOnce({
    data: {
      data: [
        {
          fecha_etd: "2026-10-19",
          salidaflag: true,
          fecha_eta: "2026-11-18",
          llegadaflag: false,
          fecha_disponibilidad: null,
          disponibilidadflag: null,
        },
      ],
    },
  });
  const wrapper = await mountDates(2714);
  expect(vi.mocked(axios)).toHaveBeenCalledWith(expect.objectContaining({ url: "getMasterId/2714" }));
  const dates = wrapper.findAll('input[type="date"]').map((input) => (input.element as HTMLInputElement).value);
  expect(dates).toEqual(["2026-10-19", "2026-11-18", ""]);
  const confirmations = wrapper.findAll('input[type="checkbox"]').map((input) => (input.element as HTMLInputElement).checked);
  expect(confirmations).toEqual([true, false, false]);
  expect(wrapper.findAll(".v-input").every((field) => field.classes().includes("v-input--readonly"))).toBe(true);
  wrapper.unmount();
});

test("a house without a master asks for nothing", async () => {
  vi.mocked(axios).mockClear();
  const wrapper = await mountDates(null);
  expect(vi.mocked(axios)).not.toHaveBeenCalled();
  wrapper.unmount();
});

test("when the master cannot be read the panel says so and how to retry", async () => {
  vi.mocked(axios).mockRejectedValueOnce(new Error("Network Error"));
  const wrapper = await mountDates(2714);
  expect(wrapper.text()).toContain("No pudimos cargar las fechas del master. Recarga la página para intentarlo de nuevo.");
  wrapper.unmount();
});
