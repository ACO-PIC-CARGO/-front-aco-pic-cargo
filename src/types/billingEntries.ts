import type { ArchivoInicial } from "@/types/archivos";

export type Monto = number | string;

export interface EgresoDetalle {
  id?: number;
  id_proveedor?: number;
  id_master?: number;
  id_correlativo?: Monto;
  nombre_proveedor?: string;
  id_house?: number | null;
  code_house?: string;
  consigner?: string;
  concepto?: string;
  acronym?: string;
  id_coins?: number | null;
  tipocambio?: Monto;
  pagado?: number | boolean;
  statusadmin?: number | boolean;
  monto_op?: Monto;
  igv_op?: Monto;
  igv_pr?: Monto;
  total_op: Monto;
  total_pr: Monto;
  monto_pr?: Monto;
  montoopcuentabanco?: Monto;
  igvopcuentabanco?: Monto;
  totalopcuentabanco?: Monto;
  fecha_pago_letra?: string;
  path?: string;
}

export interface CuotaProveedor {
  porcentaje: Monto;
  fecha: string;
}

export interface EgresoProveedor {
  id_proveedor?: number;
  id_master?: number;
  id_correlativo?: Monto;
  nombre_proveedor?: string;
  detalle: EgresoDetalle[];
  total_total_op: Monto;
  total_total_pr: Monto;
  monto_pagar_op: Monto;
  nro_cuotas?: number;
  cuotas: CuotaProveedor[];
  tipocambio?: Monto;
  docs: number;
  solicitudes: number;
  code_tipo_proveedor?: string;
  isExpanded?: boolean;
  [campo: string]: unknown;
}

export interface EgresoForm {
  id: number | null;
  id_orders: number | string | null;
  concepto: string;
  statusCalcula: boolean;
  opcion: boolean | null;
  numero: string;
  fecha: string;
  monto_op: Monto;
  montoopview: Monto;
  igv_op: Monto;
  total_op: Monto;
  monto_pr: Monto;
  igv_pr: Monto;
  total_pr: Monto;
  id_proveedor: number | null;
  montoopcuentabanco: Monto;
  igvopcuentabanco: Monto;
  totalopcuentabanco: Monto;
  pagado?: number;
  igvopview?: Monto;
  totalopview?: Monto;
  id_coins?: number | null;
}

export interface CuentaBancariaProveedor {
  id?: number;
  beneficiario?: string;
  nameaccount?: string;
  namebanks?: string;
  namecoins?: string;
  accountnumber?: string;
}

export interface FacturaProveedorCargada {
  id: number;
  type?: string;
  type_pago?: number | string;
  number?: string;
  estadoflag?: boolean;
  monto?: Monto;
  originalname?: string;
  path: string;
}

export interface SolicitudPagoListada {
  id: number;
  path: string;
  status: number;
  [campo: string]: unknown;
}

export interface CuentaBancariaForm {
  id_entities: string | number | undefined;
  nro_cuenta: string;
  cci: string;
  id_banco: string;
  id_coins: string;
  nro_swift: string;
  id_intermediario: string;
  nro_cuenta_intermediario: string;
  beneficiario?: string;
}

export interface EncabezadoColumna {
  title: string;
  key: string;
  align?: "start" | "center" | "end";
  sortable?: boolean;
}

export interface MonedaItem {
  id: number;
  symbol: string;
  acronym?: string;
}

export interface ProveedorItem {
  id: number;
  id_tipotransaccion?: number | string;
}

export interface ExpedienteItem {
  id: number;
  code_master?: string;
}

export interface GrupoCliente {
  id_house: number | null;
  code_house: string;
  consigner: string;
}

export interface DocumentoQuote {
  key: string;
  label: string;
  flag: boolean;
  file: ArchivoInicial | null;
  editable: boolean;
}

export interface DatosInstructivoManual {
  listaDocumentos?: DocumentoQuote[];
  [campo: string]: unknown;
}

export interface IngresoDetalle {
  id?: number;
  id_house?: number;
  id_orders?: number;
  id_coins?: number | null;
  id_correlativo?: Monto;
  concepto?: string;
  symbol?: string;
  acronym?: string;
  facturado?: boolean | number;
  tipocambio?: Monto;
  tipo_pago?: boolean | number | string | null;
  monto_op?: Monto;
  igv_op?: Monto;
  igv_pr?: Monto;
  montoopcuentabanco?: Monto;
  igvopcuentabanco?: Monto;
  totalopcuentabanco?: Monto;
  total_op: Monto;
  total_pr: Monto;
  monto_pr?: Monto;
  verFactura?: boolean;
  nro_factura?: string;
  pagado?: number | boolean;
}

