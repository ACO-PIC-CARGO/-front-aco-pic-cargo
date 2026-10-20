import type { Numerico } from "@/types/cotizacion";

export interface ComentarioExpedienteReporte {
  fecha: string;
  namelong: string;
  comentario: string;
}

export interface TelexExpedienteReporte {
  nombrecompleto: string;
  fechaconfirmaciontelex: string;
}

export interface ExpedienteMasterReporte {
  background: string;
  code_master: string;
  modality: string;
  shipment: string;
  port_begin: string;
  port_end: string;
  fecha_eta: string;
  fecha_etd: string;
  fecha_disponibilidad: string;
  incoterms: string;
  listhouse: string;
  comentario: ComentarioExpedienteReporte[];
  house_telex: TelexExpedienteReporte[];
  operador: string;
  created: string;
  nro_manifiesto: string;
  color: string;
  statuslock: number;
  orden: number;
}

export interface ResumenOperador {
  operador: string;
  totalAbiertas: number;
  totalCerradas: number;
  totalFiles: number;
}

export interface FiltroControlFile {
  status_op: string;
  status_admin: string;
  sentido: string;
  desde: string;
  id_operativo: string;
  hasta: string;
  salidaflag: boolean | null;
  llegadaflag: boolean | null;
  disponibilidadflag: boolean | null;
}

export interface ClienteDetalleControlFile {
  id: number;
  cliente: string;
  monto_pr: Numerico;
  monto_op: Numerico;
  ingresos_pagado: Numerico;
}

export interface ProveedorDetalleControlFile {
  proveedor: string;
  type_pago: Numerico;
  monto_pr: Numerico;
  monto_op: Numerico;
  egresos_pagado: Numerico;
}

export interface DetalleControlFile {
  id_master: number;
  ingresos_pr: Numerico;
  egresos_pr: Numerico;
  ingresos_op: Numerico;
  egresos_op: Numerico;
  ingesos_pagado: Numerico;
  egresos_pagado: Numerico;
  listhouse: ClienteDetalleControlFile[];
  listproveedor: ProveedorDetalleControlFile[];
  [campo: string]: unknown;
}

export interface TotalesMasterAgrupadoReporte {
  total_pr: Numerico;
  total_op: Numerico;
  total_individuales: Numerico;
  total_grupales: Numerico;
  total_house_individuales: Numerico;
  total_house_grupales: Numerico;
}

export interface TotalMasterMesReporte {
  mes: string | number;
  nombre_mes: string;
  total_pr: Numerico;
  total_op: Numerico;
  total_individuales: Numerico;
  total_grupales: Numerico;
  total_house_individuales: Numerico;
  total_house_grupales: Numerico;
}

export interface TotalesMasterGeneralAgrupadoReporte {
  total_clientes: Numerico;
  total_expedientes: Numerico;
  total_op: Numerico;
  total_pr: Numerico;
}

export interface DetalleExpedienteMes {
  mes: string;
  mesnumero: Numerico;
  exp_codemaster: string;
  tipo_embarque: string;
  total_pr: Numerico;
  total_op: Numerico;
}
