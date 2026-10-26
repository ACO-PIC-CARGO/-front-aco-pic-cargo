import { inTimeZone, shortDate } from "@/utils/dates";
import type { PublicTrackingPhase } from "@/types/publicTracking";

export interface TrackingUpdate {
  key: string;
  icon: string;
  text: string;
  at: string;
}

export const trackingUpdates = (phases: PublicTrackingPhase[]): TrackingUpdate[] =>
  phases
    .flatMap((phase) => phase.steps)
    .flatMap((step) => [
      ...(step.confirmed_at ? [{ key: `step-${step.id}`, icon: step.icon, text: step.name, at: step.confirmed_at }] : []),
      ...step.comments.map((comment) => ({
        key: `comment-${comment.id}`,
        icon: step.icon,
        text: comment.comment,
        at: comment.created_at,
      })),
    ])
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || b.key.localeCompare(a.key));

export const nextStepDateLabel = (date: string | null, timeZone: string): string =>
  date ? shortDate(inTimeZone(date, timeZone)) : "Fecha por definir";
