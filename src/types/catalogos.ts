import type { Incoterm, TipoCarga } from "@/types/cotizacion";

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

export type FormMarketing = Omit<Partial<Marketing>, "id"> & { id?: number | ""; id_branch?: number };

export interface UltimaPosicionMarketing {
  maxposition?: number;
}

export interface Modalidad {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: number | boolean;
  created_at?: string;
  updated_at?: string;
  selected?: boolean;
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
  code?: string | null;
  name?: string | null;
  status?: number | string;
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

export interface Ciudad {
  id: number | string;
  id_pais: number | string;
  id_state: number | string;
  name_pais?: string;
  name_state?: string;
  code: string;
  name: string;
  description: string | null;
  status: number | string | boolean;
  status_calls?: number;
  status_calls_all?: number;
  id_branch?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroCiudad {
  id: string;
  id_pais: number | string | null;
  id_state: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  status: string;
}

export interface EstadoRegion {
  id: number | string;
  id_pais: number | string;
  name_pais?: string;
  code: string;
  name: string;
  description: string | null;
  status: number | string | boolean;
  status_calls?: number;
  status_calls_all?: number;
  id_branch?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroEstadoRegion {
  id: string;
  id_pais: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  status: string;
}

export interface Distrito {
  id: number | string;
  id_pais: number | string;
  id_state: number | string;
  id_city: number | string;
  id_town?: number | string;
  name_pais?: string;
  name_state?: string;
  name_city?: string;
  code: string;
  name: string;
  description: string | null;
  status: number | string | boolean;
  status_calls?: number;
  status_calls_all?: number;
  id_branch?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroDistrito {
  id: string;
  id_pais: number | string | null;
  id_city?: number | string | null;
  id_state: number | string | null;
  id_town?: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  status: string;
}

export interface FiltroPuerto {
  id: string;
  id_pais: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  id_transporte: number | string | null;
  status: string;
}

export interface Motonave {
  id: number | string;
  id_pais?: number | string;
  code?: string;
  name: string;
  description: string | null;
  id_transporte?: number | string;
  status: number | string | boolean;
  status_calls?: number;
  status_calls_all?: number;
  id_branch?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroMotonave {
  id: string;
  id_pais: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  id_transporte: number | string | null;
  status: string;
}

export interface Begend {
  id: number | string;
  position: number | string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  status: number | string | boolean;
  status_calls?: number;
  status_calls_all?: number;
  id_branch?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroBegend {
  id: string;
  id_pais?: number | string | null;
  id_state?: number | string | null;
  position?: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  color?: string | null;
  status: string;
}

export type FormBegend = Partial<Begend> & { ccode?: string };

export interface TipoPago {
  id: number | string;
  code: string;
  name: string;
  description: string | null;
  position?: number | string;
  status: number | string | boolean;
  status_calls?: number | string;
  status_calls_all?: number | string;
  id_branch?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroTipoPago {
  id: string;
  id_pais?: number | string | null;
  id_state?: number | string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  status: boolean | number | string;
}

export interface FiltroEstadoCotizacion {
  id: string;
  id_masterdetalletemperaturaventa?: number | string | null;
  name: string | null;
  code: string | null;
  position: number | string | null;
  position_select: number | string | null;
  position_report: number | string | null;
  position_calls: number | string | null;
  status_calls: number | string | null;
  status_calls_all: number | string | null;
  description: string | null;
  status: string;
  id_branch: number | string;
}

export interface PosicionMaximaEstado {
  position: number;
  position_calls: number;
  position_report: number;
  position_select: number;
}

export interface ComentarioEstadoHouse {
  id?: number | string;
  descripcion: string;
  orden?: number;
  comentario?: string;
  comentariousuado?: boolean;
}

export interface EstadoHouse {
  id: number | string;
  name: string;
  id_modalidad: number | string;
  id_shipment: number | string;
  modalidad?: string;
  shipment?: string;
  exwflag: boolean;
  fobflag: boolean;
  fcaflag: boolean;
  cfrflag: boolean;
  cifflag: boolean;
  ddpflag: boolean;
  comentarios: ComentarioEstadoHouse[];
  orden: number | string;
  verComentarios?: boolean;
}

export interface OrdenEstadoHouse {
  orden: number | string;
}

export interface Aerolinea {
  id?: number | string;
  code?: string;
  code_iata: string;
  code_icao: string;
  code_three: string;
  name: string;
  id_pais: number | string;
  pais_name?: string;
  status: number | string | boolean;
  id_branch?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroAerolinea {
  code_iata: string;
  name: string;
  code_icao: string;
  code_three: string;
  id_pais: number | string | null;
  created_at: string;
  updated_at: string;
  code: string;
  status: boolean | number | string;
  id_branch?: number | string;
}

export interface Pais {
  id: number;
  name: string;
  phoneprefix?: string;
  codigo_iso?: string | null;
}

export interface DocumentoPais {
  id: number;
  name: string;
  description: string;
}
