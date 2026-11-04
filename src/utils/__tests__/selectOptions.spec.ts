import { expect, test } from "vitest";
import { chosenOptionTitle, withChosenOption } from "@/utils/selectOptions";

test("a chosen option shows its title", () => {
  expect(chosenOptionTitle({ raw: { id: 4, nombrecompleto: "ZURITA" }, title: "ZURITA" })).toBe("ZURITA");
});

test("a value whose option has not loaded shows nothing instead of the raw id", () => {
  expect(chosenOptionTitle({ raw: 4, title: "4" })).toBe("");
});

const statuses = [{ id: 1, name: "PRE COTIZACION" }];

test("a record's option missing from the active list is added with the record's own name", () => {
  expect(withChosenOption(statuses, 7, "APROBADA")).toEqual([...statuses, { id: 7, name: "APROBADA" }]);
});

test("the list stays as it is when the option is listed or the record has no name for it", () => {
  expect(withChosenOption(statuses, 1, "PRE COTIZACION")).toBe(statuses);
  expect(withChosenOption(statuses, 7, "")).toBe(statuses);
  expect(withChosenOption(statuses, "", "APROBADA")).toBe(statuses);
});
