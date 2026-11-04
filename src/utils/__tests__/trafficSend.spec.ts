import { describe, expect, test } from "vitest";
import { monthsToRange, quoteRouteOf, sendTargetsFor, trafficStatusLabel } from "@/utils/trafficSend";

const pendingFile = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, sent: false };

describe("Opciones para enviar una cotización", () => {
  test("a quote not approved yet can go to Operaciones or to Tráfico", () => {
    expect(sendTargetsFor(false, null)).toEqual(["OPERATIONS", "TRAFFIC"]);
  });

  test("a quote whose Tráfico file is pending can only go on to Operaciones", () => {
    expect(sendTargetsFor(true, pendingFile)).toEqual(["OPERATIONS"]);
  });

  test("a quote already sent to Operaciones has nothing left to send", () => {
    expect(sendTargetsFor(true, null)).toEqual([]);
    expect(sendTargetsFor(true, { ...pendingFile, sent: true })).toEqual([]);
  });
});

describe("Estatus que se muestra de un expediente de tráfico", () => {
  test("a sent file reads as sent to Operaciones", () => {
    expect(trafficStatusLabel({ sent_at: "2026-11-03", status_name: "EN NEGOCIACIÓN" })).toBe("Enviado a operaciones");
  });

  test("a pending file shows its status, or that it has none", () => {
    expect(trafficStatusLabel({ sent_at: null, status_name: "NUNCA EMBARCÓ" })).toBe("NUNCA EMBARCÓ");
    expect(trafficStatusLabel({ sent_at: null, status_name: null })).toBe("Sin estatus");
  });
});

describe("Meses completos del reporte", () => {
  test("one month runs from its first to its last day", () => {
    expect(monthsToRange(["2026-02"])).toEqual({ desde: "2026-02-01", hasta: "2026-02-28" });
  });

  test("several months run from the first day of the earliest to the last day of the latest", () => {
    expect(monthsToRange(["2026-12", "2026-10", "2027-01"])).toEqual({ desde: "2026-10-01", hasta: "2027-01-31" });
  });

  test("a leap February ends on the 29th", () => {
    expect(monthsToRange(["2028-02"])).toEqual({ desde: "2028-02-01", hasta: "2028-02-29" });
  });

  test("no month means no range", () => {
    expect(monthsToRange([])).toEqual({ desde: null, hasta: null });
  });
});

describe("Cotización de un expediente de tráfico", () => {
  test("a pricing quote opens in Pricing, on its send step when asked", () => {
    expect(quoteRouteOf({ quote_kind: "PRICING", id_quote: 15376 }, 5)).toEqual({ name: "verQuote", params: { id: 15376, step: 5 } });
    expect(quoteRouteOf({ quote_kind: "PRICING", id_quote: 15376 })).toEqual({ name: "verQuote", params: { id: 15376 } });
  });

  test("an aduana quote opens in Aduana", () => {
    expect(quoteRouteOf({ quote_kind: "ADUANA", id_quote: 31 }, 5)).toEqual({ name: "VerAduana", params: { id: 31, step: 5 } });
  });
});
