import type { Numerico } from "@/types/cotizacion";

export interface BalanceMovimiento {
  categoria?: string;
  tipo?: string;
  subtipo?: string;
  proveedor?: string;
  monto?: Numerico;
  proyeccion?: Numerico;
  ingresoflag?: boolean | number | null;
  mes?: string;
  ganancia?: Numerico;
  nro_master?: string;
  cliente?: string;
  concepto?: string;
  gasto_description?: string;
  subgasto_description?: string;
  gasto_code?: Numerico;
  tipo_ingreso?: Numerico;
  aplica?: boolean | number | null;
  editarflag?: boolean | number | null;
  isoperativo?: boolean | number | null;
  id?: number;
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
