export interface Moneda {
  id: number;
  code: string;
  symbol: string;
  acronym: string;
  name: string;
  description: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface ComentarioPredefinido {
  id: number | string;
  code: string;
  comentario: string;
  status: number | boolean;
  id_branch: number;
  created_at?: string;
  updated_at?: string;
}

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
  created_at?: string;
  updated_at?: string;
}

export interface TipoDocumento {
  id: number;
  code: string;
  name: string;
  description: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface FiltroCatalogo {
  code: string;
  name: string;
  description: string;
  status: number | string | boolean;
}
