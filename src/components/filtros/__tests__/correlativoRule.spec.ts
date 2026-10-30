import { expect, test } from "vitest";
import { wholeCorrelativo } from "@/components/filtros/correlativoRule";

test.each(["", null, "125", "007"])("accepts %p as a correlativo filter", (value) => {
  expect(wholeCorrelativo(value)).toBe(true);
});

test.each(["1a", "1.5", "-3", "99999999999"])("rejects %p with a message", (value) => {
  expect(wholeCorrelativo(value)).toEqual(expect.any(String));
});
