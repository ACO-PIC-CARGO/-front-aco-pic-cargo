import { expect, test } from "vitest";
import { currentPriorityOf, priorityOptions } from "../quotePriorityField";

const detail = (fields = {}) => ({
  estadoflag: true,
  mensaje: "",
  tipomensaje: "",
  data: [{ id_quote_priority: "7", priority_name: "Urgente", priority_color: "#ff0000", dangerous_goods: null, ...fields }],
});

test("reads the stored priority and turns the bigint string into a number", () => {
  expect(currentPriorityOf(detail())).toEqual({ id: 7, name: "Urgente", color_all: "#ff0000" });
});

test("a quote without priority, a failed load or a missing row means no priority", () => {
  expect(currentPriorityOf(detail({ id_quote_priority: null, priority_name: null, priority_color: null }))).toBeNull();
  expect(currentPriorityOf({ estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [] })).toBeNull();
  expect(currentPriorityOf({ estadoflag: true, mensaje: "", tipomensaje: "", data: [] })).toBeNull();
});

test("keeps the active options and appends a current priority that was deactivated", () => {
  const active = [{ id: 1, name: "Normal", color_all: "#00ff00" }];
  expect(priorityOptions(active, { id: 7, name: "Urgente", color_all: "#ff0000" }).map((o) => o.id)).toEqual([1, 7]);
});

test("does not repeat a current priority that is already active, nor add one when there is none", () => {
  const active = [{ id: 1, name: "Normal", color_all: "#00ff00" }];
  expect(priorityOptions(active, { id: 1, name: "Normal", color_all: "#00ff00" })).toEqual(active);
  expect(priorityOptions(active, null)).toEqual(active);
});
