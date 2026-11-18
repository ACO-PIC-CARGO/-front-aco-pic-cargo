import { describe, expect, it } from "vitest";
import { needsStatusChoice } from "../needsStatusChoice";

describe("needsStatusChoice", () => {
  it.each([
    [0, false],
    [1, false],
    [2, true],
    [5, true],
  ])("with %i flagged statuses returns %s", (count, expected) => {
    const statuses = Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Status ${index + 1}` }));
    expect(needsStatusChoice(statuses)).toBe(expected);
  });
});
