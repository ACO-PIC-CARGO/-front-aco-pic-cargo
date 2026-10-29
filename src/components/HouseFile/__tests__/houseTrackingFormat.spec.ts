import { expect, test } from "vitest";
import {
  calendarDateLabel,
  clientSteps,
  commentSendState,
  dayMonth,
  fromDateAndTime,
  latestComment,
  dateLabel,
  displayValue,
  stepDateTimeLabel,
  stepDialogPreset,
  stepSendState,
  toDateAndTime,
  trackingLink,
} from "@/components/HouseFile/houseTrackingFormat";
import type { HouseTrackingPhase, HouseTrackingStep } from "@/types/houseTracking";

const LIMA = "America/Lima";
const MEXICO = "America/Mexico_City";

const step = (over: Partial<HouseTrackingStep> = {}): HouseTrackingStep => ({
  id: 1,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  number: 1,
  visible_to_client: true,
  confirmed_at: null,
  confirmed_by: null,
  sent_at: null,
  scheduled_at: null,
  validation: null,
  validation_result: null,
  validation_result_code: null,
  quote_validity: null,
  state: "next",
  comments: [],
  ...over,
});

test("timestamps are shown in the company's zone with the project date format", () => {
  expect(dayMonth("2026-10-04T03:30:00Z", LIMA)).toEqual({ day: "03", month: "OCT" });
  expect(dateLabel("2026-01-15T12:00:00Z", LIMA)).toBe("15/ENE/2026");
  expect(dateLabel(null, LIMA)).toBe("–");
  expect(stepDateTimeLabel("2026-10-01T21:40:00.000Z", LIMA)).toBe("01/OCT/2026 16:40");
  expect(stepDateTimeLabel("2026-10-01T21:40:00.000Z", MEXICO)).toBe("01/OCT/2026 15:40");
});

test("a date and time typed in the company's zone survive the trip to ISO and back", () => {
  const iso = fromDateAndTime("2026-10-01", "16:40", LIMA);
  expect(iso).toBe("2026-10-01T21:40:00.000Z");
  expect(fromDateAndTime("2026-10-01", "16:40", MEXICO)).toBe("2026-10-01T22:40:00.000Z");
  expect(stepDateTimeLabel(iso, LIMA)).toBe("01/OCT/2026 16:40");
  expect(toDateAndTime(iso, LIMA)).toEqual({ date: "2026-10-01", time: "16:40" });
  expect(toDateAndTime("2026-01-05T12:03:00Z", LIMA)).toEqual({ date: "2026-01-05", time: "07:03" });
});

test("the client view keeps only the sent steps the client can see, with their sent comments", () => {
  const internal = { id: 1, comment: "Interno", sent_at: null, author: "Ana", created_at: "2026-10-01T15:00:00Z" };
  const shared = { id: 2, comment: "Enviado", sent_at: "2026-10-02T16:00:00Z", author: "Ana", created_at: "2026-10-02T15:00:00Z" };
  const sentStep = step({ state: "confirmed", sent_at: "2026-10-02T14:00:00Z", comments: [shared, internal] });
  const phases = [
    {
      id: 1,
      name: "Fábrica",
      icon: "mdi-factory",
      sort_order: 1,
      status: "in_progress",
      completed_at: null,
      steps: [
        sentStep,
        step({ id: 2, state: "confirmed" }),
        step({ id: 3, visible_to_client: false, sent_at: "2026-10-02T14:00:00Z" }),
      ],
    },
  ] as HouseTrackingPhase[];
  expect(clientSteps(phases)).toEqual([{ ...sentStep, comments: [shared] }]);
});

test("latestComment is the newest comment or nothing", () => {
  const newest = { id: 2, comment: "B", sent_at: "2026-10-02T16:00:00Z", author: null, created_at: "2026-10-02T15:00:00Z" };
  expect(latestComment(step({ comments: [newest] }))).toBe(newest);
  expect(latestComment(step())).toBeNull();
});

test("trackingLink points to the public tracking page of the current site", () => {
  expect(trackingLink("abc-123", "https://aco.example.com")).toBe("https://aco.example.com/tracking/abc-123");
});

test("displayValue shows a dash for missing values and keeps zero", () => {
  expect(displayValue(null)).toBe("—");
  expect(displayValue("")).toBe("—");
  expect(displayValue(0, " kg")).toBe("0 kg");
  expect(displayValue(1250, " kg")).toBe("1250 kg");
});

test("a step can be sent to the client tracking once confirmed, only if the client sees that step", () => {
  expect(stepSendState(step({ state: "next" }))).toBe("blocked");
  expect(stepSendState(step({ state: "confirmed", confirmed_at: "2026-10-01T15:00:00Z" }))).toBe("ready");
  expect(stepSendState(step({ state: "confirmed", sent_at: "2026-10-01T16:00:00Z" }))).toBe("sent");
  expect(stepSendState(step({ visible_to_client: false, state: "confirmed", sent_at: "2026-10-01T16:00:00Z" }))).toBe(
    "internal",
  );
});

test("a comment can be sent once its step is confirmed, sent or not, only if the client sees that step", () => {
  const unsent = { id: 3, comment: "Listo", sent_at: null, author: null, created_at: "2026-10-03T15:00:00Z" };
  const sentStep = step({ state: "confirmed", sent_at: "2026-10-03T16:00:00Z" });
  expect(commentSendState(step({ state: "next" }), unsent)).toBe("blocked");
  expect(commentSendState(step({ state: "confirmed" }), unsent)).toBe("ready");
  expect(commentSendState(sentStep, unsent)).toBe("ready");
  expect(commentSendState(sentStep, { ...unsent, sent_at: "2026-10-03T17:00:00Z" })).toBe("sent");
  expect(commentSendState(step({ visible_to_client: false, sent_at: "2026-10-03T16:00:00Z" }), unsent)).toBe("internal");
});

test("a comment marked sent shows as sent only once the client sees its step", () => {
  const backfilled = { id: 4, comment: "Público", sent_at: "2026-10-03T17:00:00Z", author: null, created_at: "2026-10-03T15:00:00Z" };
  expect(commentSendState(step({ state: "next" }), backfilled)).toBe("blocked");
});

test("the step dialog saves an estimate, confirms starting from it, or corrects a confirmed date", () => {
  const planned = step({ scheduled_at: "2026-11-03T15:00:00Z" });
  expect(stepDialogPreset(planned, "date")).toEqual({
    title: "Fecha de «Pago al proveedor»",
    action: "Guardar fecha",
    initial: "2026-11-03T15:00:00Z",
  });
  expect(stepDialogPreset(planned, "confirm")).toEqual({
    title: "Confirmar «Pago al proveedor»",
    action: "Confirmar",
    initial: "2026-11-03T15:00:00Z",
  });
  expect(stepDialogPreset(step(), "confirm").initial).toBeNull();
  expect(
    stepDialogPreset(
      step({ state: "confirmed", confirmed_at: "2026-11-01T12:00:00Z", scheduled_at: "2026-11-03T15:00:00Z" }),
      "confirm",
    ),
  ).toEqual({ title: "Corregir fecha de «Pago al proveedor»", action: "Guardar fecha", initial: "2026-11-01T12:00:00Z" });
});

test("a calendar date shows its day with the month's first three letters and the year, and a missing one a dash", () => {
  expect(calendarDateLabel("2026-10-19")).toBe("19/OCT/2026");
  expect(calendarDateLabel("2026-01-01")).toBe("01/ENE/2026");
  expect(calendarDateLabel(null)).toBe("—");
});
