import { describe, expect, test } from "vitest";
import { conditionsFromText, conditionsToText, isVisible, noticeFromResponse, visibilityConditionsToSave } from "../specialRateNotice";
import type { VisibilityCondition } from "../specialRateNotice";

const DEFAULT_VISIBILITY: VisibilityCondition[] = [
  { metric: "weight_per_package", comparison: "greater_than", value: 2500 },
  { metric: "total_volume", comparison: "greater_than", value: 15 },
  { metric: "total_weight", comparison: "greater_than", value: 6000 },
];

const row = {
  active: true,
  title: "Tarifa Especial",
  intro: "Intro",
  conditions: ["A", "B"],
  side_text: "Lateral",
  visibility_conditions: DEFAULT_VISIBILITY,
};

const cargo = (packages: unknown, weight: unknown, volume: unknown) => ({ packages, weight, volume });

describe("noticeFromResponse", () => {
  test("reads the notice from the first data row", () => {
    expect(noticeFromResponse({ estadoflag: true, mensaje: "", tipomensaje: "", data: [row] })).toEqual(row);
  });

  test("returns null when the call failed or has no rows", () => {
    expect(noticeFromResponse({ estadoflag: false, mensaje: "x", tipomensaje: "TMSGERR", data: [] })).toBeNull();
    expect(noticeFromResponse({ estadoflag: true, mensaje: "", tipomensaje: "", data: [] })).toBeNull();
  });

  test("drops non-string conditions", () => {
    const dirty = { ...row, conditions: ["A", null, 3] };
    expect(noticeFromResponse({ estadoflag: true, mensaje: "", tipomensaje: "", data: [dirty] })?.conditions).toEqual(["A"]);
  });

  test("keeps only well-formed visibility conditions", () => {
    const dirty = {
      ...row,
      visibility_conditions: [
        { metric: "total_volume", comparison: "less_than", value: 1.5 },
        { metric: "height", comparison: "greater_than", value: 1 },
        { metric: "total_weight", comparison: "equal", value: 1 },
        { metric: "total_weight", comparison: "greater_than", value: "x" },
        null,
      ],
    };
    expect(noticeFromResponse({ estadoflag: true, mensaje: "", tipomensaje: "", data: [dirty] })?.visibility_conditions).toEqual([
      { metric: "total_volume", comparison: "less_than", value: 1.5 },
    ]);
  });
});

describe("visibilityConditionsToSave", () => {
  test("sends typed values as numbers and an empty value as missing, so the server can refuse it", () => {
    expect(
      visibilityConditionsToSave([
        { metric: "total_weight", comparison: "greater_than", value: "6000" },
        { metric: "total_volume", comparison: "less_than", value: "" },
      ]),
    ).toEqual([
      { metric: "total_weight", comparison: "greater_than", value: 6000 },
      { metric: "total_volume", comparison: "less_than", value: null },
    ]);
  });
});

describe("conditionsFromText", () => {
  test("splits lines, trims and drops blanks", () => {
    expect(conditionsFromText(" A \n\n B\r\n   \n")).toEqual(["A", "B"]);
  });
});

describe("conditionsToText", () => {
  test("joins one condition per line", () => {
    expect(conditionsToText(["A", "B"])).toBe("A\nB");
  });
});

describe("isVisible", () => {
  test("shows the notice when any of its conditions is met", () => {
    expect(isVisible(row, cargo(2, 7000, 1))).toBe(true);
    expect(isVisible(row, cargo(30, 6500, 1))).toBe(true);
    expect(isVisible(row, cargo(1, 100, 16))).toBe(true);
  });

  test("hides it when no condition is met, when it is inactive or when it has no conditions", () => {
    expect(isVisible(row, cargo(10, 5000, 15))).toBe(false);
    expect(isVisible({ ...row, active: false }, cargo(2, 7000, 1))).toBe(false);
    expect(isVisible({ ...row, visibility_conditions: [] }, cargo(2, 7000, 20))).toBe(false);
    expect(isVisible(null, cargo(2, 7000, 20))).toBe(false);
  });

  test("a less-than condition shows it below the value", () => {
    const small = { ...row, visibility_conditions: [{ metric: "total_volume", comparison: "less_than", value: 2 } as const] };

    expect(isVisible(small, cargo(1, 10, 1.5))).toBe(true);
    expect(isVisible(small, cargo(1, 10, 2))).toBe(false);
  });

  test("a condition whose cargo data is missing does not count", () => {
    const small = { ...row, visibility_conditions: [{ metric: "total_volume", comparison: "less_than", value: 2 } as const] };

    const perPackage = { ...row, visibility_conditions: [{ metric: "weight_per_package", comparison: "greater_than", value: 2500 } as const] };

    expect(isVisible(small, cargo(1, 10, ""))).toBe(false);
    expect(isVisible(perPackage, cargo(0, 7000, 1))).toBe(false);
    expect(isVisible(row, cargo(null, null, null))).toBe(false);
  });

  test("reads the numbers the cargo form keeps as text", () => {
    expect(isVisible(row, cargo("2", "7000", "1"))).toBe(true);
  });
});
