import type { Costo, Incoterm, Numerico } from "./cotizacion";

export interface CostoPricing {
  id?: number | null;
  id_costo?: number | null;
  id_service?: number | null;
  id_multiplicador?: number | string;
  id_proveedor?: number | string | null;
  costo?: string;
  precio?: number | string;
  minimo?: number | string;
  maximo?: number;
  considerarvalorminimoflag?: boolean;
  status?: number;
  eslocalflag?: number;
  esaduanaflag?: number;
  esalmacenflag?: number;
  esfleteflag?: number;
  esgastostercerosflag?: number;
  id_modality?: number | string | null;
  id_shipment?: number | string | null;
  id_incoterms?: number | string | null;
}

export type FormNuevoCostoPricing = CostoPricing & { idOpcion?: string };

export interface FiltroCostosPricing {
  id_modality: number | string;
  id_shipment: number | string;
  id_incoterms: number | string;
  id_branch?: number;
}

export interface FiltroIncotermsCostos {
  id_modality: number | string;
  id_shipment: number | string;
  id_branch?: number;
}

export interface GuardarCostosPricing {
  lstCostos: CostoPricing[];
  id_incoterms: number | string;
}

export interface ServicioPricingConfig {
  id: number;
  service: string;
}

export interface IncotermConfigCostos extends Incoterm {
  updated_config?: string;
}

export interface TextoWhatsapp {
  pdfindividual?: string;
  pdfgrupal?: string;
  linkindividual?: string;
  linkgrupal?: string;
  pdf?: string;
  link?: string;
}

export interface TextoWhatsappFcl {
  id_container: number | string;
  name?: string;
  code?: string;
  texto: TextoWhatsapp;
}

export interface TextoWhatsappConfig {
  id: number | null;
  lcl: TextoWhatsapp;
  fcl: TextoWhatsappFcl[];
}

export interface GuardarTextoWhatsappLcl {
  lcl: TextoWhatsapp;
  id?: number | null;
  id_branch?: number;
}

export interface GuardarTextoWhatsappFcl {
  fcl: TextoWhatsappFcl[];
  id?: number | null;
  id_branch?: number;
}

export interface CostoBase {
  id?: number;
  code?: number;
  tramo?: string;
  seccion?: string;
  servicio?: string;
  concepto?: string;
  multiplicador?: string;
  monto?: number | string;
  proveedor?: string;
  exwflag?: boolean;
  fcaflag?: boolean;
  fobflag?: boolean;
  cfrflag?: boolean;
  cifflag?: boolean;
  ddpflag?: boolean;
}

export interface TarifaCosto extends Costo, Omit<CostoBase, "id"> {
  esopcionflag?: Numerico | boolean;
  esdestinoflag?: Numerico | boolean;
}
