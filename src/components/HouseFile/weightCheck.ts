import type { HouseTrackingStep, StepDialogMode, WeightCheckResult } from "@/types/houseTracking";

const NOT_REGISTERED = "sin registrar";
const weightNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, useGrouping: false });
const volumeNumber = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

export const formatWeight = (value: number | null): string =>
  value === null ? NOT_REGISTERED : `${weightNumber.format(value)} kg`;

export const formatVolume = (value: number | null): string =>
  value === null ? NOT_REGISTERED : `${volumeNumber.format(value)} m³`;

const summaryLine = (name: string, confirmed: string, quoted: string, changed: boolean) => ({
  label: `${name} confirmado: ${confirmed} (${changed ? `cotizado: ${quoted}` : "igual al cotizado"})`,
  changed,
});

export const weightCheckSummary = (result: WeightCheckResult) => [
  summaryLine("Peso", formatWeight(result.weight), formatWeight(result.quoted_weight), result.weight !== result.quoted_weight),
  summaryLine(
    "Volumen",
    formatVolume(result.volume),
    formatVolume(result.quoted_volume),
    result.volume !== result.quoted_volume,
  ),
];

export const needsWeightCheck = (step: Pick<HouseTrackingStep, "validation" | "confirmed_at">, mode: StepDialogMode) =>
  mode === "confirm" && !step.confirmed_at && step.validation?.code === "weight_volume";

export const quotedValue = (value: number | string | null | undefined): number | null => {
  const quoted = Number(value);
  return value !== "" && quoted > 0 ? quoted : null;
};
