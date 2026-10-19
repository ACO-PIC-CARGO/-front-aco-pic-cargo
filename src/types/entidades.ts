export interface RolProveedor {
  id: number;
  code: number;
  name: string;
}

export interface TipoTransaccion {
  id: number;
  codigo?: string;
}

export interface InformacionBancaria {
  nro_cuenta?: string;
  cci?: string;
  id_banco?: number | string;
  id_coins?: number | string;
  nro_swift?: string;
  id_intermediario?: number | string;
  nro_cuenta_intermediario?: string;
}

export interface Operador {
  id: number;
  namelong?: string;
}