export interface DeudaClienteHouse {
  id: number;
  path: string;
  status: number;
  date: string;
  number: string;
  monto: Monto;
  tipocambio: Monto;
  id_banks: string;
  id_cuenta_pic: string;
  id_moneda_destino: number | string | null;
  monto_destino: Monto;
  comentario_usuario: string;
  [campo: string]: unknown;
}

export interface HouseIngreso {
  id_house?: number;
  id_orders?: number;
  id_correlativo?: Monto;
  id_cot?: number | string;
  id_quote: number;
  ruta_cotizacion: string;
  datosinstructivomanual: DatosInstructivoManual;
  correlativo?: Monto;
  quote?: string;
  tienefacturafiscal?: boolean | number;
  code_house?: string;
  consigner?: string;
  ingresos: IngresoDetalle[];
  debscliente: DeudaClienteHouse[];
  total_total_op_ingresos?: Monto;
  total_total_pr_ingresos?: Monto;
  totalpagadodolar?: Monto;
  isExpanded?: boolean;
  verFactura?: boolean;
  [campo: string]: unknown;
}

export interface IngresoForm {
  id: number | null;
  id_house?: number;
  id_orders?: number | null;
  id_correlativo?: Monto;
  concepto: string;
  statusCalcula: boolean;
  opcion: boolean | number | string | null | undefined;
  numero: string;
  fecha: string;
  monto_op: Monto;
  igv_op: Monto;
  total_op: Monto;
  monto_pr: Monto;
  igv_pr: Monto;
  total_pr: Monto;
  id_coins: number | string | null;
  tipocambio: Monto;
  consigner?: string;
  correlativo?: Monto;
  montoopview?: Monto;
  igvopview?: Monto;
  totalopview?: Monto;
  montoopcuentabanco?: Monto;
  igvopcuentabanco?: Monto;
  totalopcuentabanco?: Monto;
}

export interface FacturaEmitida {
  id: number;
  nro_factura: string;
  url_documento: string;
  total_monto: Monto;
  total_igv: Monto;
  total: Monto;
}

export interface DatosFacturaHouse {
  coins?: string;
  details?: unknown[];
  total?: string;
  url_logo?: string;
  total_igv?: string;
  total_monto?: string;
  nombreProforma?: string;
  impuesto?: string;
  [campo: string]: unknown;
}

export interface ProformaFiscalForm {
  id_consigner: string;
  nameconsigner: string;
  tipo_pago: string | number;
  nro_factura: string;
  fecha: string;
  archivo: string | number | null;
  id_master: string;
  id_correlativo: Monto | undefined;
  status?: number;
  id_house?: number;
}

export interface TipoPagoSolicitud {
  id: number;
  codigo: string;
  descripcion: string;
}

export type EstadoSolicitudPago = "LISTO" | "PENGER" | "PENADM" | "PAGADO" | "RECHAZADA";

export interface ConceptoSolicitudPago {
  id_egreso: number;
  concepto: string;
  monto_op: number;
  igv_op: number;
  total_op: number;
  totalopcuentabanco: number | null;
}

export interface SolicitudPagoControl {
  id: number;
  id_master: number;
  expediente: string;
  id_proveedor: number;
  id_correlativo: number | null;
  proveedor: string;
  correlativo_proveedor: string | null;
  correlativo: string | null;
  monto: number | string;
  moneda: string | null;
  id_tipopago: number;
  codigo_tipopago: string;
  tipopago: string;
  banco: string | null;
  nrocuenta: string | null;
  beneficiario: string | null;
  codigopago: string | null;
  comentario: string | null;
  fechasolicitud: string;
  usuario_solicitud: string | null;
  aprobadoadministracionflag: boolean;
  fecha_aprobadoadministracion: string | null;
  usuario_aprobadoadministracion: string | null;
  aprobadogerenciaflag: boolean;
  fecha_aprobadogerencia: string | null;
  usuario_aprobadogerencia: string | null;
  pagadoflag: boolean;
  fechapago: string | null;
  usuario_pagado: string | null;
  fecha_registropago: string | null;
  tiposoporte: number | null;
  soporte_path: string | null;
  soporte_nombre: string | null;
  codigo_estado: EstadoSolicitudPago;
  estado: string;
  orden: number;
  conceptos: ConceptoSolicitudPago[];
  /** Se genera al presionar Transferir */
  token?: string | null;
  /** Salida registrada en Bancos (table_pagoegresos) desde la solicitud */
  id_pagoegreso?: number | string | null;
  numerooperacion_pago?: string | null;
  id_cuenta?: number | null;
  id_cuentasalida?: number | null;
  /** Rechazada por Administración o Gerencia: el solicitante la edita y la vuelve a enviar */
  rechazadoflag?: boolean;
  area_rechazo?: "ADM" | "GER" | null;
  usuario_rechazo?: string | null;
  fecha_rechazo?: string | null;
  motivo_rechazo?: string | null;
}

