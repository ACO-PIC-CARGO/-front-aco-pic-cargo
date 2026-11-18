import { describe, expect, test } from "vitest";
import { conditionsFromText, conditionsToText, isVisible, noticeFromResponse } from "../specialRateNotice";

const row = {
  active: true,
  title: "Tarifa Especial",
  intro: "Intro",
  conditions: ["A", "B"],
  side_text: "Lateral",
};

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
  test("shows only an active notice", () => {
    expect(isVisible(row)).toBe(true);
    expect(isVisible({ ...row, active: false })).toBe(false);
    expect(isVisible(null)).toBe(false);
  });
});
