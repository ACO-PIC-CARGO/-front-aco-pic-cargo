export interface EgresoExpediente {
  id: number;
  concepto: string;
  total_pr: number;
  total_op: number;
  status: number;
  pagado: number;
  path: string;
}

export interface DetalleFlujoCaja {
  id: number;
  nro_master: string;
  id_control: number;
  id_house: number;
  id_orders: number;
  code_control: string;
  nameconsigner: string;
  fecha_disponibilidad: string;
  total_pagar: number | string;
  llegada: number;
}

export interface CuentaFlujoCaja {
  nameproveedor: string;
  details: DetalleFlujoCaja[];
  [campo: string]: unknown;
}

export interface ExpedienteSinSolicitud {
  id: string;
  nro_master: string;
  nameconsigner: string;
}

export interface AbonoCliente {
  id: string;
  status: number;
  path: string;
  code_master: string;
  nro_master: string;
  monto_letra: string;
  name: string;
  pathfile: string;
  namelong: string;
}

export interface ConceptoSolicitudPago {
  id: number;
  name: string;
}

export interface FacturaCxc {
  url_documento: string;
  nro_factura: string;
}

export interface DetalleCxc {
  id: number;
  id_control: number;
  id_branch: number;
  nro_master: string;
  nameconsigner: string;
  fecha_disponibilidad: string;
  symbol: string;
  total_pagar: string;
  llegada: number;
  operativa: number;
  fechadevencimiento: string;
  diasatraso: number;
  estatus: string;
  facturas: FacturaCxc[];
}

export interface ClienteCxc {
  id_consigner: number;
  nameconsigner: string;
  details: DetalleCxc[];
}

export interface DetalleCxcAdmin {
  id: number;
  nameconsigner: string;
  concepto: string;
  symbol: string;
  monto: string;
  igv: string;
  total_pagar: string;
}

export interface ClienteCxcAdmin {
  id_consigner?: number;
  nameconsigner: string;
  details: DetalleCxcAdmin[];
}

export interface ComentarioCxc {
  fecha: string;
  id_ejecutivo: number | string;
  ejecutivo: string;
  texto: string;
  esoperativo: boolean;
  esadministrativo: boolean;
  id_cliente?: number | null;
}

export interface ContextoComentarioCxc {
  id_consigner?: number;
  nameconsigner?: string;
  esoperativo?: boolean;
  esadministrativo?: boolean;
}

export interface RegistroComentario {
  fecha: string;
  ejecutivo: string;
  comentario: string;
  esoperativo: boolean;
  esadministrativo: boolean;
}

export interface TotalOperativo {
  moneda: string;
  llegada: string;
  no_llegada: string;
  total: string;
}

export interface TotalAdministrativo {
  moneda: string;
  monto: string;
  igv: string;
  total: string;
}

export interface DetalleCxp {
  id: number;
  id_branch: number;
  nro_master: string;
  controlgastoegreso: number;
  programado: number;
  index?: number;
  code_correlativo: string;
  programado_correlativo: string;
  nameconsigner: string;
  expedientes: string;
  fecha_disponibilidad: string;
  symbol: string;
  total_pagar: string;
  llegada: number;
}

export interface CuentaPagarProveedor {
  id?: number;
  nameproveedor: string;
  details: DetalleCxp[];
}

export interface DetalleCxpAdmin {
  id: number;
  programado: number;
  index?: number;
  nro_factura: string;
  fecha: string;
  symbol: string;
  monto: string;
  igv: string;
  total: string;
}

export interface CuentaPagarAdmin {
  id_proveedor?: number;
  nameconsigner: string;
  details: DetalleCxpAdmin[];
}

export interface ProgramacionPago {
  programend_id: number;
  programend_fecha: string;
  programend_select: boolean;
}

export interface ContextoComentarioCxp {
  id?: number | null;
  proveedor?: string;
  nameproveedor?: string;
  nameconsigner?: string;
  id_proveedor?: number;
  esoperativo?: boolean;
  esadministrativo?: boolean;
}

export interface ComentarioCxp {
  fecha: string;
  id_ejecutivo: number | string;
  ejecutivo: string;
  texto: string;
  esoperativo: boolean;
  esadministrativo: boolean;
  id_proveedor?: number | null;
}

export interface SolicitudPago {
  id: string;
  id_proveedor: number;
  id_house: number;
  status: number;
  ajusteflag: number;
  pago_completo: number;
  code_master: string;
  path: string;
  pathfile: string;
  namelong: string;
}

export interface FacturaSolicitudPago {
  id: number;
  type: string;
  type_pago: number;
  number: string;
  path: string;
}
