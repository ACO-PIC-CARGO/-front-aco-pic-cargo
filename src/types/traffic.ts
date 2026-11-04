export type QuoteKind = "PRICING" | "ADUANA";
export type TrafficState = "PENDING" | "SENT";

export interface TrafficFile {
  id_traffic: number;
  code_traffic: string;
  nro_traffic: number;
  id_house: number;
  code_house: string | null;
  quote_kind: QuoteKind;
  id_quote: number;
  quote_number: string | null;
  namemodality: string | null;
  nameportbegin: string | null;
  nameportend: string | null;
  nameconsigner: string | null;
  namepricing: string | null;
  id_status: number | null;
  status_name: string | null;
  created_at: string;
  sent_at: string | null;
  id_master: number | null;
  code_master: string | null;
}

export interface TrafficFilters {
  state?: TrafficState | null;
  status?: number | null;
  desde?: string | null;
  hasta?: string | null;
}

export interface TrafficStatus {
  id: number;
  name: string;
  position: number;
}

export interface TrafficStatusForm {
  id?: number | null;
  name: string;
  position?: number | null;
}

export interface TrafficCorrelative {
  correlativo: number | null;
  last_used: number;
  next_code: string;
}

export interface TrafficSendPayload {
  quote_kind: QuoteKind;
  id_quote: number | string;
  totalIngreso: unknown;
  igvIngreso: unknown;
  valorIngreso: unknown;
  id_opcion: unknown;
  listCostosInstructivo: unknown[];
  listVentasInstructivo: unknown[];
}

export interface TrafficSent {
  id_traffic: number;
  code_traffic: string;
  id_house: number;
}

export interface TrafficToOperationsPayload {
  nuevoexpediente: boolean;
  id_exp: number | string | null;
  fecha_validez: string | null;
}

export interface TrafficToOperations {
  code_master: string;
  id_master: number;
  id_house: number;
}

export interface TrafficFileOfHouse {
  id_traffic: number;
  code_traffic: string;
  id_house: number;
  quote_kind: QuoteKind;
  id_quote: number;
  sent: boolean;
}

export interface TrafficMasterOption {
  id: number;
  code_master: string;
}
