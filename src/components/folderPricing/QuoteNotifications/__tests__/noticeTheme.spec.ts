import { expect, test } from "vitest";
import { noticeTheme } from "../noticeTheme";

test("without priority color the notice keeps the blue theme", () => {
  const theme = noticeTheme(null);
  expect(theme.headerBackground).toContain("#0b4fb0");
  expect(theme.headerText).toBe("#ffffff");
  expect(theme.accent).toBe("#1a6fe0");
});

test("a dark color paints the header and the accents with white header text", () => {
  const theme = noticeTheme("#dc2626");
  expect(theme.headerBackground).toBe("#dc2626");
  expect(theme.headerText).toBe("#ffffff");
  expect(theme.accent).toBe("#dc2626");
});

test("white stays readable on the white notice", () => {
  const theme = noticeTheme("#ffffff");
  expect(theme.headerBackground).toBe("#ffffff");
  expect(theme.headerText).not.toBe("#ffffff");
  expect(theme.headerBorder).not.toBe("none");
  expect(theme.accent).not.toBe("#ffffff");
});
