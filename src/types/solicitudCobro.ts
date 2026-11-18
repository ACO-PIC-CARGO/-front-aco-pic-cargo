// Solicitud de Cobro (Control de Gastos > Ingresos). Se identifica por su código (SC-000001).

export type CodigoEstadoSolicitudCobro =
  | "BORRADOR"
  | "PENADM"
  | "PENGER"
  | "LISTO"
  | "CONFIRMADO"
  | "COBRADO"
  | "RECHAZADA"
  | "ELIMINADA";

export type TabBandejaSolicitudCobro = "PEN" | "REC" | "HIS";

export interface ConceptoSolicitudCobro {
  codigo: string;
  id_ingreso?: number;
  concepto: string | null;
  monto_op: number | string | null;
  igv_op: number | string | null;
  total_op: number | string | null;
  totalopcuentabanco: number | string | null;
}

/** Fila de function_solicitudcobro_listar (Control de Gastos) */
export interface SolicitudCobro {
  codigo: string;
  id_master: number;
  expediente: string;
  id_house: number;
  id_cliente: number;
  cliente: string;
  id_correlativo: number | null;
  correlativo: string | null;
  monto: number | string;
  moneda: string | null;
  id_cuentabancaria: number;
  cuenta: string | null;
  // banco del cliente desde donde envió el pago (table_banks)
  id_banco_origen: number | null;
  banco_origen: string | null;
  fechadeposito: string | null;
  numerooperacion: string | null;
  id_path_voucher: number | null;
  voucher_path: string | null;
  voucher_nombre: string | null;
  comentario: string | null;
  enviadoflag: boolean;
  fechasolicitud: string | null;
  fecha_registro: string | null;
  usuario_registro: string | null;
  usuario_solicitud: string | null;
  usuario_aprobadoadministracion: string | null;
  fecha_aprobadoadministracion: string | null;
  usuario_aprobadogerencia: string | null;
  fecha_aprobadogerencia: string | null;
  codigo_estado: CodigoEstadoSolicitudCobro;
  estado: string;
  id_pagoingreso: number | null;
  numerooperacion_ingreso: string | null;
  area_rechazo: "ADM" | "GER" | null;
  usuario_rechazo: string | null;
  fecha_rechazo: string | null;
  motivo_rechazo: string | null;
  conceptos?: ConceptoSolicitudCobro[];
  // nuestra cuenta: banco y número por separado
  banco?: string | null;
  nrocuenta?: string | null;
  // confirmación = ingreso registrado en Bancos
  fecha_ingreso?: string | null;
  soporte_confirmacion_path?: string | null;
  soporte_confirmacion_nombre?: string | null;
  usuario_confirma?: string | null;
  fecha_confirmacion?: string | null;
  confirmadoflag?: boolean;
  // pagos cargados (parciales); la suma debe ser exacta para enviar a Administración
  soportes?: SoporteCobro[];
  soportes_total?: number;
  soportes_registrados?: number;
  monto_soportes?: number | string;
}

/** Un "Cargar Pago Cliente" (pago parcial o total) de la solicitud; en Bancos es un ingreso */
export interface SoporteCobro {
  codigo: string;
  monto: number | string;
  id_cuentabancaria: number;
  cuenta: string | null;
  banco: string | null;
  nrocuenta: string | null;
  id_banco_origen: number | null;
  banco_origen: string | null;
  fechadeposito: string | null;
  numerooperacion: string | null;
  id_path_voucher: number | null;
  voucher_path: string | null;
  voucher_nombre: string | null;
  comentario: string | null;
  usuario_registro: string | null;
  fecha_registro: string | null;
  id_pagoingreso: number | null;
  numerooperacion_ingreso: string | null;
}

/** Fila de function_solicitudcobro_bandeja (Ingresos pendientes por confirmar) */
export interface SolicitudCobroBandeja
  extends Omit<SolicitudCobro, "enviadoflag" | "fecha_registro" | "usuario_registro" | "id_path_voucher" | "conceptos"> {
  total: number | string;
  usuario_anulado: string | null;
  fecha_anulado: string | null;
}

export interface OpcionFiltroSolicitudCobro {
  tipo: "CLIENTE" | "CUENTA";
  valor: string;
  titulo: string;
}

/** Datos de function_solicitudcobro_por_token para precargar Bancos > Nuevo Ingreso */
export interface SolicitudCobroTransferencia {
  codigo: string;
  id_master: number;
  expediente: string;
  id_house: number;
  id_cliente: number;
  cliente: string;
  id_correlativo: number | null;
  correlativo: string | null;
  monto: number | string;
  moneda: string;
  id_coins: number;
  id_cuentabancaria: number;
  id_banco_origen: number | null;
  banco_origen: string | null;
  fechadeposito: string;
  numerooperacion: string;
  id_path_voucher: number;
  voucher_path: string | null;
  voucher_nombre: string | null;
  comentario: string | null;
}

/** function_solicitudcobro_activas_cliente: esos correlativos solo se cobran con el token */
export interface SolicitudCobroActiva {
  codigo: string;
  id_house: number;
  id_correlativo: number | null;
  expediente: string;
  correlativo: string | null;
  codigo_estado: CodigoEstadoSolicitudCobro;
  estado: string;
}

/** House / correlativo de Control de Gastos > Ingresos al que se le carga el pago */
export interface DestinoPagoCliente {
  id_house: number;
  id_correlativo: number | null;
  cliente: string;
  correlativo?: string | number | null;
  deuda: number | string;
  // moneda de los ingresos del correlativo: solo se ofrecen cuentas en esa moneda
  id_coins?: number | null;
}