/** Datos de la solicitud para precargar Bancos > Nueva salida */
export interface SolicitudPagoTransferencia {
  id: number | string;
  id_master: number;
  expediente: string;
  id_proveedor: number;
  proveedor: string;
  id_correlativo: number;
  correlativo: string | null;
  monto: number | string;
  moneda: string | null;
  id_coins: number | null;
  fechapago: string | null;
  id_path_soporte: number | null;
  soporte_path: string | null;
  soporte_nombre: string | null;
  tiposoporte: number | null;
  comentario: string | null;
  /** Cuenta de la empresa (bank_details) elegida al solicitar */
  id_cuentasalida: number | null;
}

/** Modo ver de una solicitud de pago (ojito) */
export interface PagoPendienteExpediente {
  id_proveedor: number;
  id_correlativo: number | null;
  proveedor: string;
  correlativo: string | null;
  moneda: string | null;
  total: number | string;
  estado: string;
}

export interface SolicitudPagoDetalle {
  id: number;
  id_master: number;
  expediente: string;
  fechasolicitud: string;
  id_proveedor: number;
  proveedor: string;
  id_correlativo: number | null;
  correlativo: string | null;
  monto: number | string;
  moneda: string | null;
  codigo_tipopago: string | null;
  tipopago: string | null;
  banco: string | null;
  nrocuenta: string | null;
  beneficiario: string | null;
  codigopago: string | null;
  comentario: string | null;
  codigo_estado: EstadoBandejaSolicitudPago;
  estado: string;
  pagadoflag: boolean;
  fechapago: string | null;
  usuario_solicitud: string | null;
  usuario_aprobadoadministracion: string | null;
  fecha_aprobadoadministracion: string | null;
  usuario_aprobadogerencia: string | null;
  fecha_aprobadogerencia: string | null;
  clientes: string | null;
  pendientes: PagoPendienteExpediente[];
}

// Bancos > Solicitudes de Pago (bandeja paginada)
export type TabBandejaSolicitudPago = "PEN" | "REC" | "HIS";
export type EstadoBandejaSolicitudPago = EstadoSolicitudPago | "ELIMINADA";

export interface SolicitudPagoBandeja {
  total: number | string;
  id: number;
  fechasolicitud: string;
  id_master: number;
  expediente: string;
  id_proveedor: number;
  proveedor: string;
  correlativo: string | null;
  monto: number | string;
  moneda: string | null;
  codigo_tipopago: string | null;
  tipopago: string | null;
  banco: string | null;
  nrocuenta: string | null;
  beneficiario: string | null;
  codigopago: string | null;
  comentario: string | null;
  codigo_estado: EstadoBandejaSolicitudPago;
  estado: string;
  usuario_solicitud: string | null;
  usuario_aprobadoadministracion: string | null;
  fecha_aprobadoadministracion: string | null;
  usuario_aprobadogerencia: string | null;
  fecha_aprobadogerencia: string | null;
  fechapago: string | null;
  soporte_path: string | null;
  numerooperacion_pago: string | null;
  area_rechazo: "ADM" | "GER" | null;
  usuario_rechazo: string | null;
  fecha_rechazo: string | null;
  motivo_rechazo: string | null;
  usuario_anulado: string | null;
  fecha_anulado: string | null;
  id_correlativo: number | null;
  pagadoflag: boolean | null;
  id_pagoegreso: number | string | null;
}

export interface OpcionFiltroSolicitudPago {
  tipo: "PROV" | "BANCO" | "METODO";
  valor: string;
  titulo: string;
}

export interface FiltrosBandejaSolicitudPago {
  estado: EstadoBandejaSolicitudPago | null;
  id_proveedor: number | null;
  banco: string | null;
  tipopago: string | null;
  desde: string;
  hasta: string;
}
