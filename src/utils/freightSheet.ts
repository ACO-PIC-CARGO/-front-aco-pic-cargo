import moment from "moment";
import type { Row } from "read-excel-file/browser";
import type { FilaCargaFlete } from "@/types/calculadora";

const REQUIRED_HEADERS = [
  "pais_origen",
  "puerto_origen",
  "pais_destino",
  "puerto_destino",
  "flete_0_5",
  "flete_5_10",
  "flete_10_15",
  "moneda",
  "vigencia",
] as const;

type Header = (typeof REQUIRED_HEADERS)[number];

export interface FreightSheet {
  rows: FilaCargaFlete[];
  missingHeaders: Header[];
}

const upperOrNull = (value: unknown) => (value ? String(value).toUpperCase() : null);
const validityText = (value: unknown) =>
  value instanceof Date ? moment.utc(value).format("YYYY-MM-DD") : String(value ?? "").trim();

export function readFreightSheet(sheet: Row[]): FreightSheet {
  const [header = [], ...body] = sheet;
  const columns = header.map((cell) => String(cell ?? "").trim().toLowerCase());
  const missingHeaders = REQUIRED_HEADERS.filter((name) => !columns.includes(name));
  if (missingHeaders.length) return { rows: [], missingHeaders };

  const cell = (row: Row, name: Header) => row[columns.indexOf(name)];
  return {
    missingHeaders,
    rows: body.map((row) => ({
      pais_origen: cell(row, "pais_origen"),
      puerto_origen: upperOrNull(cell(row, "puerto_origen")),
      pais_destino: cell(row, "pais_destino"),
      puerto_destino: upperOrNull(cell(row, "puerto_destino")),
      flete_0_5: cell(row, "flete_0_5"),
      flete_5_10: cell(row, "flete_5_10"),
      flete_10_15: cell(row, "flete_10_15"),
      moneda: cell(row, "moneda"),
      vigencia: validityText(cell(row, "vigencia")),
    })),
  };
}
