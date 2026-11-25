import { expect, test } from "vitest";
import { nextStepDateLabel, trackingUpdates, updatesByStep } from "@/components/PublicTracking/publicTrackingFormat";
import type { TrackingUpdate } from "@/components/PublicTracking/publicTrackingFormat";
import type { PublicTrackingPhase, PublicTrackingStep } from "@/types/publicTracking";

const step = (over: Partial<PublicTrackingStep> = {}): PublicTrackingStep => ({
  id: 1,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  show_date: true,
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

test("public comments become updates; a sent step without comments adds none", () => {
  const phases = [
    phase("completed", [
      step({ id: 1, comments: [{ id: 3, comment: "Pago recibido.", created_at: "2026-10-14T14:35:00+00:00" }] }),
      step({
        id: 2,
        name: "Mercancía lista para envío",
        icon: "mdi-package-variant",
        comments: [{ id: 9, comment: "Buque salió del puerto.", created_at: "2026-10-20T15:30:00+00:00" }],
      }),
      step({ id: 3, name: "Fecha de Cut Off" }),
    ]),
  ];
  expect(trackingUpdates(phases)).toEqual([
    {
      key: "comment-9",
      stepId: 2,
      stepName: "Mercancía lista para envío",
      icon: "mdi-package-variant",
      text: "Buque salió del puerto.",
      at: "2026-10-20T15:30:00+00:00",
      showDate: true,
    },
    {
      key: "comment-3",
      stepId: 1,
      stepName: "Pago al proveedor",
      icon: "mdi-currency-usd",
      text: "Pago recibido.",
      at: "2026-10-14T14:35:00+00:00",
      showDate: true,
    },
  ]);
});

test("updates follow the send order, latest sent step first, even when an earlier step's comment was written later", () => {
  const comment = (id: number, created_at: string) => [{ id, comment: `Comentario ${id}`, created_at }];
  const phases = [
    phase("completed", [
      step({ id: 1, name: "Arribo al almacén de origen", comments: comment(888, "2026-11-24T17:22:49Z") }),
      step({ id: 2, name: "ETD", comments: comment(887, "2026-11-24T16:34:42Z") }),
    ]),
    {
      ...phase("in_progress", [
        step({ id: 3, name: "Telex Release", comments: comment(289, "2026-11-13T16:33:43Z") }),
        step({ id: 4, name: "ETA", comments: comment(734, "2026-11-19T17:47:22Z") }),
      ]),
      id: 2,
    },
  ];
  expect(trackingUpdates(phases).map((item) => item.stepName)).toEqual(["ETA", "Telex Release", "ETD", "Arribo al almacén de origen"]);
});

test("a step's comments stay together under it, latest sent first as the server lists them, even if written earlier", () => {
  const phases = [
    phase("in_progress", [
      step({
        id: 1,
        comments: [
          { id: 2, comment: "Escrito antes, enviado al final.", created_at: "2026-10-10T10:00:00Z" },
          { id: 7, comment: "Escrito después, enviado antes.", created_at: "2026-10-20T10:00:00Z" },
        ],
      }),
      step({ id: 2, comments: [{ id: 5, comment: "Lista.", created_at: "2026-10-15T10:00:00Z" }] }),
    ]),
  ];
  expect(trackingUpdates(phases).map((item) => item.key)).toEqual(["comment-5", "comment-2", "comment-7"]);
});

test("a step that hides its date shows its comments without a date, in their place", () => {
  const phases = [
    phase("in_progress", [
      step({
        id: 1,
        show_date: false,
        comments: [{ id: 4, comment: "Contenedor en revisión", created_at: "2026-10-15T09:10:00+00:00" }],
      }),
      step({ id: 2, comments: [{ id: 5, comment: "Zarpó", created_at: "2026-10-13T08:00:00+00:00" }] }),
    ]),
  ];
  expect(trackingUpdates(phases).map(({ key, showDate }) => [key, showDate])).toEqual([
    ["comment-5", true],
    ["comment-4", false],
  ]);
});

const update = (key: string, stepId: number, at: string): TrackingUpdate => ({
  key,
  stepId,
  stepName: `Paso ${stepId}`,
  icon: "mdi-check",
  text: key,
  at,
  showDate: true,
});

test("several updates in a row of one step show under that step once", () => {
  const updates = [
    update("comment-9", 2, "2026-10-20T15:30:00Z"),
    update("comment-8", 2, "2026-10-19T10:00:00Z"),
    update("comment-7", 2, "2026-10-14T21:10:00Z"),
    update("comment-1", 1, "2026-10-14T14:35:00Z"),
  ];
  expect(updatesByStep(updates).map((group) => [group.stepName, group.updates.map((item) => item.key)])).toEqual([
    ["Paso 2", ["comment-9", "comment-8", "comment-7"]],
    ["Paso 1", ["comment-1"]],
  ]);
});

test("a step that gets news again after another step shows again, so the timeline keeps its order", () => {
  const updates = [
    update("comment-7", 3, "2026-10-22T09:00:00Z"),
    update("comment-6", 2, "2026-10-21T09:00:00Z"),
    update("comment-5", 3, "2026-10-20T09:00:00Z"),
  ];
  const groups = updatesByStep(updates);
  expect(groups.map((group) => group.stepId)).toEqual([3, 2, 3]);
  expect(groups.flatMap((group) => group.updates)).toEqual(updates);
  expect(new Set(groups.map((group) => group.key)).size).toBe(groups.length);
});

test("the next move shows its date in the company's zone or that it is still to be set", () => {
  expect(nextStepDateLabel("2026-11-04T03:00:00Z", "America/Lima")).toBe("03/NOV/2026");
  expect(nextStepDateLabel("2026-11-04T03:00:00Z", "Europe/Madrid")).toBe("04/NOV/2026");
  expect(nextStepDateLabel(null, "America/Lima")).toBe("Fecha por definir");
});
