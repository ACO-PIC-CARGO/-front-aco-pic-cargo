import type { TrafficFilters, TrafficState } from "@/types/traffic";
import { monthsToRange } from "@/utils/trafficSend";

export interface TrafficReportForm {
  state: TrafficState | null;
  status: number | null;
  sentido: number | null;
  id_operador: number | null;
  months: string[];
  desde: string | null;
  hasta: string | null;
}

const MONTHS_OFFERED = 24;
const monthName = new Intl.DateTimeFormat("es", { month: "long", timeZone: "UTC" });

export const recentMonths = (today = new Date()) =>
  Array.from({ length: MONTHS_OFFERED }, (_, monthsBack) => {
    const month = new Date(Date.UTC(today.getFullYear(), today.getMonth() - monthsBack, 1));
    const name = monthName.format(month);
    return { value: month.toISOString().slice(0, 7), title: `${name.charAt(0).toUpperCase()}${name.slice(1)} ${month.getUTCFullYear()}` };
  });

export const toTrafficFilters = ({ months, desde, hasta, ...choice }: TrafficReportForm): TrafficFilters => ({
  ...choice,
  ...(months.length ? monthsToRange(months) : { desde, hasta }),
});
