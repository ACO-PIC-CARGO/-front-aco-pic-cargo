import { describe, expect, it } from "vitest";
import { priorityChipStyle } from "../priorityColor";

describe("priorityChipStyle", () => {
  it.each(["#FFFFFF", "#FFEB3B"])("uses dark text and a border on light %s", (color) => {
    expect(priorityChipStyle(color)).toEqual({ background: color, color: "#1f2937", border: "1px solid #9ca3af" });
  });

  it.each(["#E53935", "#43A047"])("uses white text and no border on dark %s", (color) => {
    expect(priorityChipStyle(color)).toEqual({ background: color, color: "#ffffff", border: "none" });
  });

  it("returns null without a color", () => {
    expect(priorityChipStyle(null)).toBeNull();
  });
});
