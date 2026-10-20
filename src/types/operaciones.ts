import type { ArchivoSubido } from "@/types/archivos";

export interface ComentarioHouse {
  fecha?: string;
  comentario?: string;
  nombre?: string;
}

export interface HouseDetalle {
  id?: number;
  id_master?: number;
  id_operador?: number | string;
  nro_hbl?: string;
  consigner?: string;
  code_master?: string;
  code_house?: string;
  modality?: string;
  id_modality?: number | string;
  id_shipment?: number | string;
  id_port_begin?: number | string;
  id_port_end?: number | string;
  id_proveedor?: number | string;
  id_consigner?: number | string;
  emailaddress_clientefinal?: string;
  fecha_etd?: string;
  fecha_eta?: string;
  bultos?: number | string;
  peso?: number | string;
  volumen?: number | string;
  monto?: number | string;
  cantidad_houses_x_master?: number;
  list_comentarios?: ComentarioHouse[];
}

export interface FiltroHouseConsulta {
  id_branch?: number;
  [campo: string]: unknown;
}

export interface FacturaFiscal {
  estadoflag?: boolean;
  originalname?: string;
  type?: string;
  tipo_pago?: number;
  path?: string;
}

export interface HouseFacturable {
  id_house?: number | string;
  id_correlativo?: number | string;
}

export interface ArchivoCargado extends ArchivoSubido {
  insertid: number;
  ruta: string;
}

export interface ComentarioMaster {
  id_entitie?: number;
  id_master?: number;
  fecha?: number | string;
  comentario?: number | string;
}

export interface FilaConsolidacion {
  fecha_operacion_sistema?: string;
  fecha_operacion_banco?: string;
  name_proveedor?: string;
  monto_sistema?: number | string;
  monto_banco?: number | string;
  nro_operacion?: string;
}

export interface ConfigAviso {
  aviso_llegada?: string;
  aviso_llegada_original?: string;
}
