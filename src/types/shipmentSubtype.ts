export interface ShipmentSubtype {
  id: number;
  codigo: string;
  id_shipment: number;
  shipment: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ShipmentSubtypeForm {
  id: number | null;
  id_shipment: number | null;
  name: string;
}

/** Fixed codes in every branch: the quote logic tells Grupal from Individual by code, never by id or name. */
export const SUBTIPO_GRUPAL = "001";
export const SUBTIPO_INDIVIDUAL = "002";

/** Grupal and Individual exist in every branch and cannot be deleted. */
export const esSubTipoDelSistema = (codigo: string) => codigo === SUBTIPO_GRUPAL || codigo === SUBTIPO_INDIVIDUAL;
