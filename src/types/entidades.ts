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
  errorTipoTelf?: string;
  errorTelefono?: string;
}

export interface ContactoEntidad {
  nombre?: string;
  id_tipotelefono?: number | string;
  telefono?: string;
  errornombre?: string;
  errorTipoTelf?: string;
  errorTelefono?: string;
}

export interface ConvenioEntidad {
  id?: number;
  fecha?: string;
  dias_credito: number;
  email_soporte?: string;
  id_path?: string;
}

export interface TarifaEntidad {
  id?: number;
  fecha?: string;
  codigo?: string;
  email_soporte?: string;
  tarifa: number;
  id_path?: string;
}

export interface EmailEntidad {
  id: number | null;
  description: string;
  email: string;
  estado: boolean;
  errornombre?: string;
}

export interface ShipperCliente {
  id_shipper: number;
  correlativo?: number | string;
  nombrecompleto?: string;
  producto?: string;
}

export interface InformacionEntrega {
  destinatario?: string;
  dni_destinatario?: string;
  receptor?: string;
  dni_receptor?: string;
  id_departamento?: number | null;
  id_provincia?: number | null;
  id_distrito?: number | null;
  agencia?: string;
  celular_agencia?: string;
  status?: boolean;
}

export interface DatoTarifaProveedor {
  id: number;
  code: string;
  contacto: string;
  email: string;
  telefono: string;
}

interface EntidadComercial {
  correlativo: number | string;
  id_role: number;
  id_tipotransaccion: number | string;
  id_tipodocumento: number | string | null;
  id_pais: number | string | null;
  id_ciudad: number | string | null;
  dias_credito: number;
  dias_sobreestadia: number;
  dias_almacenaje: number;
  direccion: string;
  notas: string;
  nro_documento: string;
  emailaddress: string;
  nombrecompleto: string;
  convenioActual: ConvenioEntidad;
  telefonoActual: TelefonoEntidad;
  contactoActual: ContactoEntidad;
  id_branch?: number;
  lstTelefonos?: TelefonoEntidad[];
  lstContactos?: ContactoEntidad[];
  lstConvenios?: ConvenioEntidad[];
  lstTarifas?: TarifaEntidad[];
  lstInformacionBancaria?: InformacionBancaria[];
  lstEmails?: EmailEntidad[];
}

export interface Cliente extends EntidadComercial {
  names: string;
  surname: string;
  second_surname: string;
  birthday: string;
  id_sex: number;
  id_tipopersona?: number | string | null;
  usuario?: string;
  lstShippers?: ShipperCliente[];
  informacionEntrega?: InformacionEntrega;
}

export interface Proveedor extends EntidadComercial {
  bussiness_name: string;
  id_tipoproveedor: number | string;
  proveedorprincipalflag: boolean;
  producto?: string;
  datosTarifa?: DatoTarifaProveedor[];
}

interface ListasEntidadDetalle {
  lsttelefonos: TelefonoEntidad[];
  lstcontactos: ContactoEntidad[];
  lstconvenios: ConvenioEntidad[];
  lsttarifas: TarifaEntidad[];
  lstcuentas: InformacionBancaria[];
  lstemails: EmailEntidad[];
}

export interface ClienteDetalle extends Cliente, ListasEntidadDetalle {
  lstshippers: ShipperCliente[];
  informacionentrega: InformacionEntrega[];
}

export type ProveedorDetalle = Proveedor & ListasEntidadDetalle;

export interface TelefonosContactosEntidad {
  lsttelefono: TelefonoEntidad[];
  lstcontactos: ContactoEntidad[];
}

export interface FiltroEntidad {
  correlativo: string | null;
  bussiness_name: string | null;
  id_document: number | string | null;
  id_pais: number | string | null;
  id_state: number | string | null;
  status: number | string | null;
  id_tipoproveedor: number | string | null;
  names: string;
  surname: string;
  second_surname: string;
  nro_documento: string | null;
  nombrecompleto: string | null;
  producto: string | null;
}

export interface EntidadListado {
  id: number;
  correlativo?: number | string;
  acronym_document?: string;
  document?: string;
  nombrecompleto?: string;
  pais?: string;
  city?: string;
  address?: string;
  estado?: string;
  status?: number | string | boolean;
}

export interface EntidadCoincidencia {
  id: number;
  nombrecompleto: string;
  telefono?: string;
}

export interface Persona {
  id: number;
  namelong?: string;
}

export interface EntidadRegistrada {
  id_entitie: number;
}

export interface MovimientosCliente {
  estadoflag?: boolean;
  mensaje?: string;
}
