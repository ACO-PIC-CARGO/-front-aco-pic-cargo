import { expect, test } from "vitest";
import { isSelectedPortTitle } from "@/utils/ports";

const ports = [
  { id_port: 1, name: "ARGENTINA-ALMIRANTE BROWN" },
  { id_port: 2, name: "ARGENTINA-BAHIA BLANCA" },
];

test("the field showing the selected port's name is not a new search", () => {
  expect(isSelectedPortTitle(ports, 1, "ARGENTINA-ALMIRANTE BROWN")).toBe(true);
  expect(isSelectedPortTitle(ports, "1", "ARGENTINA-ALMIRANTE BROWN")).toBe(true);
});

test("any other text is a search, even another port's name or a name typed with nothing selected", () => {
  expect(isSelectedPortTitle(ports, 1, "ARGENTINA-ALM")).toBe(false);
  expect(isSelectedPortTitle(ports, 1, "ARGENTINA-BAHIA BLANCA")).toBe(false);
  expect(isSelectedPortTitle(ports, null, "ARGENTINA-ALMIRANTE BROWN")).toBe(false);
});
