import { expect, test } from "vitest";
import {
  calendarDateLabel,
  nextArrival,
  trackingUpdates,
  transportIcon,
} from "@/components/PublicTracking/publicTrackingFormat";
import type { PublicTracking, PublicTrackingPhase, PublicTrackingStep } from "@/types/publicTracking";

const step = (over: Partial<PublicTrackingStep> = {}): PublicTrackingStep => ({
  id: 1,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  confirmed_at: null,
  comments: [],
  ...over,
});
const phase = (status: PublicTrackingPhase["status"], steps: PublicTrackingStep[] = []): PublicTrackingPhase => ({
  id: 1,
  name: "Fábrica",
  icon: "mdi-factory",
  status,
  completed_at: null,
  progress: 0,
  steps,
});
const tracking = (over: Partial<PublicTracking> = {}): PublicTracking => ({
  house_code: "2024HBL001734",
  client: "Cliente",
  supplier: null,
  incoterm: "EXW",
  weight: null,
  volume: null,
  shipment: "FCL",
  destination_port: "CALLAO",
  eta: "2026-11-05",
  time_zone: "America/Lima",
  phases: [phase("in_progress")],
  ...over,
});

test("confirmed steps and public comments become updates, newest first by time", () => {
  const phases = [
    phase("completed", [
      step({ id: 1, confirmed_at: "2026-10-14T14:35:00+00:00" }),
      step({
        id: 2,
        name: "Mercancía lista para envío",
        icon: "mdi-package-variant",
        confirmed_at: "2026-10-14T21:10:00.123456+00:00",
        comments: [{ id: 9, comment: "Buque salió del puerto.", created_at: "2026-10-20T15:30:00+00:00" }],
      }),
    ]),
    phase("pending", [step({ id: 3, name: "Fecha de Cut Off" })]),
  ];
  expect(trackingUpdates(phases)).toEqual([
    { key: "comment-9", icon: "mdi-package-variant", text: "Buque salió del puerto.", at: "2026-10-20T15:30:00+00:00" },
    { key: "step-2", icon: "mdi-package-variant", text: "Mercancía lista para envío", at: "2026-10-14T21:10:00.123456+00:00" },
    { key: "step-1", icon: "mdi-currency-usd", text: "Pago al proveedor", at: "2026-10-14T14:35:00+00:00" },
  ]);
});

test("updates with the same time keep a stable order", () => {
  const at = "2026-10-14T14:35:00+00:00";
  const phases = [phase("in_progress", [step({ id: 1, confirmed_at: at, comments: [{ id: 4, comment: "Listo", created_at: at }] })])];
  expect(trackingUpdates(phases).map((update) => update.key)).toEqual(["step-1", "comment-4"]);
});

test("the arrival card needs an ETA and a shipment still on its way", () => {
  expect(nextArrival(tracking())).toEqual({ port: "CALLAO", eta: "2026-11-05" });
  expect(nextArrival(tracking({ destination_port: null }))).toEqual({ port: "destino", eta: "2026-11-05" });
  expect(nextArrival(tracking({ eta: null }))).toBeNull();
  expect(nextArrival(tracking({ phases: [phase("completed"), phase("completed")] }))).toBeNull();
  expect(nextArrival(tracking({ phases: [] }))).toEqual({ port: "CALLAO", eta: "2026-11-05" });
});

test("air shipments travel by plane, everything else by ship", () => {
  expect(transportIcon("Aéreo")).toBe("mdi-airplane");
  expect(transportIcon("FCL")).toBe("mdi-ferry");
  expect(transportIcon(null)).toBe("mdi-ferry");
});

test("a calendar date keeps its day whatever the browser zone", () => {
  expect(calendarDateLabel("2026-11-05")).toBe("05/NOV/2026");
});
