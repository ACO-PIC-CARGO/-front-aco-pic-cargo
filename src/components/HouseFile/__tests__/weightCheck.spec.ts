import { expect, test } from "vitest";
import { formatVolume, formatWeight, weightCheckSummary } from "@/components/HouseFile/weightCheck";

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
