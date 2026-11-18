import { describe, expect, it } from "vitest";
import { lastCommentParts, leadingDateColumn, lastCommentPillStyle, showsCallActions, showsCancelRequestAction, showsInternalThread, showsReturnToSalesAction, withLastMessage } from "../quoteListActions";

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

describe("showsReturnToSalesAction", () => {
  it("hides the return action in Todas las cotizaciones", () => {
    expect(showsReturnToSalesAction("")).toBe(false);
  });

  it.each(["pending_send", "sent_to_client"] as const)("shows the return action in %s", (view) => {
    expect(showsReturnToSalesAction(view)).toBe(true);
  });

  it("hides the return action in Observadas por Pricing, where the quote already came back", () => {
    expect(showsReturnToSalesAction("returned")).toBe(false);
  });
});

describe("showsInternalThread", () => {
  it("keeps the call details in Todas las cotizaciones", () => {
    expect(showsInternalThread("")).toBe(false);
  });

  it.each(["pending_send", "sent_to_client", "returned"] as const)("shows the thread in %s", (view) => {
    expect(showsInternalThread(view)).toBe(true);
  });
});

describe("leadingDateColumn", () => {
  it("has no extra date column in Todas and Solicitadas por Ventas", () => {
    expect(leadingDateColumn("")).toBeNull();
    expect(leadingDateColumn("pending_send")).toBeNull();
  });

  it("leads Enviadas al Cliente with the send date", () => {
    expect(leadingDateColumn("sent_to_client")).toEqual({ key: "sent_to_client_at", title: "FECHA DE ENVÍO AL CLIENTE", align: "center" });
  });

  it("leads Observadas por Pricing with the return date", () => {
    expect(leadingDateColumn("returned")).toEqual({ key: "returned_to_sales_at", title: "FECHA DE RETORNO A VENTAS", align: "center" });
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

  it.each(["#FFFFFF", "#FFEB3B"])("uses dark text and a border on the light priority %s", (color) => {
    expect(lastCommentPillStyle(color)).toEqual({
      color: "#1f2937",
      background: `color-mix(in srgb, ${color} 14%, white)`,
      border: "1px solid #9ca3af",
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

describe("lastCommentParts truncation", () => {
  it("truncates a long comment with an ellipsis and collapses line breaks", () => {
    const parts = lastCommentParts("sales_to_pricing", `linea uno
linea dos ${"x".repeat(200)}`)!;
    expect(parts.body.startsWith("linea uno linea dos ")).toBe(true);
    expect(parts.body.endsWith("…")).toBe(true);
    expect(parts.body.length).toBeLessThanOrEqual(81);
  });

  it("keeps a comment of exactly the limit untouched", () => {
    expect(lastCommentParts("sales_to_pricing", "y".repeat(80))!.body).toBe("y".repeat(80));
  });
});

describe("showsCancelRequestAction", () => {
  it("hides the cancel action in Todas las cotizaciones", () => {
    expect(showsCancelRequestAction("")).toBe(false);
  });

  it.each(["pending_send", "sent_to_client", "returned"] as const)("shows the cancel action in %s", (view) => {
    expect(showsCancelRequestAction(view)).toBe(true);
  });
});
