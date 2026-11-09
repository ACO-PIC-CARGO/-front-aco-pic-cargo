import { expect, test } from "vitest";
import { isDateOnlyHouseNotice } from "../houseNoticeDate";

test("the departure notice uses a date without a time", () => {
  expect(isDateOnlyHouseNotice({ descripcion: "Aviso de Salida" })).toBe(true);
  expect(isDateOnlyHouseNotice({ descripcion: "aviso de salida" })).toBe(true);
  expect(isDateOnlyHouseNotice({ descripcion: "Actualización de Salida" })).toBe(false);
  expect(isDateOnlyHouseNotice({ descripcion: "Aviso de Llegada" })).toBe(false);
});
