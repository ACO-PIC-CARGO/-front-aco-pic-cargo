import moment from "moment-timezone";
import { SHORT_MONTHS, inTimeZone, shortDate } from "@/utils/dates";
import type { HouseTrackingComment, HouseTrackingPhase, HouseTrackingStep } from "@/types/houseTracking";

export const dayMonth = (iso: string, timeZone: string) => {
  const date = inTimeZone(iso, timeZone);
  return { day: date.format("DD"), month: SHORT_MONTHS[date.month()]! };
};

export const dateLabel = (iso: string | null, timeZone: string): string =>
  iso ? shortDate(inTimeZone(iso, timeZone)) : "–";

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
    .filter((step) => step.visible_to_client)
    .map((step) => ({ ...step, comments: step.comments.filter((comment) => comment.is_public) }));

export const latestComment = (step: HouseTrackingStep): HouseTrackingComment | null => step.comments[0] ?? null;

export const trackingLink = (token: string, origin = window.location.origin): string => `${origin}/tracking/${token}`;
