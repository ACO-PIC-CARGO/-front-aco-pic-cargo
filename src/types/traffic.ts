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
  nameoperador: string | null;
  totalregistro?: string | number;
  totalenviados?: string | number;
  id_status: number | null;
  status_name: string | null;
  created_at: string;
  sent_at: string | null;
  id_master: number | null;
  code_master: string | null;
}

export interface TrafficPage {
  pagina: number;
  limit: number;
}

export interface TrafficFilters {
  state?: TrafficState | null;
  status?: number | null;
  desde?: string | null;
  hasta?: string | null;
  sentido?: number | null;
  id_operador?: number | null;
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
  manual: boolean;
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
  nro_traffic?: number | null;
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

export interface TrafficFileForm {
  id_consigner: number | null;
  id_modality: number | null;
  id_shipment: number | null;
  id_port_begin: number | null;
  id_port_end: number | null;
  id_incoterms: number | null;
  id_pricing: number | null;
  bultos: number | null;
  peso: number | null;
  volumen: number | null;
  nro_traffic: number | null;
}

export interface AssociableQuote {
  quote_kind: QuoteKind;
  id_quote: number;
}
