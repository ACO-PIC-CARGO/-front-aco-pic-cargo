import type { UsuarioLogin } from "@/types/sesion";

export interface EmpresaListado {
  id: number;
  td_name?: string;
  document?: string;
  trade_name?: string;
  business_name?: string;
  lp_name?: string;
  ls_name?: string;
  lc_name?: string;
  lt_name?: string;
  address?: string;
  phone?: string;
  status?: number | string | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmpresaDetalle {
  id?: number;
  td_name?: string;
  document?: string;
  trade_name?: string;
  business_name?: string;
  slogan?: string;
  ic?: string;
  name_file?: string;
  originalname?: string;
  id_logo?: number | string;
  id_pais?: number | string;
  id_state?: number | string;
  id_city?: number | string;
  id_town?: number | string | null;
  id_document?: number | string;
  lp_name?: string;
  ls_name?: string;
  lc_name?: string;
  lt_name?: string;
  address?: string;
  phone?: string;
  status?: number | string | boolean;
  tipoimpuesto?: number | string;
  impuesto?: number | string;
}

export interface FiltroEmpresa {
  id_branch: number;
  id: number | string;
  slogan: string | null;
  document: string | null;
  trade_name: string | null;
  business_name: string | null;
  address: string | null;
  status: number | string | null;
  id_pais: number | string | null;
  id_state: number | string | null;
  id_city: number | string | null;
  id_town: number | string | null;
  id_document: number | string | null;
  id_logo: number | string | null;
  ic: string | null;
}

export interface FormEmpresa {
  id_logo: number | string;
  document: string;
  trade_name: string;
  business_name: string;
  phone: string;
  slogan?: string;
  address: string;
  status: number | string;
  id_pais: number | string;
  id_state: number | string;
  id_city: number | string;
  id_town: number | string;
  id_document: number | string;
  ic: string;
}

export interface FormEnterpriseUpdate extends Omit<FormEmpresa, "id_town"> {
  id_branch: number;
  id: number | string;
  id_town: number | string | null;
  originalname: string;
  name_file: string;
  impuesto: number | string;
  tipoimpuesto: number | string;
}

export interface DatosRegistroEmpresa {
  trade_name: string;
  id_pais: number | string;
  names: string;
  surname: string;
  second_surname: string;
  email: string;
  phone: string;
  clave: string;
  emailconfirmacion?: string;
  codigo?: string;
}

export interface ImpuestoEmpresa {
  nombre_impuesto?: string;
  impuesto?: number;
  mostrarimpuesto?: boolean;
}

export interface CuentaEmpresa {
  banco?: string;
  banco_acronym?: string;
  nrocuenta?: string;
  nrocci?: string;
  esprincipalflag: boolean;
  moneda?: string;
  monedacronym?: string;
}

export interface FormCuentaEmpresa {
  id_banco: number | string;
  id_coins: number | string;
  numerocuenta: string;
  cci: string;
  esprincipalflag: boolean;
  acronymbanco: string;
  nombrebanco: string;
  id_branch?: number;
}

export interface RegistroNuevaEmpresaRow {
  // Kept: data_users is an array, so id_secutiry has always been undefined.
  data_users: UsuarioLogin[] & { id_secutiry?: number };
  data_branch: unknown;
}

export interface DatoEmpresaConfig {
  id?: number | string;
  id_document?: number | string;
  document?: string;
  trade_name?: string;
  logo?: string;
  id_pais?: number | string;
  id_logo?: number | string;
  address?: string;
  tipoimpuesto?: number | string;
  impuesto?: number | string | null;
  usarclientes?: boolean;
  usaropadmin?: boolean;
  img?: File | File[] | null;
}

export interface DatoUsuarioConfig {
  usuario?: string;
  birthday?: string;
  departamento?: string;
  description?: string;
  document?: string;
  ic?: string;
  id?: number | string;
  id_branch?: number | string;
  id_document?: number | string;
  id_pais?: number | string;
  id_sex?: number | string;
  id_user?: number | string;
  names?: string;
  nombrecompleto?: string;
  path?: string;
  second_surname?: string;
  surname?: string;
  phone?: string;
  email?: string;
}

export type CeldaCarga = string | number | boolean | Date | null | undefined;

export interface ProveedorCarga {
  nombre_comercial: CeldaCarga;
  nro_documento: CeldaCarga;
  contacto_1: CeldaCarga;
  contacto_telf_1: CeldaCarga;
  contacto_2: CeldaCarga;
  contacto_telf_2: CeldaCarga;
  direccion: CeldaCarga;
  telefono_1: CeldaCarga;
  telefono_2: CeldaCarga;
  email: CeldaCarga;
}

export interface ClienteCarga {
  document: CeldaCarga;
  nombre_completo: CeldaCarga;
  nombre_fiscal: CeldaCarga;
  direccion: CeldaCarga;
  emailaddress: CeldaCarga;
  contacto_1: CeldaCarga;
  contacto_telf_1: CeldaCarga;
  contacto_2: CeldaCarga;
  contacto_telf_2: CeldaCarga;
  telefono_1: CeldaCarga;
  telefono_2: CeldaCarga;
}

export interface CostoConfig {
  exwflag?: boolean;
  fcaflag?: boolean;
  fobflag?: boolean;
  cfrflag?: boolean;
  cifflag?: boolean;
  ddpflag?: boolean;
  tramo?: string;
  servicio?: string;
  concepto?: string;
  id_multiplicador?: number | string;
  monto?: number | string | null;
  id_proveedor?: number | string;
  seccion?: string;
  code?: number | string;
}

export interface MultiplicadorConfig {
  id: number;
  value: number;
  code: string;
  text: string;
  valor: number;
}

export interface TipoCostoConfig {
  name: string;
  codigo?: string;
}

export interface CorrelativosConfig {
  correlativopricing: number | null;
  correlativomaster: number | null;
  correlativocge: number | null;
}

export interface FiltroCostosConfig {
  id_modality: number | string;
  shipment: string;
}

export interface GuardarCostosConfig {
  id_modality: number | string;
  id_shipment: number | string;
  lstCostos: CostoConfig[];
  id_branch?: number;
}
