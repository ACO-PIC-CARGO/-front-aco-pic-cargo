export interface PlanCaracteristica {
  estado?: boolean;
  name?: string;
}

export interface PlanMembresia {
  name?: string;
  description?: string;
  precioMes?: number | string;
  maximoContactos?: number | string;
  caracteristicas?: PlanCaracteristica[];
  selected?: boolean;
}

export interface ModuloMembresia {
  id: number;
  name: string;
  checkbox?: boolean;
}

export interface CaracteristicaPlanPrecio {
  descripcion: string;
  estado: number;
}

export interface PlanPrecioMembresia {
  plan_id: number;
  nombre: string;
  usuarios_principal: number;
  usuarios_secundar: number;
  usuarios_principal_anu: number;
  usuarios_secundar_anu: number;
  precio_mensual: number | string;
  precio_mensual_secundar: number | string;
  precio_mensual_anu: number | string;
  precio_mensual_secundar_anu: number | string;
  anualidad: number | string;
  anualidad_secundar: number | string;
  anualidad_anu: number | string;
  anualidad_secundar_anu: number | string;
  caracteristicas: CaracteristicaPlanPrecio[];
}
