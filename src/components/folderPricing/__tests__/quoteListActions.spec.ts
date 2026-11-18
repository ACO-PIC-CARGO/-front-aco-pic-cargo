import { describe, expect, it } from "vitest";
import { showsCallActions } from "../quoteListActions";

describe("showsCallActions", () => {
  it("shows the call buttons in Todas las cotizaciones", () => {
    expect(showsCallActions("")).toBe(true);
  });

  it.each(["pending_send", "sent_to_client", "returned"] as const)(
    "hides the call buttons in %s",
    (view) => {
      expect(showsCallActions(view)).toBe(false);
    },
  );
});
