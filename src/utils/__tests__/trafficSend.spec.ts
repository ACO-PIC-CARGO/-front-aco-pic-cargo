import { describe, expect, test } from "vitest";
import {
  associableIdsOf,
  masterChoiceProblem,
  monthsToRange,
  quoteRouteOf,
  sendTargetsFor,
  trafficEditLocked,
  trafficFileProblem,
  trafficStatusLabel,
} from "@/utils/trafficSend";

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

describe("Elección de master al enviar a Operaciones", () => {
  const today = "2026-11-04";

  test("a new master needs its availability date", () => {
    expect(masterChoiceProblem({ isNew: true, availability: "", masterId: null }, today)).toBe(
      "Elige la fecha de disponibilidad del master.",
    );
  });

  test("a new master's availability date must come after today", () => {
    expect(masterChoiceProblem({ isNew: true, availability: today, masterId: null }, today)).toBe(
      "La fecha de disponibilidad debe ser posterior a hoy.",
    );
  });

  test("an existing master must be chosen", () => {
    expect(masterChoiceProblem({ isNew: false, availability: "", masterId: null }, today)).toBe("Elige el master al que se enlaza.");
  });

  test("a complete choice has no problem", () => {
    expect(masterChoiceProblem({ isNew: true, availability: "2026-11-20", masterId: null }, today)).toBe("");
    expect(masterChoiceProblem({ isNew: false, availability: "", masterId: 3831 }, today)).toBe("");
  });
});

describe("trafficFileProblem", () => {
  const complete = {
    id_consigner: 12, id_modality: 1, id_shipment: 2, id_port_begin: 3, id_port_end: 4,
    id_incoterms: null, id_pricing: null, bultos: null, peso: null, volumen: null, nro_traffic: null,
  };

  test("names the first missing required field, in form order", () => {
    expect(trafficFileProblem({ ...complete, id_consigner: null, id_shipment: null }, false)).toBe("Elige el cliente.");
    expect(trafficFileProblem({ ...complete, id_modality: null }, false)).toBe("Elige el sentido.");
    expect(trafficFileProblem({ ...complete, id_shipment: null }, false)).toBe("Elige el tipo de embarque.");
    expect(trafficFileProblem({ ...complete, id_port_begin: null }, false)).toBe("Elige el puerto de origen.");
    expect(trafficFileProblem({ ...complete, id_port_end: null }, false)).toBe("Elige el puerto de destino.");
  });

  test("asks for a whole positive number only when numbering is manual", () => {
    expect(trafficFileProblem(complete, false)).toBe("");
    expect(trafficFileProblem(complete, true)).toBe("Escribe el número de tráfico.");
    expect(trafficFileProblem({ ...complete, nro_traffic: 2.5 }, true)).toBe("Escribe el número de tráfico.");
    expect(trafficFileProblem({ ...complete, nro_traffic: 57 }, true)).toBe("");
  });
});

describe("associableIdsOf", () => {
  test("splits the quotes by kind", () => {
    const ids = associableIdsOf([
      { quote_kind: "PRICING", id_quote: 5 },
      { quote_kind: "ADUANA", id_quote: 31 },
      { quote_kind: "PRICING", id_quote: 6 },
    ]);

    expect([...ids.pricing]).toEqual([5, 6]);
    expect([...ids.aduana]).toEqual([31]);
  });
});

describe("Editar un expediente de tráfico desde Tráfico", () => {
  const houseFile = { ...pendingFile, quote_kind: "PRICING" as const, id_quote: 12 };

  test("a pending file is edited freely", () => {
    expect(trafficEditLocked(houseFile, false)).toBe(false);
  });

  test("a file sent to Operaciones needs an administrator", () => {
    expect(trafficEditLocked({ ...houseFile, sent: true }, false)).toBe(true);
  });

  test("a file sent to Operaciones is edited once an administrator authorized it", () => {
    expect(trafficEditLocked({ ...houseFile, sent: true }, true)).toBe(false);
  });

  test("stays locked until the file is known", () => {
    expect(trafficEditLocked(undefined, false)).toBe(true);
  });

  test("a house with no traffic file is not locked by Tráfico", () => {
    expect(trafficEditLocked(null, false)).toBe(false);
  });
});
