import { describe, expect, test } from "vitest";
import { detailsToSave } from "@/utils/projections";

describe("projection details to save", () => {
  test("sends saved rows, also removed ones so they are deactivated, and new rows still on screen", () => {
    const rows = [
      { id: 1, estado: true },
      { id: 2, estado: false },
      { id: null, estado: true },
      { id: null, estado: false },
      { estado: false },
    ];

    expect(detailsToSave(rows)).toEqual([
      { id: 1, estado: true },
      { id: 2, estado: false },
      { id: null, estado: true },
    ]);
  });
});
