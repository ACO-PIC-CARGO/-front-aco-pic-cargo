import { describe, expect, test } from "vitest";
import { noticeDetails, noticeMeasures, pricingRequestDetails, sentToClientMessage } from "../quoteNoticeContent";
import type { QuoteNotice } from "../quoteNotificationApi";

const notice = (fields: Partial<QuoteNotice> = {}): QuoteNotice => ({
  notification_id: "5", kind: "sent_to_client", branch_id: 1, quote_id: 5, quote_code: "15560-P",
  client_name: "María Flores", created_by_name: "ANA TORRES", pricing_notes: null, created_at: "10/11/2026 10:00",
  client_phone: "+51 987 654 321", transport_name: "Marítimo", shipment_name: "LCL", individual_flag: false,
  group_flag: true, containers: [], origin: "Shanghái", goods_value: 4350, weight: 610, volume: 4.4, ...fields,
});
const values = (rows: { label: string; value: string }[]) => rows.map(({ label, value }) => [label, value]);

describe("the quote sent to the client notice", () => {
  test("shows the quote data with the shipment type, the goods value in dollars and the cargo measures", () => {
    expect(values(noticeDetails(notice()))).toEqual([
      ["Cotización N.°", "15560-P"],
      ["Cliente", "María Flores"],
      ["Teléfono", "+51 987 654 321"],
      ["Tipo de embarque", "LCL Grupal"],
      ["Origen", "Shanghái"],
      ["Valor", "USD 4,350"],
    ]);
    expect(values(noticeMeasures(notice()))).toEqual([
      ["Peso", "610 kg"],
      ["Volumen", "4.40 m³"],
    ]);
  });

  test("an FCL quote names its containers as the shipment type", () => {
    const fcl = notice({ shipment_name: "FCL", group_flag: false, containers: [{ name: "20' STD" }, { name: "40' HC" }] });

    expect(noticeDetails(fcl).find((row) => row.label === "Tipo de embarque")?.value).toBe("FCL 20' STD, 40' HC");
  });

  test("leaves out data the quote does not have, and a zero goods value, weight or volume", () => {
    const sparse = notice({ client_phone: null, origin: "", goods_value: 0, weight: null, volume: 0 });

    expect(noticeDetails(sparse).map((row) => row.label)).toEqual(["Cotización N.°", "Cliente", "Tipo de embarque"]);
    expect(noticeMeasures(sparse)).toEqual([]);
  });

  test("says who sent the quote", () => {
    expect(sentToClientMessage(notice())).toBe("ANA TORRES ya le envió la cotización.");
    expect(sentToClientMessage(notice({ created_by_name: null }))).toBe("Un usuario ya le envió la cotización.");
  });
});

describe("the pricing request notice", () => {
  test("shows who asks, the quote, its shipment type and the notes to pricing", () => {
    const request = notice({ kind: "pricing_request", created_by_name: "RAMIREZ CARLOS", group_flag: false, individual_flag: true, pricing_notes: "PRUEBA FINAL." });

    expect(values(pricingRequestDetails(request))).toEqual([
      ["Vendedor", "RAMIREZ CARLOS"],
      ["Cotización N.°", "15560-P"],
      ["Tipo de Embarque", "LCL Individual"],
      ["Notas", "PRUEBA FINAL."],
    ]);
  });

  test("leaves out the notes when the request has none", () => {
    const request = notice({ kind: "pricing_request", pricing_notes: null });

    expect(pricingRequestDetails(request).map((row) => row.label)).not.toContain("Notas");
  });
});
