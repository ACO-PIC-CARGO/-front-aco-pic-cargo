import { describe, expect, it } from "vitest";
import { lastCommentParts, quoteListHeaders, lastCommentPillStyle, showsCallActions, reloadsAfterPricingRequest, showsCancelRequestAction, showsInternalThread, showsReturnToSalesAction, withLastMessage } from "../quoteListActions";

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

describe("quoteListHeaders", () => {
  const BASE = ["acciones", "priority_name", "created", "status", "codigo", "pricing", "ejecutivo_ventas", "nombres", "telefono", "sentido", "tipo_de_carga", "incoterms", "origen", "destino", "marketing", "fechaemisionpdf"]
    .map((key) => ({ key, title: key.toUpperCase() }));
  const keys = (view: Parameters<typeof quoteListHeaders>[0]) => quoteListHeaders(view, BASE).map((header) => header.key);
  const REQUEST_TAB_COLUMNS = ["acciones", "priority_name", "created", "codigo", "pricing", "ejecutivo_ventas", "nombres", "telefono", "sentido", "tipo_de_carga", "incoterms", "origen", "destino", "last_message_body"];

  it("leaves Todas las cotizaciones exactly as it was", () => {
    expect(keys("")).toEqual(BASE.map((header) => header.key));
  });

  it("drops status, marketing and the PDF send date in Solicitadas por Ventas, adds the last send after the creation date and ends with the last comment", () => {
    expect(keys("pending_send")).toEqual(["acciones", "priority_name", "created", "last_sent_to_client_at", ...REQUEST_TAB_COLUMNS.slice(3)]);
    expect(quoteListHeaders("pending_send", BASE)[3]).toMatchObject({ title: "ÚLTIMO ENVÍO A CLIENTE" });
  });

  it("leads Enviadas al Cliente with the send date", () => {
    expect(keys("sent_to_client")).toEqual(["acciones", "sent_to_client_at", ...REQUEST_TAB_COLUMNS.slice(1)]);
  });

  it("puts the return date right after the creation date in Observadas por Pricing", () => {
    expect(keys("returned")).toEqual(["acciones", "priority_name", "created", "returned_to_sales_at", ...REQUEST_TAB_COLUMNS.slice(3)]);
  });

  it("gives the last comment room to read", () => {
    expect(quoteListHeaders("pending_send", BASE).at(-1)).toMatchObject({ title: "ÚLTIMO COMENTARIO", minWidth: expect.any(String) });
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

  it.each(["#FFFFFF", "#FFEB3B", "#FF9800"])("uses dark text and a border on the light priority %s", (color) => {
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

  it.each(["pending_send", "sent_to_client"] as const)("shows the cancel action in %s", (view) => {
    expect(showsCancelRequestAction(view)).toBe(true);
  });

  it("hides the cancel action in Observadas por Pricing, where the return already cancelled the request", () => {
    expect(showsCancelRequestAction("returned")).toBe(false);
  });
});

describe("reloadsAfterPricingRequest", () => {
  it("only marks the row in Todas las cotizaciones", () => {
    expect(reloadsAfterPricingRequest("")).toBe(false);
  });

  it.each(["pending_send", "sent_to_client", "returned"] as const)("reloads %s so a re-requested quote changes tab", (view) => {
    expect(reloadsAfterPricingRequest(view)).toBe(true);
  });
});
