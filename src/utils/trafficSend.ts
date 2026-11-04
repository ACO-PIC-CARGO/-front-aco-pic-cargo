import type { QuoteKind } from "@/types/traffic";

export type SendTarget = "OPERATIONS" | "TRAFFIC";

export interface TrafficFileOfQuote {
  id_traffic: number;
  code_traffic: string;
  id_house: number;
  sent: boolean;
}

export const SEND_TARGET_LABELS: Record<SendTarget, string> = {
  OPERATIONS: "Enviar a Operaciones",
  TRAFFIC: "Enviar a Tráfico",
};

export const sendTargetsFor = (approved: boolean, trafficFile: TrafficFileOfQuote | null): SendTarget[] => {
  if (trafficFile) return trafficFile.sent ? [] : ["OPERATIONS"];
  return approved ? [] : ["OPERATIONS", "TRAFFIC"];
};

export const trafficStatusLabel = ({ sent_at, status_name }: { sent_at: string | null; status_name: string | null }) =>
  sent_at ? "Enviado a operaciones" : status_name || "Sin estatus";

const lastDayOf = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, monthNumber!, 0)).toISOString().slice(0, 10);
};

export const monthsToRange = (months: string[]): { desde: string | null; hasta: string | null } => {
  if (!months.length) return { desde: null, hasta: null };
  const sorted = [...months].sort();
  return { desde: `${sorted[0]}-01`, hasta: lastDayOf(sorted[sorted.length - 1]!) };
};

export const quoteRouteOf = ({ quote_kind, id_quote }: { quote_kind: QuoteKind; id_quote: number }, step?: number) => ({
  name: quote_kind === "ADUANA" ? "VerAduana" : "verQuote",
  params: step ? { id: id_quote, step } : { id: id_quote },
});

export interface MasterChoice {
  isNew: boolean;
  availability: string;
  masterId: number | null;
}

export const masterChoiceProblem = ({ isNew, availability, masterId }: MasterChoice, today: string) => {
  if (!isNew) return masterId ? "" : "Elige el master al que se enlaza.";
  if (!availability) return "Elige la fecha de disponibilidad del master.";
  return availability > today ? "" : "La fecha de disponibilidad debe ser posterior a hoy.";
};
