import type { BancoFila } from "@/types/finanzas";
import type { CuentaBancariaPic } from "@/types/operaciones";

export interface ProgramacionPagoListado {
  id: number;
  correlativo?: number | string;
  fecha: string;
}

export interface FiltroPagoProveedorDetallado {
  desde: string;
  hasta: string;
  nro_operacion: string;
  id_cuenta: number | string;
  id_proveedor: number | string;
  monto: number | string;
  id_moneda: string;
  nro_exp: string;
  nro_factura: string;
  nro_serie: string;
  tipogastos: string;
  tiposubgastos: string;
  operativo: boolean;
  administrativo: boolean;
}

export type CuentaBancoDetalle = {
  id?: number | string;
  id_bank?: number | string;
  id_coin?: number | string;
  nrocci?: string;
  nrocuenta?: string;
  status?: number | boolean | string;
  trial438?: string;
  uptated_at?: string;
  esprincipalflag?: number | boolean;
  index?: number;
};

export type BancoFilaConCuentas = BancoFila & { banks_details: CuentaBancoDetalle[] };

export type RegistroBancoEditable = {
  id_branch?: number;
  acronym?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
};

export type DetallePagoRealizado = {
  id: number;
  monto_mon_ex: number | string;
  monto_dolar: number | string;
  tipocambio: number | string;
  id_coins?: number | string;
  errorEx?: string;
};

export type CuentaSalidaPago = CuentaBancariaPic & {
  banco?: string;
  moneda?: string;
};

export type ProveedorPago = {
  id: number;
  namelong?: string;
};

export type DetallePagoProveedor = {
  id: number;
  pagar?: boolean;
  cktotal?: boolean;
  monto_deuda: number | string;
  max_pagar: number | string;
  monto_pagar: number | string;
  monto_mon_ext?: number | string;
  errorEx?: string;
};

export type FiltroPagoProveedor = {
  id_branch: number | string;
  desde: string;
  hasta: string;
  expediente: string;
  nro_operacion: string;
  id_cuenta: number | string;
  id_proveedor: number | string;
  monto: number | string;
  id_moneda: number | string;
  nro_factura: string;
  nro_serie: string;
  tipogastos: number | string;
  tiposubgastos: number | string;
  operativo: boolean;
  administrativo: boolean;
  fechadesde?: string;
  fechahasta?: string;
};

export type DatoPagoProveedor = {
  id: number | string;
  id_proveedor: number | string;
  nro_operacion: string;
  monto: number | string;
  fecha: string;
  id_cuenta: number | string;
  soporte: string;
  id_path: string;
  usuario?: string | null;
  name_proveedor?: string;
};

export type PagoProveedorEditable = {
  id_path?: string | null;
  detalle: { anuladoflag?: boolean }[];
};

export type FacturasAsociadas = {
  concepto?: string;
  factura?: string;
  serie?: string;
};

export type PagoEgresoFila = {
  id: number;
  name_proveedor?: string;
  ruta?: string;
  moneda?: string;
  totalmonedalocal?: number | string;
  detalles?: {
    id: number;
    tipo?: string;
    code_master?: string;
    nro_factura?: string;
    nro_serie?: string;
    montodolar?: number | string;
    montomonedalocal?: number | string;
  }[];
  table_comisionbancaria?: {
    id: number;
    concepto?: string;
    montodolar?: number | string;
    monto?: number | string;
  }[];
};

export type DetalleEgreso = {
  id: number;
  symbol?: string;
  parcialflag?: boolean;
  montoparcial?: number | string;
  saldo_pendiente_local?: number | string;
  saldo_pendiente?: number | string;
  montomonedalocal?: number | string;
  montodolar?: number | string;
  concepto?: string;
  nuevoflag?: boolean;
  code_master?: string;
  tipo_gasto?: string;
};

export type ErroresPagoProveedor = {
  proveedor: string;
  id_cuenta: string | null;
  fechaoperacion: string;
  numerooperacion: string | boolean | null;
  monto_local?: string;
};

export type RegistroEgresoVer = {
  id_proveedor: number;
  id_cuentabancaria: number;
  fechaoperacion: string;
  numerooperacion: string;
  comentario: string;
  tipocambio: number | string;
  totaldolar: number | string;
  totalmonedalocal: number | string;
  urlfile: string;
  detalles: DetalleEgreso[];
  id_soporte: number;
  comisionbancaria: { concepto: string; monto: number | string }[];
};

export type ProgramacionProveedorFila = {
  id: number;
  fecha?: string;
  monto: number | string;
  tipocambio: number | string;
  id_coins: number;
  monto_mon_ext?: number | string;
  monto_mon_ex?: number | string;
  acronym?: string;
  errorEx?: string;
};

export type ProgramacionConDetalles = {
  id: number;
  correlativo: string | number;
  total_dolar?: number | string;
  total_soles?: number | string;
  details: {
    id: number;
    id_proveedor: number;
    id_details: number;
    id_coins: number;
    status: boolean;
    proveedor: string;
    symbol: string;
    monto_original: number | string;
    monto: number | string;
  }[];
};
