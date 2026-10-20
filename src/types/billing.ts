import type { ApiResponse } from "@/types/api";
import type { Numerico } from "@/types/cotizacion";

export interface HouseResumenFacturacion {
  id_transport?: number | string;
  namemodality?: string;
  code_house?: string;
  code_master?: string;
  nameshipment?: string;
  nameportbegin?: string;
  nameortEnd?: string;
  nameagent?: string;
  operador?: string;
  documentlong?: string;
  nro_master?: string;
  nameconsigner?: string;
  namenotify?: string;
  bultos?: Numerico;
  peso?: Numerico;
  volumen?: Numerico;
}

export interface MasterListadoControlGasto {
  id: number;
  id_branch: number;
  url_folderonedrive?: string;
  [campo: string]: unknown;
}

export interface FacturaListado {
  id: number;
  correlativo: string;
  cliente: string;
  url: string;
  estatus: number;
  existe_fiscal?: boolean;
}

export interface EncabezadoTabla {
  title: string;
  key: string;
  align?: "start" | "center" | "end";
  sortable?: boolean;
}

export interface AbonoCliente {
  id: number;
  status: number;
  path: string;
}

export interface SucursalFactura {
  id: number;
  trade_name: string;
}

export interface DatosFactura {
  total_monto?: Numerico;
  total_igv?: Numerico;
  total?: Numerico;
}

export interface RespuestaFactura extends ApiResponse {
  statusBol?: boolean;
  nro_factura?: string;
  path?: string;
}

export interface ConceptoSolicitud {
  total_op: number | string;
  pagado?: number;
  status?: number;
  path?: string;
  [campo: string]: unknown;
}

export interface SolicitudPagoProveedor {
  id: number;
  path: string;
  status: number;
}

export interface DocumentoProveedor {
  id: number;
  path: string;
  type: string;
  type_pago: number;
  number: string;
  estadoflag?: boolean;
}

export interface CuentaBancariaPago {
  id: number;
  label: string;
  banco: string;
  moneda: string;
  cuenta: string;
  cci: string;
}

export interface DetallePagoProveedor {
  id: number;
  pagar?: boolean;
  tipocambio: string;
  totalopcuentabanco: string;
  total_op: string;
  acronym: string;
}

export interface PagoPendienteProveedor {
  id: number;
  index?: number;
  tipo: string;
  tipocambio: number | string;
  monto?: string;
  monto_banco: string;
  monto_actual: string;
  monto_mon_ex?: number | string;
  errorEx?: string;
  pagar?: boolean;
  isaprobacion?: boolean;
  iscontrolgasto?: boolean;
  isprogramado?: boolean;
  id_correlativo?: number | null;
  details: DetallePagoProveedor[];
}
