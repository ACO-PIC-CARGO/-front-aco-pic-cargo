import type { RolProveedor } from "@/types/entidades";
import type { UsuarioSesion } from "@/types/sesion";

/** A root form field: the screens keep text, numbers or null in it. */
export type CampoRaiz = string | number | null;

/** A row that a select puts in a root field: transport, container, phone type, predefined comment. */
export interface SeleccionRaiz {
  id?: number | string;
  name?: string;
  id_transport?: number | string;
  [campo: string]: unknown;
}

/** A root list row whose fields the root actions never read. */
export type FilaRaiz = Record<string, unknown>;

/** The master and house list filters: four date bounds plus the fields the filter drawers set. */
export interface FiltroExpedientesRaiz {
  fecha_etd_desde: string | null;
  fecha_eta_desde: string | null;
  fecha_etd_hasta: string | null;
  fecha_eta_hasta: string | null;
  id_canal?: CampoRaiz;
  id_sentido?: CampoRaiz;
  id_tipo_embarque?: SeleccionRaiz | null;
  id_origen?: CampoRaiz;
  id_destino?: CampoRaiz;
  id_agente?: CampoRaiz;
  id_master?: CampoRaiz;
  id_cliente?: CampoRaiz;
  fecha_etd?: CampoRaiz;
  fecha_eta?: CampoRaiz;
  status_operativo?: CampoRaiz;
  status_administrativo?: CampoRaiz;
  pagina?: number;
  limite?: number;
  orden?: string;
  busqueda?: string;
  [campo: string]: unknown;
}

export interface FiltroCargaMasterRaiz {
  idsentido?: CampoRaiz;
  idtipocarga?: CampoRaiz;
  idincoterms?: CampoRaiz;
  idorigen?: CampoRaiz;
  [campo: string]: unknown;
}

export interface TipoTelefonoRaiz {
  id: number;
  name: string;
}

export interface TelefonoRaiz {
  id?: number | string;
  name?: string;
  number: CampoRaiz;
}

export interface TelefonoListadoRaiz {
  id: number;
  name: string;
  phone_number: string;
}

export interface ContactoRaiz {
  name: string;
  number: CampoRaiz;
}

export interface GrupoMenuRaiz {
  namegroup: string;
  [campo: string]: unknown;
}

export interface NroMasterRaiz {
  nro_master: number | string;
}

export interface NroHouseRaiz {
  nro_house: number | string;
}

export interface ControlRaiz {
  nrocontrol: CampoRaiz;
  idcontrol: CampoRaiz;
  idorders: CampoRaiz;
  [campo: string]: unknown;
}

export interface PagoProveedorRaiz {
  index?: number;
  tipocambio?: number | string;
  id_coins?: number | string;
  [campo: string]: unknown;
}

/** A role row as getRole answers it, before its id is parsed. */
export type RolSinParsearRaiz = Omit<RolProveedor, "id"> & { id: string };

export type UsuarioSesionRaiz = UsuarioSesion & { id_user?: number };
