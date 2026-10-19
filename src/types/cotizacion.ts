export type Numerico = number | string | null | undefined;

export interface Impuesto {
  id?: number | string;
  codigo?: number | string;
  codigo01?: Numerico;
  descripcion?: string;
  nro_propuesta?: number | string;
}

export interface ContenedorCantidad {
  id?: number | string;
  id_containers?: number | string;
  cantidad?: number;
}

export interface DatosPrincipales {
  amount?: Numerico;
  metroscc?: Numerico;
  kg?: Numerico;
  volumen?: Numerico;
  peso?: Numerico;
  containers?: ContenedorCantidad[] | null;
}

export interface Multiplicador {
  id?: number | string;
  code?: number | string | null;
  valor?: Numerico;
  id_container?: number | string | null;
  text?: string;
}

export interface Costo {
  [campo: string]: unknown;
  id?: number | string | null;
  id_multiplicador?: number | string;
  id_groupservices?: number | string;
  nameservice?: string;
  status?: Numerico | boolean;
  costounitario?: Numerico;
  minimo?: Numerico;
  cif?: Numerico;
  seguro?: Numerico;
  code_service?: string;
  code_cost?: number | string | null;
  esorigenflag?: Numerico | boolean;
  esfleteflag?: Numerico | boolean;
  eslocalflag?: Numerico | boolean;
  esaduanaflag?: Numerico | boolean;
  esgastostercerosflag?: Numerico | boolean;
  esalmacenflag?: Numerico | boolean;
  esventaflag?: Numerico | boolean;
}

export interface Servicio {
  id?: number | string;
  id_begend?: number | string;
  id_groupservices?: number | string;
  service?: string;
  code_service?: string;
  status?: number | string;
}

export interface Nota {
  id?: number | string;
  descripcion?: string;
  statusincluye?: unknown;
  statusnoincluye?: unknown;
  state?: number | string;
  nro_propuesta?: number | string;
}

export interface EstadoCotizacion {
  id?: number | string;
  code?: number | string;
  name?: string;
}

export interface ItemBegEnd {
  codebegend?: string;
  categoria_role?: string;
}

export interface ContenedorEnvio {
  description?: string;
  cantidad?: number | string;
  code?: string;
}

export interface TipoCarga {
  id?: number | string;
  code?: string;
}

export interface ArchivoDrive {
  id?: string;
  name?: string;
  folder?: unknown;
  extension?: string;
  webUrl?: string;
}

export interface Incoterm {
  id?: number | string;
  name?: string;
  description?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Puerto {
  id_port?: number | string;
  name?: string;
}

export interface OpcionCosto {
  date_end?: string;
  tiempo_transito?: Numerico;
  listCostos: Costo[];
}

export interface DatoTarifaProveedor {
  contacto?: string;
  email?: string;
  proveedorprincipalflag?: boolean;
  selected?: boolean;
}
