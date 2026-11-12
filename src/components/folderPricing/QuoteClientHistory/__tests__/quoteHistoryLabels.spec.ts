import { describe, expect, test } from "vitest";
import { cargoDetail, modalityLabel } from "../quoteHistoryLabels";
import type { ClientQuoteHistoryItem } from "../useClientQuoteHistory";

const item = (fields: Partial<ClientQuoteHistoryItem>): ClientQuoteHistoryItem => ({
  id: 1, quote_code: "00000001", created_date: "01/01/2026", cursor_created_at: "2026-01-01 00:00:00",
  transport_name: "Marítimo", shipment_name: "LCL", incoterm_name: "FOB", group_flag: false, individual_flag: false,
  weight: 1100, volume: 1.5, amount: 0, containers: [], origin: null, destination: null,
  status_name: null, approved_flag: false, total_count: null, has_more: false, cost: 0, sale: 0, profit: 0, ...fields,
});

describe("modalityLabel", () => {
  test("LCL says whether it is individual or grouped", () => {
    expect(modalityLabel(item({ individual_flag: true }))).toBe("LCL Individual");
    expect(modalityLabel(item({ group_flag: true }))).toBe("LCL Grupal");
  });

  test("FCL names its containers and air keeps the shipment name, whatever the individual flag says", () => {
    const fcl = { shipment_name: "FCL", individual_flag: true, containers: [{ id_containers: 20, cantidad: 1, name: "20' STD" }] };
    expect(modalityLabel(item(fcl))).toBe("FCL 20' STD");
    expect(modalityLabel(item({ shipment_name: "Aéreo", transport_name: "Aéreo", individual_flag: true }))).toBe("Aéreo");
  });
});

describe("cargoDetail", () => {
  test("containers show type and quantity; loose cargo shows weight and volume", () => {
    expect(cargoDetail(item({ containers: [{ id_containers: 20, cantidad: 2, name: "40' HC" }] }))).toBe("Contenedor: 40' HC | Cantidad: 2");
    expect(cargoDetail(item({}))).toBe("Peso: 1,100 kg | Volumen: 1.50 m³");
    expect(cargoDetail(item({ weight: 180, volume: 0 }))).toBe("Peso: 180 kg");
  });

  test("the quote's goods value follows the cargo, only when the quote has one", () => {
    expect(cargoDetail(item({ amount: 12500.4 }))).toBe("Peso: 1,100 kg | Volumen: 1.50 m³ | Valor: USD 12,500");
    expect(cargoDetail(item({ amount: 3000, containers: [{ id_containers: 20, cantidad: 1, name: "20' STD" }] }))).toBe(
      "Contenedor: 20' STD | Cantidad: 1 | Valor: USD 3,000",
    );
    expect(cargoDetail(item({ amount: null as never }))).toBe("Peso: 1,100 kg | Volumen: 1.50 m³");
  });
});
