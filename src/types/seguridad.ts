export interface SucursalListado {
  id: number;
  trade_name: string;
  address?: string;
  pais?: string;
  created_at?: string;
  nombrecompleto?: string;
  phone?: string;
  ultimologin?: string;
  status: number | boolean;
}

export interface UsuarioPosicion {
  id: number;
  id_position?: number;
  code?: string;
  name: string;
  estado?: boolean;
  status?: number | boolean;
}

export interface UsuarioSucursal {
  id: number;
  id_branch?: number;
  document?: string;
  trade_name: string;
  status?: number | boolean;
}

export interface UsuarioListado {
  id: number;
  nombrecompleto: string;
  users: string;
  phone: string;
  status: number | boolean;
  status_calls?: number | boolean;
  status_calls_all?: number | boolean;
  json_position?: { name: string }[];
  json_menu?: { name: string }[];
}

export interface FormUsuario {
  id?: number | string;
  id_entitie?: number | string;
  id_pais?: number | string;
  id_city?: number | string;
  id_state?: number | string;
  id_town?: number | string;
  id_branch?: number;
  users?: string;
  id_document?: number | string;
  document?: string;
  id_sex?: number | string;
  status?: string | number | boolean;
  departamento?: string | number;
  names?: string;
  surname?: string;
  second_surname?: string;
  socialprincipal?: string;
  socialsecundary?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  email?: string;
  estadoflag?: boolean;
  cambiarClave?: boolean;
  clave?: string;
  confirmclave?: string;
  positions?: UsuarioPosicion[];
  sucursales?: UsuarioSucursal[];
}

export interface UsuarioDetalle extends FormUsuario {
  positions: UsuarioPosicion[];
  sucursales: UsuarioSucursal[];
}

export interface FiltroUsuario {
  users: string;
  nombrecompleto: string;
  id_document: number | string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  status: string;
}

export interface UsuarioExistente {
  id_entitie: number;
  address: string;
  birthday: string;
  estadoflag: boolean;
  id_city: number;
  id_pais: number;
  id_sex: number;
  id_state: number;
  id_town: number;
  names: string;
  second_surname: string;
  socialprincipal: string;
  socialsecundary: string;
  surname: string;
}

export interface PosicionListado {
  id: number;
  id_position?: number;
  code: string;
  name: string;
  description?: string;
  estado: boolean;
  status?: number | boolean;
  created_at?: string;
  updated_at?: string;
  status_calls?: number | boolean;
  status_calls_all?: number | boolean;
}

export interface PosicionPermiso {
  id: number;
  name: string;
  uso?: boolean;
}

export interface PosicionUsuario {
  id: number;
  users: string;
  document?: string;
  nombrecompleto?: string;
  phone?: string;
  departamento?: string | number;
  estado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FormPosicion {
  id?: number | string;
  id_pais?: number | string;
  id_state?: number | string;
  id_branch?: number;
  code?: string;
  name?: string;
  description?: string;
  estado?: boolean | string;
  status?: number | boolean;
  modules_position?: PosicionPermiso[];
  button_position?: PosicionPermiso[];
  user_position?: PosicionUsuario[];
}

export interface FiltroPosicion {
  id?: number | string;
  id_pais?: number | string;
  id_city?: number | string;
  id_state?: number | string;
  id_town?: number | string;
  code: string | null;
  name: string | null;
  description: string | null;
  estado: boolean | string;
}

export interface UsuarioNoAsignado {
  id: number;
  users: string;
}

export interface MasterDetalle {
  id: number;
  id_master?: number | string;
  valorcodigo: string;
  codigo01?: string;
  codigo02?: string;
  description?: string;
  descripcion?: string;
  status?: boolean | number;
  escomunflag?: boolean | string;
  individualflag?: boolean;
  grupalflag?: boolean;
  orden?: number | string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormMasterDetalle {
  id?: number | string;
  id_master?: number | string;
  id_branch?: number | string;
  id_state?: number | string;
  valorcodigo: string;
  codigo01?: string;
  codigo02?: string;
  description?: string;
  status?: boolean | number;
  escomunflag?: boolean | string;
  individualflag?: boolean;
  grupalflag?: boolean;
  orden?: number | string | null;
}

export interface FiltroMasterDetalle {
  id: number | string;
  id_master: number | string;
  valorcodigo: string | null;
  codigo01: string | null;
  codigo02: string | null;
  description: string | null;
  status: boolean | string | null;
  escomunflag: boolean | string;
  individualflag?: boolean;
  grupalflag?: boolean;
  orden?: number | null;
}

export interface PersonaRol {
  id: number;
  nombrecompleto: string;
  proveedorflag: boolean;
  clienteflag: boolean;
  personalflag: boolean;
}
