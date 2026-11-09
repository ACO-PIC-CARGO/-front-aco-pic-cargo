import { describe, expect, test } from "vitest";
import { defineComponent, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { NO_FILTERS, filterParams, rangeError, useHistoryFilterForm } from "../quoteHistoryFilters";

const LCL_GROUP = { shipment_id: 3, group_flag: true, label: "LCL Grupal" };
const FCL = { shipment_id: 2, group_flag: null, label: "FCL" };

describe("rangeError", () => {
  test("a from value above the to value is refused", () => {
    expect(rangeError(500, 100, "peso")).toBe("El peso desde no puede ser mayor que el peso hasta.");
  });

  test("negative values are refused", () => {
    expect(rangeError(-1, null, "volumen")).toBe("El volumen no puede ser negativo.");
    expect(rangeError(null, -2, "peso")).toBe("El peso no puede ser negativo.");
  });

  test("open or ordered ranges are fine", () => {
    expect(rangeError(null, null, "peso")).toBeNull();
    expect(rangeError(100, 100, "peso")).toBeNull();
    expect(rangeError(0, null, "volumen")).toBeNull();
  });
});

describe("filterParams", () => {
  test("sends only the chosen filters, splitting the modality into shipment and group", () => {
    expect(filterParams(NO_FILTERS)).toEqual({});
    expect(filterParams({ ...NO_FILTERS, modality: LCL_GROUP, weight_from: 0, status_id: 7 })).toEqual({
      shipment_id: 3,
      group_flag: true,
      weight_from: 0,
      status_id: 7,
    });
    expect(filterParams({ ...NO_FILTERS, modality: FCL })).toEqual({ shipment_id: 2 });
  });
});

describe("useHistoryFilterForm", () => {
  function mountForm(initialClient: number | null = 41) {
    const clientId = ref<number | null>(initialClient);
    let form!: ReturnType<typeof useHistoryFilterForm>;
    mount(defineComponent({ setup() { form = useHistoryFilterForm(clientId); return () => null; } }));
    return { clientId, form };
  }

  test("valid fields are applied as numbers and ids", async () => {
    const { form } = mountForm();

    form.form.value.weight_from = "100";
    form.form.value.status_id = 7;
    await nextTick();

    expect(form.applied.value).toEqual({ ...NO_FILTERS, weight_from: 100, status_id: 7 });
    expect(form.active.value).toBe(true);
  });

  test("an invalid range keeps the last valid filters and shows why", async () => {
    const { form } = mountForm();
    form.form.value.weight_from = "100";
    await nextTick();

    form.form.value.weight_to = "50";
    await nextTick();

    expect(form.weightError.value).toBe("El peso desde no puede ser mayor que el peso hasta.");
    expect(form.applied.value).toEqual({ ...NO_FILTERS, weight_from: 100 });
  });

  test("choosing another client clears every filter", async () => {
    const { clientId, form } = mountForm();
    form.form.value.port_end_id = 9;
    form.form.value.volume_to = "3";
    await nextTick();

    clientId.value = 42;
    await nextTick();
    await nextTick();

    expect(form.applied.value).toEqual(NO_FILTERS);
    expect(form.active.value).toBe(false);
  });

  test("Limpiar filtros removes them all", async () => {
    const { form } = mountForm();
    form.form.value.transport_id = 1;
    await nextTick();

    form.clear();
    await nextTick();

    expect(form.applied.value).toEqual(NO_FILTERS);
  });
});
