import { expect, test } from "vitest";
import {
  authorizationLabel,
  quoteExpiredOn,
  quoteValidityBadge,
  skipStillSaves,
  stepValidationLines,
} from "@/components/HouseFile/stepValidation";
import type { HouseTrackingStep } from "@/types/houseTracking";

const LIMA = "America/Lima";
const step = (over: Partial<HouseTrackingStep> = {}): HouseTrackingStep => ({
  id: 6,
  name: "ETD (Salida de origen)",
  icon: "mdi-ferry",
  number: 6,
  visible_to_client: true,
  confirmed_at: null,
  confirmed_by: null,
  sent_at: null,
  scheduled_at: null,
  validation: { code: "quote_validity", name: "Vigencia de cotización" },
  validation_result: null,
  validation_result_code: null,
  quote_validity: { quote_id: 7092, valid_until: "2025-11-14", kept_by: null, kept_at: null },
  state: "next",
  comments: [],
  ...over,
});

test("a date is past the quote validity only from the next local day and while the rate was not kept", () => {
  expect(quoteExpiredOn(step(), "2025-11-15T04:59:00.000Z", LIMA)).toBe(false);
  expect(quoteExpiredOn(step(), "2025-11-15T05:30:00.000Z", LIMA)).toBe(true);
  const kept = { quote_id: 7092, valid_until: "2025-11-14", kept_by: "Carlos Ramírez", kept_at: "2026-10-26T15:45:00Z" };
  expect(quoteExpiredOn(step({ quote_validity: kept }), "2025-12-01T15:00:00.000Z", LIMA)).toBe(false);
  expect(quoteExpiredOn(step({ quote_validity: null }), "2025-12-01T15:00:00.000Z", LIMA)).toBe(false);
});

test("skipping saves the date when estimating or correcting it, never when confirming", () => {
  expect(skipStillSaves(step(), "confirm")).toBe(false);
  expect(skipStillSaves(step(), "date")).toBe(true);
  expect(skipStillSaves(step({ confirmed_at: "2025-11-20T15:00:00Z", state: "confirmed" }), "confirm")).toBe(true);
});

test("the authorization time reads as day, short month, year and time in the branch time zone", () => {
  expect(authorizationLabel("2026-10-26T15:45:00Z", LIMA)).toBe("26 oct. 2026, 10:45");
});

test("under the step: a warning past validity, who kept the rate once kept, and weight lines only for the weight check", () => {
  expect(stepValidationLines(step({ scheduled_at: "2025-12-01T15:00:00Z" }), LIMA)).toEqual([
    {
      label: "La fecha de salida supera la vigencia de la cotización (vence 14/NOV/2025).",
      warning: true,
      icon: "mdi-file-alert-outline",
    },
  ]);
  expect(stepValidationLines(step({ scheduled_at: "2025-11-14T15:00:00Z" }), LIMA)).toEqual([]);
  const kept = { quote_id: 7092, valid_until: "2025-11-14", kept_by: "Carlos Ramírez", kept_at: "2026-10-26T15:45:00Z" };
  expect(stepValidationLines(step({ quote_validity: kept, validation_result: { quote_id: 7092 } as never, validation_result_code: "quote_validity" }), LIMA)).toEqual([
    { label: "Tarifa mantenida por Carlos Ramírez el 26/OCT/2026 10:45", warning: false, icon: "mdi-file-check-outline" },
  ]);
  const weighed = step({
    validation: { code: "weight_volume", name: "Peso y volumen" },
    quote_validity: null,
    validation_result: { quoted_weight: 300, quoted_volume: 2, weight: 320, volume: 2 },
    validation_result_code: "weight_volume",
  });
  expect(stepValidationLines(weighed, LIMA).map((line) => line.label)).toEqual([
    "Peso confirmado: 320 kg (cotizado: 300 kg)",
    "Volumen confirmado: 2.00 m³ (igual al cotizado)",
  ]);
});

test("the lines follow the validation that saved the result, not the step's current validation", () => {
  const weighed = { quoted_weight: 300, quoted_volume: 2, weight: 320, volume: 2 };
  const movedAway = step({ validation: null, quote_validity: null, validation_result: weighed, validation_result_code: "weight_volume" });
  expect(stepValidationLines(movedAway, LIMA).map((line) => line.label)).toEqual([
    "Peso confirmado: 320 kg (cotizado: 300 kg)",
    "Volumen confirmado: 2.00 m³ (igual al cotizado)",
  ]);
  const quoteResultUnderWeightCheck = step({
    validation: { code: "weight_volume", name: "Peso y volumen" },
    quote_validity: null,
    validation_result: { quote_id: 7092, valid_until: "2025-11-14" } as never,
    validation_result_code: "quote_validity",
  });
  expect(stepValidationLines(quoteResultUnderWeightCheck, LIMA)).toEqual([]);
});

test("the services header flags the quote once the ETD date passes its validity, and says when the rate was kept", () => {
  const kept = { quote_id: 7092, valid_until: "2025-11-14", kept_by: "Carlos Ramírez", kept_at: "2026-10-26T15:45:00Z" };
  expect(quoteValidityBadge([step()], LIMA)).toBeNull();
  expect(quoteValidityBadge([step({ scheduled_at: "2025-11-15T04:59:00Z" })], LIMA)).toBeNull();
  expect(quoteValidityBadge([step({ scheduled_at: "2025-11-15T05:30:00Z" })], LIMA)).toEqual({
    label: "Cotización vencida el 14/NOV/2025",
    warning: true,
  });
  expect(
    quoteValidityBadge([step({ confirmed_at: "2025-11-10T15:00:00Z", scheduled_at: "2025-12-01T15:00:00Z", state: "confirmed" })], LIMA),
  ).toBeNull();
  expect(quoteValidityBadge([step({ confirmed_at: "2025-12-01T15:00:00Z", state: "confirmed", quote_validity: kept })], LIMA)).toEqual({
    label: "Cotización vencida el 14/NOV/2025 · Tarifa mantenida",
    warning: false,
  });
  expect(quoteValidityBadge([step({ quote_validity: null, scheduled_at: "2025-12-01T15:00:00Z" })], LIMA)).toBeNull();
});
