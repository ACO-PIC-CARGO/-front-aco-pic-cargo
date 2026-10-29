import moment from "moment-timezone";
import { SHORT_MONTHS, inTimeZone, shortDate } from "@/utils/dates";
import type { HouseTrackingComment, HouseTrackingPhase, HouseTrackingStep, SendState, StepDialogMode } from "@/types/houseTracking";

export const dayMonth = (iso: string, timeZone: string) => {
  const date = inTimeZone(iso, timeZone);
  return { day: date.format("DD"), month: SHORT_MONTHS[date.month()]! };
};

export const dateLabel = (iso: string | null, timeZone: string): string =>
  iso ? shortDate(inTimeZone(iso, timeZone)) : "–";

export const calendarDateLabel = (day: string | null | undefined): string =>
  day ? shortDate(moment(day, "YYYY-MM-DD")) : "—";

export const stepDateTimeLabel = (iso: string, timeZone: string): string => {
  const date = inTimeZone(iso, timeZone);
  return `${shortDate(date)} ${date.format("HH:mm")}`;
};

export const toDateAndTime = (value: moment.MomentInput, timeZone: string) => {
  const date = inTimeZone(value, timeZone);
  return { date: date.format("YYYY-MM-DD"), time: date.format("HH:mm") };
};

export const fromDateAndTime = (date: string, time: string, timeZone: string): string =>
  moment.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", timeZone).toISOString();

export const todayIn = (timeZone: string): string => moment.tz(timeZone).format("YYYY-MM-DD");

export const clientSteps = (phases: HouseTrackingPhase[]): HouseTrackingStep[] =>
  phases
    .flatMap((phase) => phase.steps)
    .filter((step) => step.visible_to_client && step.sent_at)
    .map((step) => ({ ...step, comments: step.comments.filter((comment) => comment.sent_at) }));

export const displayValue = (value: unknown, unit = ""): string =>
  value || value === 0 ? `${value}${unit}` : "—";

export const latestComment =(step: HouseTrackingStep): HouseTrackingComment | null => step.comments[0] ?? null;

export const trackingLink = (token: string, origin = window.location.origin): string => `${origin}/tracking/${token}`;

export const commentSendState = (step: HouseTrackingStep, comment: HouseTrackingComment): SendState => {
  if (!step.visible_to_client) return "internal";
  if (step.state !== "confirmed") return "blocked";
  return comment.sent_at && step.sent_at ? "sent" : "ready";
};

export const stepDialogPreset = (step: HouseTrackingStep, mode: StepDialogMode) => {
  if (mode === "date") return { title: `Fecha de «${step.name}»`, action: "Guardar fecha", initial: step.scheduled_at };
  if (step.confirmed_at) {
    return { title: `Corregir fecha de «${step.name}»`, action: "Guardar fecha", initial: step.confirmed_at };
  }
  return { title: `Confirmar «${step.name}»`, action: "Confirmar", initial: step.scheduled_at };
};
