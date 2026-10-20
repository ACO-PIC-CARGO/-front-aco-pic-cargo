export interface ConceptoCuenta {
  id: number | null;
  concepto: string;
  monto: string | number | null;
  montodolar: string;
  igv: string;
  igvdolar: string;
  afecto: string | number | boolean;
  status: number;
  total: number | string;
  totaldolar: number | string;
}

export interface ConceptoNuevo {
  concepto: string;
  monto: string | number | null;
  afecto: string | number | boolean;
  total: number;
}

export interface TotalCuenta {
  monto: number;
  igv?: number;
  total: number | string;
  montodolar?: number;
  igvdolar?: number;
  totaldolar?: number | string;
}

export interface MonedaCuenta {
  id: number | string;
  symbol: string;
  acronym: string;
}

export interface ComprobanteCuenta {
  id: number | string;
  code: string;
  id_proveedor: number;
}

export interface ExpedienteCuenta {
  id: number;
  namelong: string;
}

export interface ArchivoSoporte {
  id: unknown;
  archivo?: unknown;
}

export interface DetalleCuentaListado {
  concepto: string;
  monto: string;
  igv: string;
  total: string;
  montodolar: string;
  igvdolar: string;
  totaldolar: string;
}

export interface CuentaListado {
  id: number;
  status: number;
  namecoins: string;
  paymentname: string;
  total: string;
  totaldolar: string;
  tipocambio: string;
  detalle: DetalleCuentaListado[];
}

export interface ProformaPorRegularizar {
  id: number;
  id_house: number;
  id_pro: number;
  path: string;
}
