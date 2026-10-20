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

export interface RespuestaBalance<T> {
  estado?: boolean;
  mensaje: string;
  data: T;
}

export interface TipoBalance {
  id: number;
  name?: string;
  [campo: string]: unknown;
}

export interface ArbolBalance {
  id?: number | string;
  label?: string;
  children?: ArbolBalance[];
  [campo: string]: unknown;
}

export interface ComparativoBalance {
  [campo: string]: unknown;
}

export interface FlujoOperacionMes {
  fecha_inicio?: string;
  fecha_fin?: string;
  fechahasta?: unknown;
  flujo?: unknown;
  [campo: string]: unknown;
}

export interface FiltroMesAnio {
  year: Numerico;
  month: Numerico;
}

export interface FiltroComparativo {
  month: Numerico;
  year: Numerico;
}

export interface FiltroFlujoPrePostMes {
  month: Numerico | string[];
  year: Numerico;
  ingresosflag?: Numerico | boolean;
  gastoflag?: Numerico | boolean;
  anteriorflag?: Numerico | boolean;
  posterioflag?: Numerico | boolean;
  mes?: Numerico;
  anio?: Numerico;
  expediente?: Numerico;
  id_persona?: Numerico;
  monto?: Numerico;
}

export interface FiltroDetalleGanancia {
  year: Numerico;
  month: Numerico;
  tipoingreso: Numerico;
  tiposubingreso: Numerico;
  nro_expediente: Numerico;
  monto: Numerico;
}

export interface FiltroDetalleGastos {
  year: Numerico;
  month: Numerico;
  tipogastos: Numerico;
  tiposubgastos: Numerico;
  proveedor: Numerico;
  monto: Numerico;
}

export interface FiltroFlujoOperacionMes {
  cantidadmes: Numerico;
  id_proveedor?: Numerico;
  id_cliente?: Numerico;
  nro_expediente?: Numerico;
}
