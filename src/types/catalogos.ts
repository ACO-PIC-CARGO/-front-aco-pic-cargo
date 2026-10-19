import type { Incoterm } from "@/types/cotizacion";

export interface Moneda {
  id: number;
  code: string;
  symbol: string;
  acronym: string;
  name: string;
  description: string | null;
  status: number;
  calculoflag?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroMonedas {
  code: string | null;
  symbol: string | null;
  acronym: string | null;
  name: string | null;
  description: string | null;
  status: number | string;
}

export type FormMoneda = Partial<Moneda> & { id_branch?: number };

export interface ComentarioPredefinido {
  id: number | string;
  code: string;
  comentario: string;
  status: number | boolean;
  id_branch: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroComentariosPredefinidos {
  code?: string | null;
  comentario?: string | null;
  status?: number | string;
}

export type FormComentarioPredefinido = Partial<ComentarioPredefinido>;

export interface TipoContenedor {
  id: number;
  code: string;
  name: string;
  description: string | null;
  long: number | null;
  width: number | null;
  height: number | null;
  maximumweight: number | null;
  maximunvolumen: number | null;
  status: number;
  calculoflag?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type FormContenedor = Partial<TipoContenedor> & { id_branch?: number };

export interface TipoDocumento {
  id: number;
  code: string;
  name: string;
  description: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export type FormDocumento = Partial<TipoDocumento> & { id_branch?: number };

export interface FiltroCatalogo {
  code: string | null;
  name: string | null;
  description: string | null;
  status: number | string | boolean;
}

export interface TipoGasto {
  id: number;
  code: string;
  description: string;
  calculoflag: boolean;
  status: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroGastoIngreso {
  code: string | null;
  description: string | null;
  calculoflag: boolean | string;
  status: boolean | string;
}

export type FormGasto = Omit<Partial<TipoGasto>, "calculoflag"> & { id_branch?: number; calculoflag?: boolean | string };

export interface SubGasto {
  id: number | string;
  id_gasto: number | string | null;
  description_gasto?: string;
  code: string | null;
  description: string | null;
  status: boolean | number | string;
  id_branch?: number | string;
  calculoflag: boolean;
  mostrarflag: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroSubGasto {
  id: string;
  id_gasto: number | string | null;
  code: string | null;
  description: string | null;
  status: boolean | string;
  id_branch: string;
  calculoflag: boolean | string;
  mostrarflag: boolean | string;
}

export interface GrupoServicio {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export type FormServicio = Partial<GrupoServicio> & { id_branch?: number };

export interface ItemServicio {
  id: number | string;
  id_groupservices: number | string | null;
  name_groupservices?: string;
  code: string | null;
  name: string | null;
  description: string | null;
  id_branch?: number | string;
  status: number | string;
  status_calls?: number;
  status_calls_all?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroItemServicio {
  id: string;
  id_groupservices: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  id_branch: string;
  status: number | string;
}

export interface TipoIngreso {
  id: number;
  code: string;
  description: string;
  calculoflag: boolean;
  status: boolean | number;
  created_at?: string | null;
  updated_at?: string | null;
}

export type FormIngreso = Omit<Partial<TipoIngreso>, "calculoflag"> & { id_branch?: number; calculoflag?: boolean | string };

export interface SubIngreso {
  id: number | string;
  id_ingreso: number | string | null;
  description_ingreso?: string;
  code: string | null;
  description: string | null;
  status: boolean | number | string;
  id_branch?: number | string;
  calculoflag: boolean;
  mostrarflag: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroSubIngreso {
  id: string;
  id_ingreso: number | string | null;
  code: string | null;
  description: string | null;
  status: boolean | string;
  id_branch: string;
  calculoflag: boolean | string;
  mostrarflag: boolean | string;
}

export interface FiltroIncoterms {
  name: string | null;
  description: string | null;
  status: number | string;
}

export type FormIncoterm = Incoterm & { id_branch?: number };

export interface Marketing {
  id: number;
  code: string;
  name: string;
  description: string | null;
  position: number | string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroMarketing {
  name: string | null;
  description: string | null;
  position: number | string | null;
  status: number | string;
}

export type FormMarketing = Partial<Marketing> & { id_branch?: number };

export interface UltimaPosicionMarketing {
  maxposition?: number;
}

export interface Modalidad {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroModalidad {
  code: string | null;
  name: string | null;
  description: string | null;
  status: number | string;
}

export type FormModalidad = Partial<Modalidad> & { id_branch?: number };

export interface Performance {
  id: number;
  code: string;
  description: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroPerformance {
  code: string | null;
  description: string | null;
  status: number | string;
}

export type FormPerformance = Partial<Performance> & { id_branch?: number };

export interface Sexo {
  id: number;
  code: string;
  name: string;
  acronym: string;
  description: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroSexo {
  code: string | null;
  name: string | null;
  acronym: string | null;
  description: string | null;
  status: number | string;
}

export type FormSexo = Partial<Sexo> & { id_branch?: number };

export interface Anio {
  id: number;
  description: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroAnio {
  description: string | null;
  status: number | string;
}

export type FormAnio = Partial<Anio> & { id_branch?: number };

export interface TipoTelefono {
  id: number;
  code: string;
  name: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroTipoTelefono {
  code: string | null;
  name: string | null;
  status: number | string;
}

export type FormTipoTelefono = Partial<TipoTelefono> & { id_branch?: number };

export interface Transporte {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroTransporte {
  code: string | null;
  name: string | null;
  description: string | null;
  status: number | string;
}

export type FormTransporte = Partial<Transporte> & { id_branch?: number };

export interface TipoCarga {
  id: number;
  code: string;
  name: string;
  description: string | null;
  id_transport: number | string | null;
  type_transport?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroTipoCarga {
  id_transport: number | string | null;
  name: string | null;
  description: string | null;
  status: number | string;
}

export type FormTipoCarga = Partial<TipoCarga> & { id_branch?: number };

export interface FiltroMultiplicador {
  code: string | null;
  name: string | null;
  description: string | null;
  id_shipment: number | string | null;
  status: number | string;
}
