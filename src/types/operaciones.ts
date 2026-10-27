import type { ArchivoSubido } from "@/types/archivos";
import type { ComentarioEstadoHouse } from "@/types/catalogos";
import type { CotizacionListado, LineaInstructivo } from "@/types/cotizacion";

export interface ComentarioHouse {
  fecha?: string;
  ejecutivo?: string;
  comentario?: string;
  nombre?: string;
}

export interface HouseDetalle {
  id?: number;
  id_master?: number;
  id_operador?: number | string;
  nro_hbl?: string;
  consigner?: string;
  id_transport?: number | string;
  telexconfirmado?: boolean;
  fechaconfirmaciontelex?: string;
  id_incoterms?: number | string;
  id_cot?: number | string;
  id_quoteaduana?: number | string;
  id_notify?: number | string;
  id_aerolinea?: number | string;
  id_coloader?: number | string;
  id_vendedor?: number | string;
  id_pricing?: number | string;
  id_naviera?: number | string;
  id_motonave?: number | string;
  nro_viaje?: string;
  id_conditions?: number | string;
  id_moneda?: number | string;
  url_onedrive?: string;
  id_consigner_real?: number | string;
  itemshousecontainers?: unknown[];
  nro_declaracion_aduana?: string;
  canal_aduana?: string;
  services?: ServicioHouse[];
  token_rastreo?: string;
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
  shipment?: string;
  incoterms?: string;
  port_begin?: string;
  port_end?: string;
  aerolinea?: string;
  naviera?: string;
  coloader?: string;
  peso_cargable?: number | string;
  quote?: string;
  proveedor?: string;
  consigner_real?: string;
  notify?: string;
  motonave?: string;
  conditions?: string;
  moneda?: string;
}

export interface FiltroHouseConsulta {
  id_branch?: number;
  [campo: string]: unknown;
}

export interface FacturaFiscal {
  id?: number;
  estadoflag?: boolean;
  originalname?: string;
  type?: string;
  tipo_pago?: number;
  nro_factura?: string;
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

export interface RegistroBitacoraHouse {
  id: number;
  id_bitacora: number;
  namebitacora: string;
  comentario: string;
  date: string;
  visible_cliente: boolean | number;
  orden: number;
}

export interface BitacoraLinealHouse {
  id: number;
  orden: number;
  comentarios?: ComentarioEstadoHouse[];
}

export interface ServicioHouse {
  id?: number;
  id_begend?: number;
  namebegend?: string;
  position_begend?: number;
  nameservice?: string;
  status?: number | string | boolean;
  date_service?: string | null;
  updated_at?: string | null;
  created_at?: string;
  color?: string;
  showDatePicker?: boolean;
}

export interface ServicioPorIncoterm {
  id_begend: number;
  updated_at?: string | null;
  namebegend: string;
  position_begend: number;
  namegroupservice: string;
}

export interface HouseCambio {
  id: number;
  house: string;
}

export interface CotizacionAsociableHouse extends CotizacionListado {
  listIngresosInstructivo: LineaInstructivo[];
  listCostosInstructivo: LineaInstructivo[];
}

export interface ItemNotificacion {
  title: string;
  value: number;
}

export interface CuentaBancariaPic {
  id: number;
  label: string;
  cuenta: string;
  cci: string;
  symbol: string;
}

export interface PasoBitacoraTracking {
  id: number;
  fecha: string;
  namebitacora: string;
  comentario: string;
  visible_cliente: boolean | number;
}

export interface TrackingCarga {
  total_pasos_bitacora: number;
  pasos_bitacora: PasoBitacoraTracking[];
  nameshipment?: string;
  namelongshipment?: string;
  flagpais_portbegin?: string;
  flagpais_portend?: string;
  namelong_portbegin?: string;
  namelong_portend?: string;
}
