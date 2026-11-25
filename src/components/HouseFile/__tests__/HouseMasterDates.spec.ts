import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import axios from "@/api/http";
import HouseMasterDates from "@/components/HouseFile/HouseMasterDates.vue";

vi.mock("@/api/http", () => ({ default: vi.fn() }));

const mountDates = async (masterId: number | null) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(HouseMasterDates, {
    props: { masterId },
    global: { plugins: [pinia, createVuetify({ components, directives })] },
    attachTo: document.body,
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
  const dates = wrapper.findAll('input[type="text"]').map((input) => (input.element as HTMLInputElement).value);
  expect(dates).toEqual(["19/OCT/2026", "18/NOV/2026", "—"]);
  const confirmations = wrapper.findAll(".confirmation-chip").map((chip) => ({
    label: chip.text(),
    confirmed: chip.classes().includes("confirmation-chip--on"),
    icon: chip.find(".mdi-check-circle").exists() ? "check" : "close",
  }));
  expect(confirmations).toEqual([
    { label: "Salida Confirmada", confirmed: true, icon: "check" },
    { label: "Llegada Confirmada", confirmed: false, icon: "close" },
    { label: "Confirmación Disponibilidad", confirmed: false, icon: "close" },
  ]);
  expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
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

test("each date opens its change history, newest first, with when and who changed it", async () => {
  vi.mocked(axios)
    .mockResolvedValueOnce({ data: { data: [{ fecha_etd: "2026-12-05", fecha_eta: "2026-12-09", fecha_disponibilidad: "2026-12-11" }] } })
    .mockResolvedValueOnce({
      data: {
        estadoflag: true,
        data: [
          { id: 2, campo: "fecha_etd", fecha: "2026-12-05", fecha_modificacion: "2026-11-24T16:42:00-05:00", responsable: "ALEXANDRA" },
          { id: 1, campo: "fecha_etd", fecha: "2026-12-03", fecha_modificacion: "2026-11-22T11:20:00-05:00", responsable: "SAMIRA" },
        ],
      },
    });
  const wrapper = await mountDates(2714);
  const links = wrapper.findAll("button").filter((button) => button.text() === "Ver historial");
  expect(links).toHaveLength(3);

  await links[0]!.trigger("click");
  await flushPromises();

  expect(vi.mocked(axios)).toHaveBeenLastCalledWith(
    expect.objectContaining({ url: "master_fechas_historial", params: { id_master: 2714, campo: "fecha_etd" } }),
  );
  const rows = [...document.querySelectorAll(".history-table tbody tr")].map((row) =>
    [...row.querySelectorAll("td")].map((cell) => cell.textContent!.trim()),
  );
  expect(document.body.textContent).toContain("Historial de Salida (ETD)");
  expect(rows.map((row) => [row[0], row[2]])).toEqual([
    ["05/DIC/2026", "ALEXANDRA"],
    ["03/DIC/2026", "SAMIRA"],
  ]);
  wrapper.unmount();
});
