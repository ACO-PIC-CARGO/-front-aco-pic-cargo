import type { AssociableQuote, QuoteKind, TrafficFileForm, TrafficFileOfHouse } from "@/types/traffic";

export type SendTarget = "OPERATIONS" | "TRAFFIC";

export interface TrafficFileOfQuote {
  id_traffic: number;
  code_traffic: string;
  id_house: number;
  sent: boolean;
}

export const QUOTELESS_SEND_MESSAGE =
  "Este expediente no tiene cotización. Asóciale una desde el house para enviarlo a Operaciones.";

export const SEND_TARGET_LABELS: Record<SendTarget, string> = {
  OPERATIONS: "Enviar a Operaciones",
  TRAFFIC: "Enviar a Tráfico",
};

export const sendTargetsFor = (approved: boolean, trafficFile: TrafficFileOfQuote | null): SendTarget[] => {
  if (trafficFile || approved) return [];
  return ["OPERATIONS", "TRAFFIC"];
};

export const trafficEditLocked = (file: TrafficFileOfHouse | null | undefined, authorizedByAdmin: boolean) =>
  file === undefined || Boolean(file?.sent && !authorizedByAdmin);

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

const TRAFFIC_FILE_REQUIRED: [keyof TrafficFileForm, string][] = [
  ["id_consigner", "Elige el cliente."],
  ["id_modality", "Elige el sentido."],
  ["id_shipment", "Elige el tipo de embarque."],
  ["id_port_begin", "Elige el puerto de origen."],
  ["id_port_end", "Elige el puerto de destino."],
];

export const trafficFileProblem = (form: TrafficFileForm, manualNumber: boolean) => {
  const missing = TRAFFIC_FILE_REQUIRED.find(([field]) => !form[field]);
  if (missing) return missing[1];
  const number = form.nro_traffic;
  if (manualNumber && !(Number.isInteger(number) && Number(number) > 0)) return "Escribe el número de tráfico.";
  return "";
};

export const associableIdsOf = (quotes: AssociableQuote[]) => ({
  pricing: new Set(quotes.filter((quote) => quote.quote_kind === "PRICING").map((quote) => quote.id_quote)),
  aduana: new Set(quotes.filter((quote) => quote.quote_kind === "ADUANA").map((quote) => quote.id_quote)),
});
