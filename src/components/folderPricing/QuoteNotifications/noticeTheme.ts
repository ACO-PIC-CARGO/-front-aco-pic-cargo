import { priorityChipStyle } from "../priorityColor";

export type NoticeTheme = {
  headerBackground: string;
  headerText: string;
  headerBorder: string;
  accent: string;
};

const BLUE_THEME: NoticeTheme = {
  headerBackground: "linear-gradient(180deg, #0b4fb0 0%, #083a8c 100%)",
  headerText: "#ffffff",
  headerBorder: "none",
  accent: "#1a6fe0",
};

const READABLE_ON_WHITE = "#1f2937";

export function noticeTheme(color: string | null): NoticeTheme {
  const chip = priorityChipStyle(color);
  if (!chip) return BLUE_THEME;
  const isLight = chip.border !== "none";
  return {
    headerBackground: chip.background,
    headerText: chip.color,
    headerBorder: chip.border,
    accent: isLight ? READABLE_ON_WHITE : chip.background,
  };
}
