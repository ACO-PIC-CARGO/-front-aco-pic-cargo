import type { ApiResponse } from "@/types/api";

export const VISIBILITY_METRICS = [
  { value: "weight_per_package", title: "Peso por bulto (kg)" },
  { value: "total_weight", title: "Peso total (kg)" },
  { value: "total_volume", title: "Volumen total (m³)" },
] as const;

export const VISIBILITY_COMPARISONS = [
  { value: "greater_than", title: "Mayor que" },
  { value: "less_than", title: "Menor que" },
] as const;

export type VisibilityMetric = (typeof VISIBILITY_METRICS)[number]["value"];
export type VisibilityComparison = (typeof VISIBILITY_COMPARISONS)[number]["value"];

export interface VisibilityCondition {
  metric: VisibilityMetric;
  comparison: VisibilityComparison;
  value: number;
}

export interface VisibilityConditionDraft {
  metric: VisibilityMetric;
  comparison: VisibilityComparison;
  value: number | string | null;
}

export interface SpecialRateNoticeText {
  title: string;
  intro: string;
  conditions: string[];
  side_text: string;
}

export interface SpecialRateNotice extends SpecialRateNoticeText {
  active: boolean;
  visibility_conditions: VisibilityCondition[];
}

export interface SpecialRateNoticeToSave extends SpecialRateNoticeText {
  active: boolean;
  visibility_conditions: (Omit<VisibilityCondition, "value"> & { value: number | null })[];
}

export interface CargoMeasures {
  packages: unknown;
  weight: unknown;
  volume: unknown;
}

export const cargoMeasuresOf = (cargo: { numerobultos?: unknown; peso?: unknown; volumen?: unknown }): CargoMeasures => ({
  packages: cargo.numerobultos,
  weight: cargo.peso,
  volume: cargo.volumen,
});

const isMetric = (value: unknown): value is VisibilityMetric => VISIBILITY_METRICS.some((metric) => metric.value === value);
const isComparison = (value: unknown): value is VisibilityComparison =>
  VISIBILITY_COMPARISONS.some((comparison) => comparison.value === value);

const isVisibilityCondition = (item: unknown): item is VisibilityCondition => {
  const condition = item as Partial<VisibilityCondition> | null;
  return (
    !!condition &&
    isMetric(condition.metric) &&
    isComparison(condition.comparison) &&
    typeof condition.value === "number" &&
    Number.isFinite(condition.value)
  );
};

export const noticeFromResponse = (response: ApiResponse<SpecialRateNotice[]>): SpecialRateNotice | null => {
  const row = response.estadoflag ? response.data[0] : undefined;
  if (!row) return null;
  return {
    ...row,
    conditions: row.conditions.filter((item) => typeof item === "string"),
    visibility_conditions: Array.isArray(row.visibility_conditions) ? row.visibility_conditions.filter(isVisibilityCondition) : [],
  };
};

export const conditionsFromText = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const conditionsToText = (conditions: string[]): string => conditions.join("\n");

export const visibilityConditionsToSave = (drafts: VisibilityConditionDraft[]): SpecialRateNoticeToSave["visibility_conditions"] =>
  drafts.map(({ metric, comparison, value }) => ({
    metric,
    comparison,
    value: value === "" || value === null ? null : Number(value),
  }));

const positiveNumber = (value: unknown): number | null => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const MEASURES: Record<VisibilityMetric, (cargo: CargoMeasures) => number | null> = {
  total_weight: (cargo) => positiveNumber(cargo.weight),
  total_volume: (cargo) => positiveNumber(cargo.volume),
  weight_per_package: (cargo) => {
    const weight = positiveNumber(cargo.weight);
    const packages = positiveNumber(cargo.packages);
    return weight !== null && packages !== null ? weight / packages : null;
  },
};

const isMet = ({ metric, comparison, value }: VisibilityCondition, cargo: CargoMeasures) => {
  const measure = MEASURES[metric](cargo);
  if (measure === null) return false;
  return comparison === "greater_than" ? measure > value : measure < value;
};

export const isVisible = (notice: SpecialRateNotice | null, cargo: CargoMeasures): notice is SpecialRateNotice =>
  notice?.active === true && notice.visibility_conditions.some((condition) => isMet(condition, cargo));
