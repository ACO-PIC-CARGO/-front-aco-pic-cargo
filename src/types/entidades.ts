export interface RolProveedor {
  id: number;
  code: number;
  name: string;
}

export interface TipoTransaccion {
  id: number;
  codigo?: string;
  codigo01?: string;
  codigo02?: string;
  descripcion?: string;
  estado?: boolean;
  individualflag?: boolean;
  grupalflag?: boolean;
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

export interface TelefonoEntidad {
  id_tipotelefono?: number | string;
  telefono?: string;
}

export interface ContactoEntidad {
  nombre?: string;
  id_tipotelefono?: number | string;
  telefono?: string;
}

export interface ConvenioEntidad {
  fecha?: string;
  dias_credito: number;
  email_soporte?: string;
}

export interface TarifaEntidad {
  fecha?: string;
  codigo?: string;
  email_soporte?: string;
  tarifa: number;
}
