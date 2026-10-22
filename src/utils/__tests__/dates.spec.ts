import { expect, test } from "vitest";
import { inTimeZone, shortDate } from "@/utils/dates";

test("shortDate shows day, uppercase Spanish month and year without shifting date-only values", () => {
  expect(shortDate("2026-10-03")).toBe("03/OCT/2026");
  expect(shortDate(new Date(2026, 0, 15, 23, 59))).toBe("15/ENE/2026");
});

test("inTimeZone reads an instant as the wall time of the given zone, whatever the machine's zone", () => {
  expect(inTimeZone("2026-10-02T03:30:00Z", "America/Lima").format("YYYY-MM-DD HH:mm")).toBe("2026-10-01 22:30");
  expect(inTimeZone("2026-10-02T03:30:00Z", "America/Mexico_City").format("YYYY-MM-DD HH:mm")).toBe("2026-10-01 21:30");
  expect(shortDate(inTimeZone("2026-10-02T03:30:00Z", "America/Lima"))).toBe("01/OCT/2026");
});
