export interface FilaExcelConsolidacion {
  fecha: string;
  nroop: unknown;
  monto: string;
}

export interface HouseDeMaster {
  id: number;
  id_orders?: number;
  code_house?: string;
  nro_hbl?: string;
  peso?: number | string;
  volumen?: number | string;
  id_incoterms?: number;
  incoterm?: string;
  nameincoterm?: string;
  incoterms?: string;
  name_incoterm?: string;
}

export interface CotizacionParaMaster {
  id_modality?: number;
  id_shipment?: number;
  id_incoterms?: number;
  id_port_begin?: number;
  id_port_end?: number;
  fecha_fin?: string;
  id_vendedor?: number;
}

export interface ComentarioListadoMaster {
  fecha?: string;
  ejecutivo?: string;
  comentario?: string;
}

export interface HouseListadoMaster {
  id_house: number;
  code_house?: string;
  namelong?: string;
}

export interface MasterListado {
  id: number;
  list_comentarios: ComentarioListadoMaster[];
  list_houses: HouseListadoMaster[];
  codigo01?: string;
  descripcion_canal?: string;
  statuslock?: number | boolean;
  statuslockadm?: number | boolean;
  code_master?: string;
  status?: number;
  statusLock?: number;
  statusLockAdm?: number;
  background?: string;
  fecha_etd?: string | null;
  fecha_eta?: string | null;
  fecha_disponibilidad?: string | null;
  salidaflag?: boolean;
  llegadaflag?: boolean;
  disponibilidadflag?: boolean;
  url_folderonedrive?: string;
}
