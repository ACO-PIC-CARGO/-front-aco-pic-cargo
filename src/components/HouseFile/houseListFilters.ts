import type { FiltroExpedientesRaiz, TipoEmbarqueRaiz } from "@/types/app";

export const emptyHouseFilter = (): FiltroExpedientesRaiz =>
  ({
    fecha_etd_desde: null,
    fecha_eta_desde: null,
    fecha_etd_hasta: null,
    fecha_eta_hasta: null,
  }) as FiltroExpedientesRaiz;

export const houseListParams = (filter: FiltroExpedientesRaiz): Record<string, unknown> => {
  const params: Record<string, unknown> = {
    id_master: filter.id_master,
    id_modality: filter.id_sentido,
    id_shipment: (filter.id_tipo_embarque as TipoEmbarqueRaiz | null)?.id,
    id_origin: filter.id_origen,
    id_destino: filter.id_destino,
    id_cliente: filter.id_cliente,
    fecha_etd_desde: filter.fecha_etd_desde,
    fecha_etd_hasta: filter.fecha_etd_hasta,
    fecha_eta_desde: filter.fecha_eta_desde,
    fecha_eta_hasta: filter.fecha_eta_hasta,
  };
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== ""));
};
