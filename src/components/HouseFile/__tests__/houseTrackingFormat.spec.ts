import { expect, test } from "vitest";
import {
  clientSteps,
  dayMonth,
  fromDateAndTime,
  latestComment,
  phaseProgress,
  dateLabel,
  stepDateTimeLabel,
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

test("the client view keeps only client-visible steps and their public comments", () => {
  const internal = { id: 1, comment: "Interno", is_public: false, author: "Ana", created_at: "2026-10-01T15:00:00Z" };
  const shared = { id: 2, comment: "Público", is_public: true, author: "Ana", created_at: "2026-10-02T15:00:00Z" };
  const phases = [
    {
      id: 1,
      name: "Fábrica",
      icon: "mdi-factory",
      sort_order: 1,
      status: "in_progress",
      completed_at: null,
      steps: [step({ comments: [shared, internal] }), step({ id: 2, visible_to_client: false })],
    },
  ] as HouseTrackingPhase[];
  expect(clientSteps(phases)).toEqual([step({ comments: [shared] })]);
});

test("latestComment is the newest comment or nothing", () => {
  const newest = { id: 2, comment: "B", is_public: true, author: null, created_at: "2026-10-02T15:00:00Z" };
  expect(latestComment(step({ comments: [newest] }))).toBe(newest);
  expect(latestComment(step())).toBeNull();
});

test("trackingLink points to the public tracking page of the current site", () => {
  expect(trackingLink("abc-123", "https://aco.example.com")).toBe("https://aco.example.com/tracking/abc-123");
});

const phase = (status: HouseTrackingPhase["status"], steps: HouseTrackingStep[]): HouseTrackingPhase => ({
  id: 1,
  name: "Fábrica",
  icon: "mdi-factory",
  sort_order: 1,
  status,
  completed_at: null,
  steps,
});
const confirmed = step({ state: "confirmed", confirmed_at: "2026-10-01T15:00:00Z" });

test("a phase fills by the share of its confirmed steps", () => {
  expect(phaseProgress(phase("in_progress", [step(), step()]))).toBe(0);
  expect(phaseProgress(phase("in_progress", [confirmed, step()]))).toBe(50);
  expect(phaseProgress(phase("in_progress", [confirmed, confirmed, step()]))).toBeCloseTo(66.67, 1);
  expect(phaseProgress(phase("completed", [confirmed, confirmed]))).toBe(100);
});

test("a phase without steps is full only once it is completed", () => {
  expect(phaseProgress(phase("pending", []))).toBe(0);
  expect(phaseProgress(phase("completed", []))).toBe(100);
});
