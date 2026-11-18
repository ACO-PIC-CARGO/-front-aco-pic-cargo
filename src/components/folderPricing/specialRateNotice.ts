import type { ApiResponse } from "@/types/api";

export interface SpecialRateNotice {
  active: boolean;
  title: string;
  intro: string;
  conditions: string[];
  side_text: string;
}

export const noticeFromResponse = (response: ApiResponse<SpecialRateNotice[]>): SpecialRateNotice | null => {
  const row = response.estadoflag ? response.data[0] : undefined;
  if (!row) return null;
  return { ...row, conditions: row.conditions.filter((item) => typeof item === "string") };
};

export const conditionsFromText = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const conditionsToText = (conditions: string[]): string => conditions.join("\n");

export const isVisible = (notice: SpecialRateNotice | null): notice is SpecialRateNotice => notice?.active === true;
