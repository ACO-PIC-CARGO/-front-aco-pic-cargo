import { describe, expect, it } from "vitest";
import { showsCallActions, showsReturnToSalesAction } from "../quoteListActions";

describe("showsCallActions", () => {
  it("shows the call buttons in Todas las cotizaciones", () => {
    expect(showsCallActions("")).toBe(true);
  });

  it.each(["pending_send", "pricing_requested"] as const)(
    "hides the call buttons in %s",
    (view) => {
      expect(showsCallActions(view)).toBe(false);
    },
  );
});

describe("showsReturnToSalesAction", () => {
  it("hides the return action in Todas las cotizaciones", () => {
    expect(showsReturnToSalesAction("")).toBe(false);
  });

  it.each(["pending_send", "pricing_requested"] as const)("shows the return action in %s", (view) => {
    expect(showsReturnToSalesAction(view)).toBe(true);
  });
});
