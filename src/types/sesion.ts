export interface UsuarioSesion {
  id?: number;
  id_branch: number;
  names: string;
  nombrecompleto: string;
  path?: string;
  id_sex?: number;
  position_code?: string[];
  correoemail?: string;
  user?: string;
  usuario?: string;
  users?: string;
}

export interface SucursalSesion {
  id: number;
  trade_name: string;
  iso_pais: string;
  logo?: string;
  porcentaje_config: string;
  esnuevoflag: boolean;
  tienefleteactivo?: boolean;
  status?: number | boolean;
  dias_restantes: number;
  vigencia?: string;
  id_pais?: number;
  document?: string;
  address?: string;
  phone?: string;
}

export interface ItemMenu {
  id: number;
  name: string;
  route?: string;
  icon?: string;
  children?: ItemMenu[];
}

export interface ModuloEntidad {
  id: number | string;
  name: string;
}

export interface UsuarioLogin {
  id: number;
  id_entitie: number;
  id_secutiry: number;
  id_user?: number;
  id_branch?: number | string;
}
