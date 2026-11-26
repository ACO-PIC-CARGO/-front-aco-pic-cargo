import { expect, test } from "vitest";
import { montoOpMoneda } from "@/utils/montoMoneda";

test("en USD el monto es el Op", () => {
  expect(montoOpMoneda({ total_op: 28.57, totalopcuentabanco: 28.57, acronym: "USD" })).toBe(28.57);
  expect(montoOpMoneda({ total_op: "50", acronym: null })).toBe(50);
});

test("en otra moneda el monto es el de la cuenta del banco, no el equivalente en USD", () => {
  expect(montoOpMoneda({ total_op: 28.57, totalopcuentabanco: 100, acronym: "PEN" })).toBe(100);
  expect(montoOpMoneda({ total_op: 28.57, totalopcuentabanco: "100.0000", symbol: "S/." })).toBe(100);
  // sin monto en la cuenta: el Op
  expect(montoOpMoneda({ total_op: 28.57, totalopcuentabanco: null, acronym: "PEN" })).toBe(28.57);
});
