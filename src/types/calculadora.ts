import type { Numerico } from "@/types/cotizacion";

export interface FiltroCalculadora {
  shimpent?: string;
  id_modality?: number;
  id_pais?: number;
  id_branch?: number;
  id_state?: number | null;
  tipo?: string;
}

export interface TipoCostoCalculadora {
  id: string;
  nombre: string;
  id_modality?: number;
  modality?: string;
}

export interface ServicioCalculadora {
  id?: string;
  id_modality?: number;
  modality?: string;
  id_pais?: number | string;
  pais?: string;
  code?: string;
  descripcion?: string;
  orden?: number | string;
  icon?: string;
  opcionflag?: boolean;
  opcionalflag?: boolean;
}

export interface CostoCalculadora {
  id?: string;
  id_pais?: number;
  id_service?: number | null;
  id_tipocosto?: number | null;
  id_proveedor?: number | null;
  id_multiplicador?: number | null;
  concepto?: string | null;
  punitario?: Numerico;
  unitario?: Numerico;
  costominimo?: Numerico;
  fechavalidez?: string | null;
  opcion?: number | string;
  escostoflag?: boolean;
  esventaflag?: boolean;
  EsCostoFlag?: boolean;
  EsVentaFlag?: boolean;
  bloqueadoflag?: boolean;
  users?: string;
  user?: string;
}

export interface FleteCalculadora {
  id?: string | null;
  shipment?: string | null;
  id_modality?: number | null;
  modality?: string | null;
  id_pais_origen?: number | null;
  pais_origen?: string | null;
  puerto_origin?: string | null;
  id_pais_destino?: number | null;
  pais_destino?: string | null;
  puerto_destino?: string | null;
  flete_0_5?: Numerico;
  flete_5_10?: Numerico;
  flete_10_15?: Numerico;
  moneda?: string | null;
  vigencia?: string | null;
  created_user?: string | null;
  created_at?: string | null;
}

export interface ProfitCalculadoraFila {
  id?: string | null;
  profit?: Numerico;
  peso?: Numerico;
  volumen?: Numerico;
  valor?: Numerico;
  metromc?: Numerico;
  metromcad?: Numerico;
  estado?: boolean | null;
  opcion?: number | null;
}

export interface FormProfitCalculadora {
  id?: string | null;
  id_modality: number;
  shimpent: string;
  opcion: number;
  profit: Numerico;
  pesomin?: Numerico;
  pesomax?: Numerico;
  volumenmin?: Numerico;
  volumenmax?: Numerico;
  valormin?: Numerico;
  valormax?: Numerico;
  peso?: unknown;
  volumen?: unknown;
  valor?: unknown;
  metromc?: unknown;
  metromcad?: Numerico;
  user?: string;
  id_pais?: number;
}

export interface TransporteCalculadora {
  id?: string | null;
  peso_desde?: Numerico;
  peso_hasta?: Numerico;
  tarifadolar?: Numerico;
  tarifamonlocal?: Numerico;
  id_provincia?: number | null;
  provincia?: string | null;
  id_distrito?: number | null;
  distrito?: string | null;
  opcion?: number | null;
  tipocambio?: Numerico;
  shimpent?: string;
  id_modality?: number;
  index?: number;
}

export interface LoteTransporteCalculadora {
  shimpent?: string;
  id_modality?: number;
  datos?: TransporteCalculadora[];
  datovalidar?: TransporteCalculadora[];
}

export interface UbicacionCalculadora {
  id: number;
  name: string;
  id_city?: number;
  id_departamento?: number;
}

export interface OpcionCalculadora {
  id: string;
  nombre?: string;
  frecuencia?: string;
  estado?: boolean;
  orden?: number;
  esgrupalflag?: boolean;
  volumenmax?: Numerico;
  toneladamax?: Numerico;
  editarflag?: boolean;
}

export interface ConfiguracionCalculadora {
  id: string;
  codigo?: string;
  descripcion?: string;
  texto?: string | null;
  valorjson?: unknown;
  numero?: Numerico;
  fecha?: string | null;
  editarflag?: boolean;
  user?: string;
}

export interface FleteGrupal {
  id?: string;
  volumen?: Numerico;
  peso?: Numerico;
  valor?: Numerico;
  vigencia?: string | null;
  vigencia_text?: string;
  estado?: boolean;
  id_pais?: number;
}

export interface FleteGrupalResumen {
  id_pais?: number;
  volumen?: Numerico;
  peso?: Numerico;
  monto?: Numerico;
  montoventa?: Numerico;
  vigencia?: string | null;
  vigenciaventa?: string | null;
}

export interface FletePricingCalculadora {
  monto_flete?: Numerico;
  vigencia?: string | null;
  monto_flete_grupal?: Numerico;
  vigencia_grupal?: string | null;
  monto_flete_grupal_venta?: Numerico;
  vigencia_grupal_venta?: string | null;
}

export interface FiltroFleteCalculadora {
  shipment?: string;
  puerto_origen?: string;
  puerto_destino?: string;
  volumen?: Numerico;
  peso?: Numerico;
  id_branch?: number;
}

export interface DetalleLlamadaCalculadora {
  id?: string;
  fecha?: string;
  comentario?: string;
  nombrecompleto?: string;
}

export interface UsuarioCalculadora {
  id: string;
  tipo?: string;
  id_pais_origen?: number;
  port_origen?: string;
  id_pais_destino?: number;
  port_destino?: string;
  peso?: Numerico;
  volumen?: Numerico;
  valormercancia?: Numerico;
  email?: string;
  created_at?: string;
  nombre?: string;
  telefono?: string;
  estadocotizacion?: number;
  capture_cotizacion?: string | null;
  tienegrupalflag?: boolean;
  tieneindividualflag?: boolean;
  id_status_quote?: string | null;
  estado_cotizacion?: string;
  comentario?: string;
  detalle?: DetalleLlamadaCalculadora[];
  usuario_nombre?: string;
  usuario_id?: number;
  usuario_system?: unknown;
  list_call?: unknown[];
}

export interface DetalleCalculoCotizacion {
  pais_destino?: string;
  naviera?: string;
  agentes_lcl_nombre?: string;
  agentes_aereo_nombre?: string;
}

export interface ConceptoCotizacionCalculadora {
  tipo?: string;
  nombre?: string;
  detalles?: string;
  valor: number;
  detalles_calculos: DetalleCalculoCotizacion;
  input_contenedores?: [number, number][];
}

export interface SucursalCalculadora {
  paises_id?: number;
  paises_nombre?: string;
}

export interface NavieraCalculadora {
  navieras_nombre?: string;
}

export interface ContenedorCalculadora {
  contenedores_nombre?: string;
}

export interface PuertoCalculadora {
  puerto_descripcion?: string;
}

export interface FleteLclValidado {
  pais_origen?: string;
  puerto_origen?: string | null;
  id_pais_origen?: number | string | null;
  pais_destino?: string;
  puerto_destino?: string | null;
  id_pais_destino?: number | string | null;
  flete_0_5?: Numerico;
  flete_5_10?: Numerico;
  flete_10_15?: Numerico;
  moneda?: string;
  vigencia?: string;
}

export interface EnvioCotizacionCalculadora {
  id: unknown;
  individualflag: boolean;
  grupalflag: boolean;
}

export interface CotizacionCreadaCalculadora {
  id_quote_out: number;
}

export interface MensajeCalculadora {
  tipomensaje?: string;
  mensaje?: string;
}
