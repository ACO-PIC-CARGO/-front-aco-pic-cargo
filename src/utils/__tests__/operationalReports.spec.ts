import { describe, expect, test } from "vitest";
import { recentYears, reportDay, yearMonths } from "@/utils/operationalReports";

const month = (mes: string, total_pr: number) => ({
  mes,
  nombre_mes: "x",
  total_pr,
  total_op: total_pr,
  total_individuales: 1,
  total_grupales: 0,
  total_house_individuales: 1,
  total_house_grupales: 0,
});

describe("operational reports helpers", () => {
  test("a missing date reads 'Sin fecha' instead of an invalid date", () => {
    expect(reportDay(null)).toBe("Sin fecha");
    expect(reportDay("")).toBe("Sin fecha");
    expect(reportDay("2026-03-05")).toMatch(/^05-mar.*2026$/);
  });

  test("the profit table always lists the twelve months, with zeros for months without files", () => {
    const months = yearMonths([month("03", 50), month("11", 70)]);

    expect(months.map((row) => row.mes)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]);
    expect(months.map((row) => Number(row.total_pr))).toEqual([0, 0, 50, 0, 0, 0, 0, 0, 0, 0, 70, 0]);
    expect(months[0]).toMatchObject({ nombre_mes: "Enero", total_individuales: 0, total_house_grupales: 0 });
    expect(months[2]!.nombre_mes).toBe("Marzo");
  });

  test("the year pickers offer this year and the nine before it", () => {
    const thisYear = new Date().getFullYear();

    expect(recentYears()).toEqual(Array.from({ length: 10 }, (_, index) => thisYear - index));
  });
});
