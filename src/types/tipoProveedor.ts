export interface TipoProveedor {
  id: number;
  id_branch: number;
  code: number;
  id_proveedor: number | null;
  name: string;
  description: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
  categoria: string | null;
}

export interface TipoProveedorForm {
  id: number | null;
  code: number | null;
  id_proveedor: number | null;
  name: string;
  description: string;
  status: number;
}

export interface FiltroTipoProveedor {
  code: string;
  name: string;
  status: number | null;
}
