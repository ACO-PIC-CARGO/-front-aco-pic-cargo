// Reporte de Cuentas por Cobrar / por Pagar > "Solicitar Cobro" / "Solicitar Pago":
// una sola solicitud con varios expedientes del reporte (function_solicitud*_reporte_*).

export type TipoSolicitudReporte = "pago" | "cobro";

/** Cliente (cobro) o proveedor (pago) de la fila del reporte */
export interface EntidadSolicitudReporte {
  id: number;
  nombre: string;
}

/** Expediente del paso 2: pendiente (sin solicitud) o ya amarrado a una solicitud */
export interface ExpedienteSolicitudReporte {
  id_master: number;
  /** solo cobro: el house del cliente */
  id_house?: number | null;
  id_proveedor?: number | null;
  id_cliente?: number | null;
  expediente: string;
  nro_master: string | null;
  id_correlativo: number | null;
  correlativo: string | null;
  id_coins: number | null;
  moneda: string | null;
  /** monto a solicitar del expediente (hoy el total pendiente; preparado para parcial) */
  monto: number | string;
  fecha_disponibilidad: string | null;
  /** solicitud viva que ya amarra el expediente (null = se puede seleccionar) */
  id_solicitud: number | null;
  codigo_solicitud: string | null;
  codigo_estado: string | null;
  estado: string | null;
  multiexpedienteflag: boolean;
  /** sucursal del expediente (el reporte mezcla sucursales de la empresa) */
  id_branch?: number | null;
  sucursal?: string | null;
}

/** Expediente amarrado que devuelve el token de la solicitud (Bancos precarga el movimiento) */
export interface ExpedienteAmarrado {
  id_master: number;
  id_house?: number;
  expediente: string;
  id_correlativo: number | null;
  correlativo: string | null;
  monto: number | string;
}

/** Solicitud ya registrada desde el reporte que se abre en modo ver (Control de Gastos: "Solicitada por Administración") */
export interface SolicitudReporteVer {
  /** pago: id; cobro (Control de Gastos) solo trae el código */
  id?: number | null;
  codigo?: string | null;
  // pago
  id_tipopago?: number | null;
  codigo_tipopago?: string | null;
  id_cuenta?: number | null;
  nrocuenta?: string | null;
  codigopago?: string | null;
  // cobro
  id_cuentabancaria?: number | null;
  id_banco_origen?: number | null;
  fechadeposito?: string | null;
  numerooperacion?: string | null;
  id_path_voucher?: number | null;
  voucher_path?: string | null;
  voucher_nombre?: string | null;
  comentario?: string | null;
}

/** "Ver Detalle" (Expedientes Asociados) de una solicitud con varios expedientes — fila de pago */
export interface DetalleExpedientePago {
  proveedor: string;
  fechasolicitud: string | null;
  moneda: string | null;
  monto_solicitud: number | string;
  id_master: number;
  expediente: string;
  correlativo: string | null;
  cliente: string | null;
  /** más de uno: "Cliente Varios" y botón "Ver Expediente" en vez de "Cliente Pagó" */
  clientes_cantidad?: number;
  cliente_pago: "SI" | "PARCIAL" | "NO" | null;
  monto_pricing: number | string;
  monto_operaciones: number | string;
  ganancia: number | string;
}

/** "Ver Detalle" (Expedientes Asociados) — fila de cobro */
export interface DetalleExpedienteCobro {
  cliente_solicitud: string;
  fechasolicitud: string | null;
  moneda: string | null;
  monto_solicitud: number | string;
  id_master: number;
  id_house: number;
  expediente: string;
  correlativo: string | null;
  cliente: string | null;
  monto_pricing: number | string;
  monto_operaciones: number | string;
  monto_solicitado: number | string;
  ganancia: number | string;
}
