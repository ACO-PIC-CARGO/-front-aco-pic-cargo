import http from "@/api/http";
import type { ApiResponse } from "@/types/api";

export type QuoteNoticeKind = "pricing_request" | "sent_to_client" | "returned";

export interface QuoteNotice {
  notification_id: number | string;
  kind: QuoteNoticeKind;
  branch_id: number;
  quote_id: number;
  quote_code: string;
  client_name: string | null;
  created_by_name: string | null;
  pricing_notes: string | null;
  created_at: string;
  client_phone: string | null;
  transport_name: string | null;
  shipment_name: string | null;
  individual_flag: boolean;
  group_flag: boolean;
  containers: { name?: string | null }[];
  origin: string | null;
  goods_value: number | null;
  weight: number | null;
  volume: number | null;
  priority_name?: string | null;
  priority_color?: string | null;
  return_reason?: string | null;
}

const url = (path: string) => `${import.meta.env.VITE_URL_MAIN}${path}`;

export async function listPendingQuoteNotifications(): Promise<QuoteNotice[]> {
  const { data } = await http<ApiResponse<QuoteNotice[]>>({ method: "get", url: url("quote_notifications/pending") });
  return data.estadoflag ? data.data : [];
}

export async function markQuoteNotificationSeen(notificationId: number | string): Promise<void> {
  await http({ method: "put", url: url(`quote_notifications/${notificationId}/seen`) });
}

/** Aviso guardado de una cotización nueva del bot / calculadora (function_cotizacion_aviso_pendientes) */
export interface CotizacionAvisoPendiente {
  codigo: string;
  fuente: "bot" | "calculadora";
  id_branch: number;
  id_cotizacion: number;
  nro_cotizacion: string;
  cliente: string | null;
  telefono: string | null;
  puerto_origen: string | null;
  tipo: string | null;
  contenedor: string | null;
  cantidad_contenedor: number | null;
  volumen: string | null;
  peso: string | null;
  valor_mercancia: string | null;
  tieneindividualflag: boolean | null;
  tienegrupalflag: boolean | null;
  fecha_registro: string | null;
}

// Cotizaciones nuevas que este usuario aún no vio (al abrir ACO o al reconectarse)
export async function listPendingCotizacionAvisos(): Promise<CotizacionAvisoPendiente[]> {
  const { data } = await http<ApiResponse<CotizacionAvisoPendiente[]>>({ method: "get", url: url("cotizacion_avisos/pendientes") });
  return data.estadoflag ? data.data : [];
}

// "VER": queda visto para este usuario (se valida por el código del aviso)
export async function markCotizacionAvisoVisto(codigo: string): Promise<void> {
  await http({ method: "put", url: url(`cotizacion_avisos/${encodeURIComponent(codigo)}/visto`) });
}
