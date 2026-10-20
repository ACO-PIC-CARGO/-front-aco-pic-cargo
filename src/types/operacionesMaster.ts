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
