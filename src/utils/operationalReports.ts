import moment from "moment";
import type { TotalMasterMesReporte } from "@/types/reportes";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const YEARS_OFFERED = 10;

export const reportDay = (fecha: string | null): string =>
  fecha ? moment(fecha).locale("es").format("DD-MMM-YYYY") : "Sin fecha";

export const yearMonths = (rows: TotalMasterMesReporte[]): TotalMasterMesReporte[] =>
  MONTH_NAMES.map((nombre_mes, index) => {
    const mes = String(index + 1).padStart(2, "0");
    const row = rows.find((candidate) => String(candidate.mes) === mes);
    return {
      total_pr: 0,
      total_op: 0,
      total_individuales: 0,
      total_grupales: 0,
      total_house_individuales: 0,
      total_house_grupales: 0,
      ...row,
      mes,
      nombre_mes,
    };
  });

export const recentYears = (): number[] =>
  Array.from({ length: YEARS_OFFERED }, (_, index) => new Date().getFullYear() - index);
