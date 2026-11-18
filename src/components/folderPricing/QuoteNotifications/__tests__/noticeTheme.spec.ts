import { expect, test } from "vitest";
import { BLUE_NOTICE_THEME, noticeTheme } from "../noticeTheme";

test("without priority color the notice keeps the blue theme", () => {
  expect(noticeTheme(null)).toEqual(BLUE_NOTICE_THEME);
  expect(noticeTheme("#dc2626")).not.toEqual(BLUE_NOTICE_THEME);
});

test("a dark color paints the header and the accents with white header text", () => {
  const theme = noticeTheme("#dc2626");
  expect(theme.headerBackground).toBe("#dc2626");
  expect(theme.headerText).toBe("#ffffff");
  expect(theme.accent).toBe("#dc2626");
});

test("a dark color tints tiles and lines from that color", () => {
  const theme = noticeTheme("#dc2626");
  expect(theme.tile).toContain("#dc2626");
  expect(theme.line).toContain("#dc2626");
  expect(theme.tile).not.toBe(BLUE_NOTICE_THEME.tile);
  expect(theme.line).not.toBe(BLUE_NOTICE_THEME.line);
});

test("white stays readable on the white notice with neutral gray tiles", () => {
  const theme = noticeTheme("#ffffff");
  expect(theme.headerBackground).toBe("#ffffff");
  expect(theme.headerText).not.toBe("#ffffff");
  expect(theme.headerBorder).not.toBe("none");
  expect(theme.accent).not.toBe("#ffffff");
  expect(theme.tile).not.toContain("#ffffff");
  expect(theme.tile).not.toBe(BLUE_NOTICE_THEME.tile);
  expect(theme.line).not.toBe(BLUE_NOTICE_THEME.line);
});
