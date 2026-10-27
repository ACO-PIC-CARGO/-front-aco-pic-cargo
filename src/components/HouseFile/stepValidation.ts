import moment from "moment-timezone";
import { SHORT_MONTHS, shortDate } from "@/utils/dates";
import { stepDateTimeLabel, toDateAndTime } from "./houseTrackingFormat";
import { weightCheckSummary } from "./weightCheck";
import type { HouseTrackingStep, StepDialogMode } from "@/types/houseTracking";

export interface StepValidationLine {
  label: string;
  warning: boolean;
  icon: string;
}

type StepWithValidity = Pick<HouseTrackingStep, "quote_validity">;

const validUntilLabel = (validUntil: string) => shortDate(moment(validUntil, "YYYY-MM-DD"));
const stepDateOf = (step: Pick<HouseTrackingStep, "confirmed_at" | "scheduled_at">) => step.confirmed_at ?? step.scheduled_at;

const pastValidity = (step: StepWithValidity, at: string, timeZone: string) =>
  step.quote_validity !== null && toDateAndTime(at, timeZone).date > step.quote_validity.valid_until;

export const quoteExpiredOn = (step: StepWithValidity, at: string, timeZone: string): boolean =>
  pastValidity(step, at, timeZone) && !step.quote_validity!.kept_at;

export const skipStillSaves = (step: Pick<HouseTrackingStep, "confirmed_at">, mode: StepDialogMode): boolean =>
  mode === "date" || Boolean(step.confirmed_at);

export const authorizationLabel = (at: moment.MomentInput, timeZone: string): string => {
  const date = moment.tz(at, timeZone);
  return `${date.format("D")} ${SHORT_MONTHS[date.month()]!.toLowerCase()}. ${date.format("YYYY")}, ${date.format("HH:mm")}`;
};

const quoteLine = (step: HouseTrackingStep, timeZone: string): StepValidationLine | null => {
  const validity = step.quote_validity;
  if (!validity) return null;
  if (validity.kept_at) {
    return {
      label: `Tarifa mantenida por ${validity.kept_by} el ${stepDateTimeLabel(validity.kept_at, timeZone)}`,
      warning: false,
      icon: "mdi-file-check-outline",
    };
  }
  const stepDate = stepDateOf(step);
  if (!stepDate || !pastValidity(step, stepDate, timeZone)) return null;
  return {
    label: `La fecha de salida supera la vigencia de la cotización (vence ${validUntilLabel(validity.valid_until)}).`,
    warning: true,
    icon: "mdi-alert",
  };
};

export const stepValidationLines = (step: HouseTrackingStep, timeZone: string): StepValidationLine[] => {
  if (step.validation_result_code === "weight_volume" && step.validation_result) {
    return weightCheckSummary(step.validation_result).map(({ label, changed }) => ({
      label,
      warning: changed,
      icon: "mdi-scale-balance",
    }));
  }
  const line = quoteLine(step, timeZone);
  return line ? [line] : [];
};

export const quoteValidityBadge = (steps: HouseTrackingStep[], today: string): { label: string; warning: boolean } | null => {
  const validity = steps.find((step) => step.quote_validity && today > step.quote_validity.valid_until)?.quote_validity;
  if (!validity) return null;
  const label = `Cotización vencida el ${validUntilLabel(validity.valid_until)}`;
  return validity.kept_at ? { label: `${label} · Tarifa mantenida`, warning: false } : { label, warning: true };
};
