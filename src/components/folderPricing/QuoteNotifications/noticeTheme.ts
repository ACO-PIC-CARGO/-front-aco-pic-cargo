import { LIGHT_COLOR_TEXT, isLightColor, priorityChipStyle } from "../priorityColor";

export type NoticeTheme = {
  headerBackground: string;
  headerText: string;
  headerBorder: string;
  accent: string;
  tile: string;
  line: string;
};

export const BLUE_NOTICE_THEME: NoticeTheme = {
  headerBackground: "linear-gradient(180deg, #0b4fb0 0%, #083a8c 100%)",
  headerText: "#ffffff",
  headerBorder: "none",
  accent: "#1a6fe0",
  tile: "#dcebfb",
  line: "#d3dff0",
};

const NEUTRAL_TILE = "#f3f4f6";
const NEUTRAL_LINE = "#e5e7eb";

export function noticeTheme(color: string | null): NoticeTheme {
  const chip = priorityChipStyle(color);
  if (!color || !chip) return BLUE_NOTICE_THEME;
  const light = isLightColor(color);
  return {
    headerBackground: chip.background,
    headerText: chip.color,
    headerBorder: chip.border,
    accent: light ? LIGHT_COLOR_TEXT : color,
    tile: light ? NEUTRAL_TILE : `color-mix(in srgb, ${color} 15%, #fff)`,
    line: light ? NEUTRAL_LINE : `color-mix(in srgb, ${color} 25%, #fff)`,
  };
}
