import type { CuentaBancariaPic } from "@/types/operaciones";

export interface CuentaDestinoCliente {
  id: number;
  label: string;
  banco?: string;
  moneda?: string;
  cuenta?: string;
  symbol?: string;
}

export interface ClientePago {
  id: number;
  namelong?: string;
}

export interface DetallePagoCliente {
  id: number;
  index?: number;
  id_coins: number;
  monto_pagar: number | string;
  max_pagar: number | string;
  monto_deuda: number | string;
  montopagar: number | string;
  tipocambio: number | string;
  symbol?: string;
  err?: string;
}

export interface DetalleIngresoCliente {
  banco: string;
  cuenta_destino: string;
  tipo_ingreso: string;
  subtipo_ingreso: string;
  monto: string;
  moneda_simbolo: string;
  monto_destino: string;
  moneda_destino: string;
  tipocambio: string;
  concepto: string;
  factura: string;
  serie: string;
  action: string;
  anuladoflag?: boolean;
}

export interface IngresoCliente {
  id_pago: number;
  index?: number;
  soporte: string;
  tipocambio: string;
  monto_destino: string;
  concepto: string;
  detalles?: DetalleIngresoCliente[];
}

export interface IngresoClienteEditable {
  id_path?: string | null;
  detalles: DetalleIngresoCliente[];
}

export interface DatoIngresoCliente {
  id: number | string;
  id_proveedor: number | string;
  nro_operacion: string;
  monto: number | string;
  fecha: string;
  id_banco_origen: number | string;
  id_cuenta_pic: number | string;
  soporte: string;
  id_path: string;
  usuario?: string | null;
}

export interface FiltroIngresoCliente {
  id_branch: number | string;
  nro_operacion: string;
  monto: number | string;
  fechadesde: string;
  fechahasta: string;
  factura: string;
  serie: string;
  id_banco: number | string;
  id_cuenta?: number | string;
  id_consigner: number | string;
  id_coin: number | string;
  tipoingreso: number | string;
  tiposubingreso: number | string;
  operativo: boolean;
  administrativo: boolean;
  nro_exp?: string;
}

export interface FiltroRegistroIngreso {
  id_branch: string;
  id_banco_origin: string;
  id_cuenta_destino: string;
  id_cliente: string;
  id_tipoingreso: string;
  id_subtipoingreso: string;
  nro_operacion: string;
  nro_expediente: string;
  monto_factura: string;
  fechadesde: string;
  fechahasta: string;
  operativo: string;
  administrativo: string;
  id_banco?: number | string | null;
  id_cuenta?: number | string | null;
  id_consigner?: number | string | null;
  tipoingreso?: number | string | null;
  tiposubingreso?: number | string | null;
  nro_exp?: string | null;
  monto?: number | string | null;
  factura?: string;
  serie?: string;
  id_coin?: number | string;
}

export interface FacturaPorCobrar {
  id: number;
  registro_id?: number;
  admin_invoice_id: number;
  editaflag?: boolean;
  tipo: string;
  referencia?: string;
  symbol: string;
  parcialflag: boolean;
  nuevoflag?: boolean;
  concepto?: string;
  montoparcial: number | string;
  total_mon_local: number | string;
  monto_original_total: number | string;
  totaldolar: number | string;
}

export type CuentaIngreso = CuentaBancariaPic & {
  id_coins?: number;
  banco?: string;
  moneda?: string;
};

export interface OperacionSimilar {
  id: number | null;
  numerooperacion: string;
  estadoflag: boolean;
  es_duplicado_exacto?: boolean;
}

export interface ErroresRegistroIngreso {
  cliente: string;
  id_cuenta: string | null;
  id_cuenta_origen?: string | null;
  fecha_operacion: string;
  nro_operacion: string | null;
  monto_local?: string;
  id_banco_origen?: string;
}

export interface DetalleIngresoRegistrado {
  id: number;
  symbol: string;
  parcialflag: boolean;
  montoparcial: number | string;
  total_mon_local: number | string;
  tipocambio: number | string;
  concepto?: string;
  nuevoflag?: boolean;
  montomonedalocal?: number | string;
  montodolar?: number | string;
}

export interface RegistroIngresoCliente {
  cliente: number;
  filename: string;
  id_banco: number;
  id_banco_origen: number;
  nro_operacion: string;
  fecha_operacion: string;
  comentarios: string;
  comentariosadmin: string;
  payPath: string;
  originalname: string;
  detalle: DetalleIngresoRegistrado[];
  totaldolar: number | string;
  totalmonedalocal: number | string;
  tipocambio: number | string;
  comisionbancaria: { concepto: string; monto: number | string }[];
}

export type DetalleCobroCliente = {
  monto_destino: number | string;
};

export type DetalleRegistroIngreso = {
  code_master: string;
  nro_factura: string;
  nro_serie: string;
  montodolar: string;
  montomonedalocal: string;
};

export type ComisionBancariaIngreso = {
  id: number;
  concepto: string;
  montodolar: string;
  monto: string;
};

export type RegistroIngreso = {
  id: number;
  urlarchivo: string;
  monedaregistro: string;
  totalmonedalocal: string;
  detalle: DetalleRegistroIngreso[];
  comisionbancaria: ComisionBancariaIngreso[];
};
