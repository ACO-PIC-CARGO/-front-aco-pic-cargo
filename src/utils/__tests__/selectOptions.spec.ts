import { expect, test } from "vitest";
import { chosenOptionTitle } from "@/utils/selectOptions";

test("a chosen option shows its title", () => {
  expect(chosenOptionTitle({ raw: { id: 4, nombrecompleto: "ZURITA" }, title: "ZURITA" })).toBe("ZURITA");
});

test("a value whose option has not loaded shows nothing instead of the raw id", () => {
  expect(chosenOptionTitle({ raw: 4, title: "4" })).toBe("");
});
