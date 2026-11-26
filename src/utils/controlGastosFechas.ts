import moment from "moment";
import type { FiltroControlGastosRaiz } from "@/types/app";
import { yearToDate } from "@/utils/dates";

type Fechas = Pick<
  FiltroControlGastosRaiz,
  | "fechadisponibilidaddesde"
  | "fechadisponibilidadhasta"
  | "fechaetddesde"
  | "fechaetdhasta"
  | "fechaetadesde"
  | "fechaetahasta"
  | "fechalibrealmacenajedesde"
  | "fechalibrealmacenajehasta"
>;

// Los rangos de fecha del listado de Control de Gastos (mismo orden que el panel Filtrar).
export const RANGOS_CONTROL_GASTOS = [
  { nombre: "Fecha Disponibilidad", desde: "fechadisponibilidaddesde", hasta: "fechadisponibilidadhasta" },
  { nombre: "Fecha ETD", desde: "fechaetddesde", hasta: "fechaetdhasta" },
  { nombre: "Fecha ETA", desde: "fechaetadesde", hasta: "fechaetahasta" },
  { nombre: "Fecha Libre de Almacenaje", desde: "fechalibrealmacenajedesde", hasta: "fechalibrealmacenajehasta" },
] as const satisfies readonly { nombre: string; desde: keyof Fechas; hasta: keyof Fechas }[];

// Por defecto: disponibilidad desde el 1 de enero hasta hoy; el resto sin límite.
export const fechasPorDefecto = (): Fechas => {
  const { desde, hasta } = yearToDate();
  return {
    fechadisponibilidaddesde: desde,
    fechadisponibilidadhasta: hasta,
    fechaetddesde: null,
    fechaetdhasta: null,
    fechaetadesde: null,
    fechaetahasta: null,
    fechalibrealmacenajedesde: null,
    fechalibrealmacenajehasta: null,
  };
};

// Exportar: al menos un rango completo y cada rango usado de máximo un año. null = se puede exportar.
export const problemaRangoExportar = (filtro: Fechas): string | null => {
  let completos = 0;
  for (const rango of RANGOS_CONTROL_GASTOS) {
    const desde = filtro[rango.desde];
    const hasta = filtro[rango.hasta];
    if (!desde && !hasta) continue;
    if (!desde || !hasta) return `Para exportar completa ${rango.nombre} Desde y Hasta.`;
    if (moment(hasta).isBefore(desde)) return `En ${rango.nombre}, la fecha Hasta no puede ser anterior a Desde.`;
    if (moment(hasta).isAfter(moment(desde).add(1, "year"))) {
      return `Puedes exportar hasta 1 año a la vez. Reduce el rango de ${rango.nombre}.`;
    }
    completos++;
  }
  return completos ? null : "Para exportar elige un rango de fechas (Disponibilidad, ETD, ETA o Libre de Almacenaje) de máximo 1 año.";
};
