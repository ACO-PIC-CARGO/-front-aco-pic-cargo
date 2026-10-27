import { expect, test } from "vitest";
import { formatVolume, formatWeight, needsWeightCheck, quotedValue, weightCheckSummary } from "@/components/HouseFile/weightCheck";

test("weight shows up to two decimals and volume always two, with the unit after a space", () => {
  expect(formatWeight(300)).toBe("300 kg");
  expect(formatWeight(320.456)).toBe("320.46 kg");
  expect(formatWeight(12500)).toBe("12500 kg");
  expect(formatVolume(2)).toBe("2.00 m³");
  expect(formatWeight(null)).toBe("sin registrar");
  expect(formatVolume(null)).toBe("sin registrar");
});

test("the summary says what was confirmed and flags a difference from the quoted value", () => {
  expect(weightCheckSummary({ quoted_weight: 300, quoted_volume: 2, weight: 320, volume: 2 })).toEqual([
    { label: "Peso confirmado: 320 kg (cotizado: 300 kg)", changed: true },
    { label: "Volumen confirmado: 2.00 m³ (igual al cotizado)", changed: false },
  ]);
  expect(weightCheckSummary({ quoted_weight: null, quoted_volume: null, weight: 1, volume: 1 })[0]).toEqual({
    label: "Peso confirmado: 1 kg (cotizado: sin registrar)",
    changed: true,
  });
});

test("only the first confirmation of a step with the weight and volume validation asks for the check", () => {
  const step = { validation: { code: "weight_volume", name: "Peso y volumen" }, confirmed_at: null };
  expect(needsWeightCheck(step, "confirm")).toBe(true);
  expect(needsWeightCheck({ ...step, confirmed_at: "2026-10-20T15:00:00.000Z" }, "confirm")).toBe(false);
  expect(needsWeightCheck(step, "date")).toBe(false);
  expect(needsWeightCheck({ ...step, validation: null }, "confirm")).toBe(false);
});

test("a house weight or volume counts as quoted only when it is a number greater than 0", () => {
  expect(quotedValue("300")).toBe(300);
  expect(quotedValue(2.5)).toBe(2.5);
  expect(quotedValue(0)).toBeNull();
  expect(quotedValue("")).toBeNull();
  expect(quotedValue("abc")).toBeNull();
  expect(quotedValue(undefined)).toBeNull();
});
