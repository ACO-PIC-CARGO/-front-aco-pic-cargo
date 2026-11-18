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

export function priorityChipStyle(color: string | null): PriorityChipStyle | null {
  if (!color) return null;
  return luminance(color) > LIGHT_LUMINANCE
    ? { background: color, color: "#1f2937", border: "1px solid #9ca3af" }
    : { background: color, color: "#ffffff", border: "none" };
}
