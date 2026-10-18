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
}
