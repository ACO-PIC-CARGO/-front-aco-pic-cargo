import { expect, test } from "vitest";
import { nonNegativeAmount } from "@/components/Configuracion/Pricing/amountRule";

test.each([0, "0", 15, "15.5", " 7 ", ".5"])("accepts %p as an amount", (value) => {
  expect(nonNegativeAmount(value)).toBe(true);
});

test.each(["", null, undefined, -1, "-0.5", "abc"])("rejects %p with a message", (value) => {
  expect(nonNegativeAmount(value)).toEqual(expect.any(String));
});
