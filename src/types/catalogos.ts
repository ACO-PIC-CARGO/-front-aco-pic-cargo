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
  code: string;
  description: string;
  calculoflag: boolean | string;
  status: boolean | string;
}

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
