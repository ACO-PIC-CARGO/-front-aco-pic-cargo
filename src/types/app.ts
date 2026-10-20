import type { ExpedienteItem, ProveedorItem } from "@/types/billingEntries";
import type { DetallePagoCliente } from "@/types/banks";
import type { DetallePagoProveedor } from "@/types/banksProveedor";
import type { ExpedienteMaster, Incoterm, Numerico, TipoCarga } from "@/types/cotizacion";
import type { ClienteListado, Operador, ProveedorPricing, RolProveedor } from "@/types/entidades";
import type { ComprobanteCuenta, ConceptoCuenta, MonedaCuenta } from "@/types/modulesPays";
import type { ComentarioHouse, HouseDetalle, RegistroBitacoraHouse } from "@/types/operaciones";
import type { HouseDeMaster } from "@/types/operacionesMaster";

export type FilaRaiz = Record<string, unknown>;

export interface FilaConIdRaiz {
  id: number;
  [campo: string]: unknown;
}

export interface TipoEmbarqueRaiz extends TipoCarga {
  id: number;
  code: string;
  id_transport: number;
}

export interface FiltroExpedientesRaiz {
  fecha_etd_desde: string | null;
  fecha_eta_desde: string | null;
  fecha_etd_hasta: string | null;
  fecha_eta_hasta: string | null;
  id_canal?: Numerico;
  id_sentido?: Numerico;
  id_tipo_embarque: TipoEmbarqueRaiz;
  id_origen?: Numerico;
  id_destino?: Numerico;
  id_agente?: Numerico;
  id_master?: Numerico;
  id_cliente?: Numerico;
  fecha_etd?: Numerico;
  fecha_eta?: Numerico;
  status_operativo?: Numerico;
  status_administrativo?: Numerico;
  pagina?: number;
  limite?: number;
  orden?: string;
  busqueda?: string;
  [campo: string]: unknown;
}

export interface FiltroControlGastosRaiz {
  id_tipo_embarque: TipoEmbarqueRaiz;
  id_canal?: Numerico;
  id_sentido?: Numerico;
  id_transport?: Numerico;
  id_origen?: Numerico;
  id_destino?: Numerico;
  id_agente?: Numerico;
  nro_mbl?: Numerico;
  fecha_etd?: Numerico;
  fecha_eta?: Numerico;
  status_operativo?: Numerico;
  status_administrativo?: Numerico;
  pagina?: number;
  limite?: number;
  [campo: string]: unknown;
}

export interface FiltroCargaMasterRaiz {
  idsentido?: Numerico;
  idtipocarga?: Numerico;
  idincoterms?: Numerico;
  idorigen?: Numerico;
  [campo: string]: unknown;
}

export interface ExpedienteMasterRaiz extends ExpedienteMaster, ExpedienteItem {
  id: number;
  list_comentarios?: ComentarioHouse[];
}

export interface HouseListaRaiz extends HouseDeMaster {
  list_comentarios?: ComentarioHouse[];
  nameconsigner?: string;
  cliente_nombre?: string;
  cliente?: string;
  consigner?: string;
}

export interface HouseCopiaRaiz extends HouseDetalle {
  cliente?: string;
  consigner_name?: string;
  namelong?: string;
}

export interface EntidadListadoRaiz extends ClienteListado {
  namelong?: string;
}

export interface ClienteRaiz {
  id: number;
  namelong: string;
  [campo: string]: unknown;
}

export interface ProveedorRaiz extends ProveedorPricing {
  namelong: string;
}

export interface OperadorRaiz extends Operador {
  namelong: string;
}

export interface ProveedorRolRaiz extends ProveedorItem {
  rol: string;
  [campo: string]: unknown;
}

export interface IncotermRaiz extends Incoterm {
  id: number;
  name: string;
}

export interface RegistroBitacoraRaiz extends RegistroBitacoraHouse {
  namemodule?: string;
}

export interface BegEndHouseRaiz {
  id: number;
  namebegend: string;
  position_begend: number;
  [campo: string]: unknown;
}

export interface ServicioGrupoRaiz {
  id?: number;
  nameservice?: string;
  namebitacora?: string;
  [campo: string]: unknown;
}

export interface GrupoServiciosRaiz {
  namegroupservice?: string;
  groupservice?: ServicioGrupoRaiz[];
  [campo: string]: unknown;
}

export interface ServicioListaRaiz {
  id_begend: number;
  nameservice: string;
  price: number;
  [campo: string]: unknown;
}

export interface ContenedorMasterRaiz {
  id?: number;
  id_container?: number;
  name?: string;
  nro_container: string;
  nro_precinto: string;
  cantidad: number | string;
  [campo: string]: unknown;
}

export interface TotalProveedorRaiz {
  id: number;
  id_proveedor: number;
  nameproveedor: string;
  docs: number;
  solicitudes: number;
  type: number;
  total_op: number | string;
  [campo: string]: unknown;
}

export interface FacturaAdminRaiz {
  id_proformace: ComprobanteCuenta;
  id_proformance: ComprobanteCuenta;
  id_expediente: number | string;
  id_proveedor: number | string;
  id_cliente: number | string;
  fecha: string;
  nro_factura: string;
  nro_serie: string;
  id_coins: MonedaCuenta;
  monto: string;
  type_payment: number | string;
  originalname: string;
  id_path: number | string | null;
  path: string | null;
  id_month: number | string;
  id_year: number | string;
  tipocambio: number;
  id_subgasto: number | null;
  id_tipoingreso: number | null;
  id_subingreso: number | null;
  name_path: string;
  details: ConceptoCuenta[];
  [campo: string]: unknown;
}

export type PagoRaiz = DetallePagoCliente & DetallePagoProveedor;

export type ListaPagosRaiz = PagoRaiz[] & { listPagosXProveedorCxP?: PagoRaiz[] };

export interface TipoTelefonoRaiz {
  id: number;
  name: string;
}

export interface TelefonoRaiz {
  id: number;
  name: string;
  number: Numerico;
}

export interface TelefonoListadoRaiz {
  id: number;
  name: string;
  phone_number: string;
}

export interface ContactoRaiz {
  id?: number;
  name: string;
  number: Numerico;
}

export interface GrupoMenuRaiz {
  namegroup: string;
  [campo: string]: unknown;
}

export interface NroMasterRaiz {
  nro_master: number | string;
}

export interface NroHouseRaiz {
  nro_house: number | string;
}

export interface ControlRaiz {
  nrocontrol: Numerico;
  idcontrol: Numerico;
  idorders: Numerico;
  [campo: string]: unknown;
}

export type RolSinParsearRaiz = Omit<RolProveedor, "id"> & { id: string };
