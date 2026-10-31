import { describe, expect, test } from "vitest";
import { readFreightSheet } from "@/utils/freightSheet";

// read-excel-file types a date cell as the Date constructor although it holds a Date instance.
const dateCell = (date: Date) => date as unknown as typeof Date;
const HEADERS = ["pais_origen", "puerto_origen", "pais_destino", "puerto_destino", "flete_0_5", "flete_5_10", "flete_10_15", "moneda", "vigencia"];

describe("readFreightSheet", () => {
  test("reads each value from the column with its header, whatever the column order", () => {
    const reordered = ["flete_10_15", "vigencia", "pais_origen", "flete_5_10", "puerto_origen", "pais_destino", "flete_0_5", "puerto_destino", "moneda"];

    const sheet = readFreightSheet([reordered, [30, "2026-12-31", "China", 20, "ningbo", "Peru", 10, "callao", "USD"]]);

    expect(sheet.missingHeaders).toEqual([]);
    expect(sheet.rows).toEqual([
      {
        pais_origen: "China",
        puerto_origen: "NINGBO",
        pais_destino: "Peru",
        puerto_destino: "CALLAO",
        flete_0_5: 10,
        flete_5_10: 20,
        flete_10_15: 30,
        moneda: "USD",
        vigencia: "2026-12-31",
      },
    ]);
  });

  test("matches headers ignoring case and surrounding spaces", () => {
    const sheet = readFreightSheet([HEADERS.map((header) => ` ${header.toUpperCase()} `), ["China", "a", "Peru", "b", 1, 2, 3, "USD", "2026-12-31"]]);

    expect(sheet.missingHeaders).toEqual([]);
    expect(sheet.rows[0]!.flete_10_15).toBe(3);
  });

  test("names every required header the file lacks and reads no rows", () => {
    const sheet = readFreightSheet([HEADERS.filter((header) => header !== "flete_5_10" && header !== "vigencia"), ["China"]]);

    expect(sheet.missingHeaders).toEqual(["flete_5_10", "vigencia"]);
    expect(sheet.rows).toEqual([]);
  });

  test("writes a date cell as its calendar day and keeps a typed validity as written", () => {
    const sheet = readFreightSheet([
      HEADERS,
      ["China", "a", "Peru", "b", 1, 2, 3, "USD", dateCell(new Date(Date.UTC(2026, 11, 31)))],
      ["China", "a", "Peru", "b", 1, 2, 3, "USD", " 31/12/2026 "],
    ]);

    expect(sheet.rows.map((row) => row.vigencia)).toEqual(["2026-12-31", "31/12/2026"]);
  });
});
