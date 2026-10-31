import { describe, expect, test } from "vitest";
import { depositMatches } from "@/utils/bankDeposit";

describe("depositMatches", () => {
  test("the deposit equals the payments plus the bank commission, whatever their text form", () => {
    expect(depositMatches(["100.10", 0.2], "1.5", "101.80")).toBe(true);
    expect(depositMatches([0.1, 0.2], 0, 0.3)).toBe(true);
  });

  test("a deposit that leaves out the commission or differs by a cent does not match", () => {
    expect(depositMatches([100], 2, 100)).toBe(false);
    expect(depositMatches([100], 0, 100.01)).toBe(false);
  });

  test("blank amounts count as zero", () => {
    expect(depositMatches(["", null], "", 0)).toBe(true);
  });
});
