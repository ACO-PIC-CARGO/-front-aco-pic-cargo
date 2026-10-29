import { expect, test } from "vitest";
import { nextStepDateLabel, trackingUpdates, updatesByStep } from "@/components/PublicTracking/publicTrackingFormat";
import type { TrackingUpdate } from "@/components/PublicTracking/publicTrackingFormat";
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
  const ready = { stepId: 2, stepName: "Mercancía lista para envío", icon: "mdi-package-variant" };
  expect(trackingUpdates(phases)).toEqual([
    { ...ready, key: "comment-9", text: "Buque salió del puerto.", at: "2026-10-20T15:30:00+00:00" },
    { ...ready, key: "step-2", text: "Completado", at: "2026-10-14T21:10:00.123456+00:00" },
    { key: "step-1", stepId: 1, stepName: "Pago al proveedor", icon: "mdi-currency-usd", text: "Completado", at: "2026-10-14T14:35:00+00:00" },
  ]);
});

const update = (key: string, stepId: number, at: string): TrackingUpdate => ({
  key,
  stepId,
  stepName: `Paso ${stepId}`,
  icon: "mdi-check",
  text: key,
  at,
});

test("several updates in a row of one step show under that step once", () => {
  const updates = [
    update("comment-9", 2, "2026-10-20T15:30:00Z"),
    update("comment-8", 2, "2026-10-19T10:00:00Z"),
    update("step-2", 2, "2026-10-14T21:10:00Z"),
    update("step-1", 1, "2026-10-14T14:35:00Z"),
  ];
  expect(updatesByStep(updates).map((group) => [group.stepName, group.updates.map((item) => item.key)])).toEqual([
    ["Paso 2", ["comment-9", "comment-8", "step-2"]],
    ["Paso 1", ["step-1"]],
  ]);
});

test("a step that gets news again after another step shows again, so the timeline keeps its order", () => {
  const updates = [
    update("comment-7", 3, "2026-10-22T09:00:00Z"),
    update("comment-6", 2, "2026-10-21T09:00:00Z"),
    update("step-3", 3, "2026-10-20T09:00:00Z"),
  ];
  const groups = updatesByStep(updates);
  expect(groups.map((group) => group.stepId)).toEqual([3, 2, 3]);
  expect(groups.flatMap((group) => group.updates)).toEqual(updates);
  expect(new Set(groups.map((group) => group.key)).size).toBe(groups.length);
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
