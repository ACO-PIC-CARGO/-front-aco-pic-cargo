export type PriorityChipStyle = {
  background: string;
  color: string;
  border: string;
};

const LIGHT_LUMINANCE = 0.6;

const channel = (hex: string, start: number): number => {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);

export const LIGHT_COLOR_TEXT = "#1f2937";
export const LIGHT_COLOR_BORDER_COLOR = "#9ca3af";

export const isLightColor = (hex: string): boolean => luminance(hex) > LIGHT_LUMINANCE;

export function priorityChipStyle(color: string | null): PriorityChipStyle | null {
  if (!color) return null;
  return isLightColor(color)
    ? { background: color, color: LIGHT_COLOR_TEXT, border: `1px solid ${LIGHT_COLOR_BORDER_COLOR}` }
    : { background: color, color: "#ffffff", border: "none" };
}
