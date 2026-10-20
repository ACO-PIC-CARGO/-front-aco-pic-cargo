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
