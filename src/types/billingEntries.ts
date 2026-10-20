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
