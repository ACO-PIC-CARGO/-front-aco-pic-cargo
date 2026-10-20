import type { ApiResponse } from "@/types/api";
import type { Numerico } from "@/types/cotizacion";

export interface ProgramacionListado {
  id?: number;
  correlativo?: string;
  fecha?: string;
  total_dolar_total?: Numerico;
  total_soles_total?: Numerico;
}

export interface ProgramacionPagoProveedor {
  id?: number;
  tipocambio: Numerico;
  [campo: string]: unknown;
}

export interface FiltroProgramacionProveedor {
  id_proveedor: number | string;
  id: number | string;
  id_coins: number | string;
}

export interface BancoGastoDetalle {
  [campo: string]: unknown;
}

export interface TotalMasterAgrupado {
  [campo: string]: unknown;
}

export interface TotalMasterMes {
  [campo: string]: unknown;
}

export interface ProyeccionListado {
  id?: number;
  [campo: string]: unknown;
}

export interface Proyeccion {
  id?: number;
  id_month?: number;
  id_year?: number;
  tipocambio?: Numerico;
  details?: unknown[];
  aprobadoflag?: boolean;
}

export interface FiltroProyeccion {
  id_month: number | string;
  id_year: number | string;
  correlativo: number | string;
  total_proyectado_ext: number | string;
  estado: number | string;
  aprobadoflag: number | string | boolean;
}

export interface ControlGastoMaster {
  master_id?: number;
  master_codemaster?: string;
  master_nromaster?: string;
  url_folderonedrive?: string;
  folders_quote?: unknown;
  id_branch?: number;
  [campo: string]: unknown;
}

export interface ControlGastoHouse {
  isExpanded?: boolean;
  [campo: string]: unknown;
}

export interface ListadoControlGastoHouses {
  lsthouses: ControlGastoHouse[];
}

export interface CorrelativoControlGasto {
  index?: number;
  [campo: string]: unknown;
}

export interface RespuestaControlGasto<T = unknown> extends ApiResponse<T> {
  statusBol?: boolean;
  statusText?: string;
}

export interface FilaMensaje {
  mensaje: string;
}
