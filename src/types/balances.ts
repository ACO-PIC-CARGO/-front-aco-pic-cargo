import type { Numerico } from "@/types/cotizacion";

export interface BalanceMovimiento {
  categoria?: string;
  tipo?: string;
  subtipo?: string;
  proveedor?: string;
  monto?: Numerico;
  proyeccion?: Numerico;
  ingresoflag?: boolean | number | null;
}

export interface FlujoPrePostMovimiento {
  categoria?: string;
  tipo?: string;
  mesfiltro?: number | string;
  mes?: number | string;
  anio?: number | string;
  persona?: string;
  expediente?: string;
  monto?: Numerico;
  ingresoflag?: boolean | null;
  gastoflag?: boolean | null;
}
