import type { Numerico } from "@/types/cotizacion";

export type ValorCelda = Numerico | boolean;

export interface FilaBalance {
  [campo: string]: ValorCelda;
}

export interface CabeceraBalance {
  title: string;
  key: string;
  headerProps?: { class: string };
  sortable?: boolean;
}

export interface MesBalance {
  text: string;
  value: string;
}

export interface RegistroFlujoMes {
  tipo: string;
  subtipo: string;
  informacion: string;
  descripcion: string;
  persona: string;
  monto: Numerico;
  semana: number;
  ingresoflag?: boolean | number | null;
  gastoflag?: boolean | number | null;
  proyeccionflag?: boolean | number | null;
}

export interface CostoFlujoMes {
  descripcion: string;
  persona: string;
  costo: Numerico;
  semana: number;
}

export interface DescripcionFlujoMes {
  subtipo: string;
  costo: CostoFlujoMes[];
  descripcion: string;
  costoflag: boolean;
  totalDescripcion: number;
}

export interface SubtipoFlujoMes {
  subtipo: string;
  descripcion: DescripcionFlujoMes[];
  descripcionflag: boolean;
  totalSubTipo: number;
  informacion: string;
}

export interface TipoFlujoMes {
  tipo: string;
  subtipo: SubtipoFlujoMes[];
  subtipoflag: boolean;
  totalTipo: number;
}

export interface FiltroFlujoMes {
  id_proveedor: string | number;
  id_cliente: string | number;
  nro_expediente: string | number;
}
