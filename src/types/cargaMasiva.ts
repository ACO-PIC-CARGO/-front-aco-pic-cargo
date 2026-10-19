export interface FilaPedidoGastos {
  document: string;
  nombres?: string;
  apaterno?: string;
  amaterno?: string;
  telefono?: string;
  telefono2?: string;
  monto?: number | string;
  pedidos?: number;
}

export interface ResultadoCargaMasivaGastos {
  esnuevoflag: boolean;
  nro_master: string;
  id_master: number;
}
