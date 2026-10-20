import type { ApiResponse } from "@/types/api";
import type { SucursalSesion, UsuarioSesion } from "@/types/sesion";

export interface FilaProyeccion {
  id_gasto: number | string;
  id_tiposubgasto: number | string;
  id_entitie: number | string;
  id_coin: number | string;
  description: string;
  monto_monlocal: number | string;
  monto_monext: number | string;
  estado?: boolean;
  nrodias?: number | string;
  errgasto?: string[] | string;
  errsubgasto?: string[] | string;
  errproveedor?: string[] | string;
  errmoneda?: string[] | string;
  errmontomonoriginal?: string[] | string;
  errrnodias?: string[] | string;
}

export interface MonedaProyeccion {
  id: number | string;
  symbol: string;
}

export type UsuarioSesionProyeccion = UsuarioSesion & { id_user?: number };

export type SucursalSesionProyeccion = SucursalSesion & { moneda: { symbol: string }[] };

export type RespuestaValidacionAprobacion = ApiResponse & { estado?: unknown };
