import { inTimeZone, shortDate } from "@/utils/dates";
import type { PublicTrackingPhase } from "@/types/publicTracking";

export interface TrackingUpdate {
  key: string;
  stepId: number;
  stepName: string;
  icon: string;
  text: string;
  at: string;
}

export interface TrackingStepUpdates {
  key: string;
  stepId: number;
  stepName: string;
  icon: string;
  updates: TrackingUpdate[];
}

export const trackingUpdates = (phases: PublicTrackingPhase[]): TrackingUpdate[] =>
  phases
    .flatMap((phase) => phase.steps)
    .flatMap((step) => {
      const ofStep = { stepId: step.id, stepName: step.name, icon: step.icon };
      return [
        ...(step.confirmed_at ? [{ ...ofStep, key: `step-${step.id}`, text: "Completado", at: step.confirmed_at }] : []),
        ...step.comments.map((comment) => ({ ...ofStep, key: `comment-${comment.id}`, text: comment.comment, at: comment.created_at })),
      ];
    })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || b.key.localeCompare(a.key));

export const updatesByStep = (updates: TrackingUpdate[]): TrackingStepUpdates[] =>
  updates.reduce<TrackingStepUpdates[]>((groups, update) => {
    const current = groups[groups.length - 1];
    if (current?.stepId === update.stepId) current.updates.push(update);
    else groups.push({ key: update.key, stepId: update.stepId, stepName: update.stepName, icon: update.icon, updates: [update] });
    return groups;
  }, []);

export const nextStepDateLabel = (date: string | null, timeZone: string): string =>
  date ? shortDate(inTimeZone(date, timeZone)) : "Fecha por definir";
