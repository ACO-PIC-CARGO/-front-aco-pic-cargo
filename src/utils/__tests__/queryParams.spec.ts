import { expect, test } from "vitest";
import { filledParams } from "@/utils/queryParams";

test("drops the filters the user left empty, cleared with the X or set to Todos", () => {
  expect(filledParams({ name: "", description: null, id_pais: undefined, status: "null", code: "LI" })).toEqual({ code: "LI" });
});

test("keeps zero and inactive filters", () => {
  expect(filledParams({ status: "0", id_transporte: 0 })).toEqual({ status: "0", id_transporte: 0 });
});
