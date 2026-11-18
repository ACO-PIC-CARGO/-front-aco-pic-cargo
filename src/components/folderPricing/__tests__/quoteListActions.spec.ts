import { describe, expect, it } from "vitest";
import { lastCommentParts, lastCommentPillStyle, lastCommentText, showsCallActions, showsInternalThread, showsReturnToSalesAction, withLastMessage } from "../quoteListActions";

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

describe("showsInternalThread", () => {
  it("keeps the call details in Todas las cotizaciones", () => {
    expect(showsInternalThread("")).toBe(false);
  });

  it.each(["pending_send", "pricing_requested"] as const)("shows the thread in %s", (view) => {
    expect(showsInternalThread(view)).toBe(true);
  });
});

describe("lastCommentText", () => {
  it("prefixes the comment with who it came from", () => {
    expect(lastCommentText("sales_to_pricing", "Revisar flete")).toBe("De Ventas para Pricing: Revisar flete");
    expect(lastCommentText("pricing_to_sales", "Listo")).toBe("De Pricing para Ventas: Listo");
  });

  it("is empty when the quote has no messages", () => {
    expect(lastCommentText(null, null)).toBe("");
    expect(lastCommentText(undefined, undefined)).toBe("");
  });

  it("truncates a long comment with an ellipsis and collapses line breaks", () => {
    const text = lastCommentText("sales_to_pricing", `linea uno\nlinea dos ${"x".repeat(200)}`);
    expect(text.startsWith("De Ventas para Pricing: linea uno linea dos ")).toBe(true);
    expect(text.endsWith("…")).toBe(true);
    expect(text.length).toBeLessThanOrEqual("De Ventas para Pricing: ".length + 80 + 1);
  });

  it("keeps a comment of exactly the limit untouched", () => {
    expect(lastCommentText("sales_to_pricing", "y".repeat(80))).toBe(`De Ventas para Pricing: ${"y".repeat(80)}`);
  });
});

describe("withLastMessage", () => {
  it("replaces the last comment and adds one to the count", () => {
    expect(withLastMessage({ message_count: 2 }, { direction: "pricing_to_sales", body: "Listo" })).toEqual({
      last_message_body: "Listo",
      last_message_direction: "pricing_to_sales",
      message_count: 3,
    });
  });

  it("starts the count at one for a quote without messages", () => {
    expect(withLastMessage({}, { direction: "sales_to_pricing", body: "Hola" }).message_count).toBe(1);
  });
});

describe("lastCommentPillStyle", () => {
  it("tints the pill with the row priority color", () => {
    expect(lastCommentPillStyle("#d32f2f")).toEqual({
      color: "#d32f2f",
      background: "color-mix(in srgb, #d32f2f 14%, white)",
    });
  });

  it("falls back to no custom style when the quote has no priority color", () => {
    expect(lastCommentPillStyle(null)).toBeNull();
    expect(lastCommentPillStyle(undefined)).toBeNull();
  });
});

describe("lastCommentParts", () => {
  it("splits the label from the truncated body", () => {
    expect(lastCommentParts("sales_to_pricing", "Hola")).toEqual({ label: "De Ventas para Pricing", body: "Hola" });
  });

  it("is null without messages", () => {
    expect(lastCommentParts(null, null)).toBeNull();
  });
});
