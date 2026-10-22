import moment from "moment-timezone";
import { shortDate } from "@/utils/dates";
import type { PublicTracking, PublicTrackingPhase } from "@/types/publicTracking";

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

export const nextArrival = (tracking: PublicTracking): { port: string; eta: string } | null => {
  const delivered = tracking.phases.length > 0 && tracking.phases.every((phase) => phase.status === "completed");
  if (!tracking.eta || delivered) return null;
  return { port: tracking.destination_port || "destino", eta: tracking.eta };
};

export const transportIcon = (shipment: string | null): string => (shipment === "Aéreo" ? "mdi-airplane" : "mdi-ferry");

export const calendarDateLabel = (date: string): string => shortDate(moment(date, "YYYY-MM-DD"));
