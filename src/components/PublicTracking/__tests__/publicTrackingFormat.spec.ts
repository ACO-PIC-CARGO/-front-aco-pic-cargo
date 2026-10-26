import { expect, test } from "vitest";
import { nextStepDateLabel, trackingUpdates } from "@/components/PublicTracking/publicTrackingFormat";
import type { PublicTrackingPhase, PublicTrackingStep } from "@/types/publicTracking";

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

test("the next move shows its date in the company's zone or that it is still to be set", () => {
  expect(nextStepDateLabel("2026-11-04T03:00:00Z", "America/Lima")).toBe("03/NOV/2026");
  expect(nextStepDateLabel("2026-11-04T03:00:00Z", "Europe/Madrid")).toBe("04/NOV/2026");
  expect(nextStepDateLabel(null, "America/Lima")).toBe("Fecha por definir");
});
