import { describe, expect, test } from "vitest";
import { recentMonths, toTrafficFilters } from "@/components/folderTraffic/trafficReportFilters";

describe("recentMonths", () => {
  test("offers the last 24 months, newest first, crossing years with Spanish labels", () => {
    const months = recentMonths(new Date(2026, 1, 15));

    expect(months[0]).toEqual({ value: "2026-02", title: "Febrero 2026" });
    expect(months[2]).toEqual({ value: "2025-12", title: "Diciembre 2025" });
    expect(months[months.length - 1]).toEqual({ value: "2024-03", title: "Marzo 2024" });
  });
});

describe("toTrafficFilters", () => {
  const form = {
    state: "PENDING" as const,
    status: 5,
    sentido: null,
    id_operador: null,
    months: [] as string[],
    desde: "2026-01-05",
    hasta: "2026-01-20",
  };

  test("sends the typed range when no month is chosen", () => {
    expect(toTrafficFilters(form)).toEqual({ state: "PENDING", status: 5, sentido: null, id_operador: null, desde: "2026-01-05", hasta: "2026-01-20" });
  });

  test("chosen months win over the typed range", () => {
    expect(toTrafficFilters({ ...form, months: ["2026-10", "2026-08"] })).toEqual({
      state: "PENDING",
      status: 5,
      sentido: null,
      id_operador: null,
      desde: "2026-08-01",
      hasta: "2026-10-31",
    });
  });
});
