import { describe, expect, test } from "vitest";
import {
  availabilityBaseDate,
  blankToNull,
  isEtaBeforeEtd,
  isMasterClosed,
  masterRowClass,
  mastersToMoveHouseTo,
} from "@/utils/masters";

describe("master form values", () => {
  test("an empty field is sent as null while zero and false are kept", () => {
    expect([blankToNull(""), blankToNull(undefined), blankToNull(null)]).toEqual([null, null, null]);
    expect([blankToNull(0), blankToNull(false), blankToNull("V1")]).toEqual([0, false, "V1"]);
  });

  test("an ETA earlier than the ETD is detected only when both dates are set", () => {
    expect(isEtaBeforeEtd("2026-03-15", "2026-03-01")).toBe(true);
    expect(isEtaBeforeEtd("2026-03-01", "2026-03-01")).toBe(false);
    expect(isEtaBeforeEtd("", "2026-03-01")).toBe(false);
    expect(isEtaBeforeEtd("2026-03-01", null)).toBe(false);
  });

  test("availability starts from the arrival in an import and from the departure in an export", () => {
    expect(availabilityBaseDate("I", "2026-03-01", "2026-03-15")).toBe("2026-03-15");
    expect(availabilityBaseDate("E", "2026-03-01", "2026-03-15")).toBe("2026-03-01");
    expect(availabilityBaseDate(undefined, "2026-03-01", "2026-03-15")).toBeNull();
  });
});

describe("master list", () => {
  test("a master closed operationally or administratively counts as closed", () => {
    expect(isMasterClosed({ statuslock: true, statuslockadm: false })).toBe(true);
    expect(isMasterClosed({ statuslock: 0, statuslockadm: 1 })).toBe(true);
    expect(isMasterClosed({ statuslock: false, statuslockadm: 0 })).toBe(false);
  });

  test("rows are shaded from the closing state the list returns", () => {
    expect(masterRowClass({ id: 1, status: 1, statuslock: true, statuslockadm: true })).toBe("rowRedMark");
    expect(masterRowClass({ id: 1, status: 1, statuslock: false, statuslockadm: true })).toBe("rowRed");
    expect(masterRowClass({ id: 1, status: 0, statuslock: true, statuslockadm: true })).toBe("rowNull");
    expect(masterRowClass({ id: 1, status: 1, statuslock: false, statuslockadm: false, background: "#ff9898" })).toBe("rowLlego");
    expect(masterRowClass({ id: 1, status: 1, statuslock: false, statuslockadm: false, background: "white" })).toBeUndefined();
  });

  test("a house can move only to another active, open master", () => {
    const masters = [
      { id: 1, status: 1, statuslock: false, statuslockadm: false },
      { id: 2, status: 1, statuslock: false, statuslockadm: false },
      { id: 3, status: 0, statuslock: false, statuslockadm: false },
      { id: 4, status: 1, statuslock: true, statuslockadm: false },
    ];

    expect(mastersToMoveHouseTo(masters, "1").map(({ id }) => id)).toEqual([2]);
  });
});
