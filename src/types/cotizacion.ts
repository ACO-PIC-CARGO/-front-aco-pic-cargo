import type { ApiResponse } from "./api";

export type Numerico = number | string | null | undefined;

export interface Impuesto {
  id?: number | string;
  codigo?: number | string;
  codigo01?: Numerico;
  codigo02?: Numerico;
  descripcion?: string;
  nro_propuesta?: number | string;
  orden?: number;
  valor?: Numerico;
}

export interface ContenedorCantidad {
  id?: number | string;
  id_containers?: number | string;
  cantidad?: number;
  description?: string;
  code?: string;
}

export interface DatosPrincipales {
  amount?: Numerico;
  metroscc?: Numerico;
  kg?: Numerico;
  volumen?: Numerico;
  peso?: Numerico;
  containers?: ContenedorCantidad[] | null;
  id?: number | string;
  id_percepcionaduana?: number | string | null;
  id_marketing?: number | string;
  id_status?: number | string;
  id_proveedor?: number | string | null;
  id_vendedor?: number | string;
  id_pricing?: number | string;
  id_entitie?: number | string;
  id_town?: number | string | null;
  cif?: Numerico;
  seguro?: Numerico;
  contacto?: string | null;
  descripcionMercancia?: string | null;
  descripcioncarga?: string | null;
  begEndList?: string;
  ejecutivo_ventas?: string;
  fecha_fin?: string | null;
  fecha_inicio?: string;
  fullflag?: boolean | number;
  ganancia?: Numerico;
  iddestino?: number | string;
  idincoterms?: number | string;
  idorigen?: number | string;
  idsentido?: number | string;
  idtipocarga?: number | string | TipoCarga;
  monto?: Numerico;
  nameStatusQuote?: string;
  nombre?: string;
  numerobultos?: Numerico;
  quote?: string;
  rangeDays?: string;
  slogan?: string;
  statusMain?: number | string;
  statusQuote?: number | string;
  telefono?: string;
  proveedor?: string | null;
  telefonoproveedor?: string | null;
  tiempo_transito?: Numerico;
  direccionproveedor?: string | null;
  iddistrito?: number | string | null;
  idprovincia?: number | string | null;
  datosInstructivoManual?: unknown;
  datosinstructivomanual?: DatosManualesInstructivo & { listaDocumentos?: DocumentoInstructivo[]; table_allpath_list?: unknown[] };
  esindividualflag?: boolean;
  esgrupalflag?: boolean;
  url_folderonedrive?: string | null;
  url_folderonedriveexp?: string | null;
  opcioncostos?: unknown;
  servicios?: Servicio[];
  estadocotizacion?: number | string;
}

export interface Multiplicador {
  id?: number | string;
  value?: number | string;
  code?: number | string | null;
  valor?: Numerico;
  id_container?: number | string | null;
  text?: string | null;
  name?: string | null;
  description?: string | null;
  id_shipment?: number | string | null;
  id_containers?: number | string | null;
  type_carga?: string | null;
  status?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Costo {
  [campo: string]: unknown;
  id?: number | string | null;
  id_multiplicador?: number | string;
  id_groupservices?: number | string;
  nameservice?: string;
  status?: Numerico | boolean;
  costounitario?: Numerico;
  minimo?: Numerico;
  cif?: Numerico;
  seguro?: Numerico;
  code_service?: string;
  code_cost?: number | string | null;
  esorigenflag?: Numerico | boolean;
  esfleteflag?: Numerico | boolean;
  eslocalflag?: Numerico | boolean;
  esaduanaflag?: Numerico | boolean;
  esgastostercerosflag?: Numerico | boolean;
  esalmacenflag?: Numerico | boolean;
  esventaflag?: Numerico | boolean;
  esopcionflag?: Numerico | boolean;
  considerarvalorminimoflag?: boolean | null;
  id_proveedor?: number | string | null;
  id_role?: number | string | null;
  error?: string;
  id_incoterms?: number | string;
  id_modality?: number | string;
  id_shipment?: number | string;
  id_services?: number | string;
  id_container?: number | string | null;
  escontenedorflag?: boolean | number;
  profit_ganancia_pricing?: ProfitGananciaPricing[];
  tienefleteflag?: boolean;
  tieneprofitflag?: boolean;
  fechavigencia?: string | null;
  nro_propuesta?: number | string;
}

export interface ProfitGananciaPricing {
  esindividualflag?: boolean;
  esgrupalflag?: boolean;
  profitprimeraimportacion?: Numerico;
  profitsegundaimportacion?: Numerico;
}

export interface FleteOpcionCosto {
  monto: Numerico;
  tienefleteflag: boolean;
  fechavigencia: string | null | undefined;
}

export interface Servicio {
  id?: number | string;
  id_begend?: number | string;
  id_groupservices?: number | string;
  service?: string;
  code_service?: number | string;
  status?: number | string | boolean;
  codebegend?: string;
  namegroupservice?: string;
  codegroupservices?: number | string;
  id_quote?: number;
}

export interface Nota {
  id?: number | string | null;
  descripcion?: string;
  statusincluye?: unknown;
  statusnoincluye?: unknown;
  state?: number | string;
  nro_propuesta?: number | string;
  estado?: number | boolean;
  statusprincipal?: number;
  individualflag?: boolean;
  grupalflag?: boolean;
}

export interface EstadoCotizacion {
  id?: number | string;
  code?: number | string;
  name?: string;
  defaultstatus?: number | string | boolean;
  description?: string | null;
  position?: number | string;
  position_select?: number | string;
  position_report?: number | string;
  position_calls?: number | string;
  status_calls?: number | string;
  status_calls_all?: number | string;
  status?: number | string | boolean;
  id_masterdetalletemperaturaventa?: number | string | null;
  temperatura?: string;
  id_branch?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemBegEnd {
  codebegend?: string;
  categoria_role?: string;
}

export interface ContenedorEnvio {
  description?: string;
  cantidad?: number | string;
  code?: string;
}

export interface TipoCarga {
  id?: number | string;
  code?: string;
  name?: string;
  embarque?: string;
  description?: string | null;
  id_transport?: number | string | null;
  code_transport?: string;
  type_transport?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ArchivoDrive {
  id?: string;
  name?: string;
  folder?: unknown;
  extension?: string;
  webUrl?: string;
}

export interface Incoterm {
  id?: number | string;
  name?: string;
  description?: string;
  text?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Puerto {
  id_port?: number | string;
  id?: number | string;
  code?: string;
  name?: string;
  description?: string | null;
  id_pais?: number | string;
  id_transporte?: number | string;
  tipo_transporte_name?: string;
  pais_description?: string;
  begend_name?: string;
  status?: number | string | boolean;
  status_calls?: number;
  status_calls_all?: number;
  id_branch?: number;
  created_at?: string;
  updated_at?: string;
  puerto?: string | null;
}

export interface OpcionCosto {
  id?: number;
  nro_propuesta?: number;
  date_end?: string;
  tiempo_transito?: Numerico;
  listCostos: Costo[];
  listImpuestos: Impuesto[];
  listNotasQuote: Nota[];
  selected?: boolean;
}

export interface ProfitPricingCosto {
  id?: number | null;
  concepto?: string;
  id_multiplicador?: number | string | null;
  id_proveedor?: number | string | null;
  id_itemservice?: number;
  esorigenflag?: boolean;
  eslocalflag?: boolean;
  esaduanaflag?: boolean;
  esalmacenflag?: boolean;
  esfleteflag?: boolean;
  esgastostercerosflag?: boolean;
  profitprimeraimportacion?: Numerico;
  profitsegundaimportacion?: Numerico;
  estado?: boolean | null;
}

export interface ListadoProfitPricing {
  profitindividual: ProfitPricingCosto[];
  profitgrupal: ProfitPricingCosto[];
}

export interface ConceptoProfitPricing {
  id?: number | null;
  concepto?: string | null;
  price?: number | string | null;
}

export interface DetalleLlamada {
  id?: number;
  fecha?: string;
  notes?: string;
  namelong?: string;
}

export interface CotizacionListado {
  id?: number;
  index?: number;
  rowId?: string;
  code?: string;
  codigo?: string;
  expediente?: string;
  nombres?: string;
  statusquote?: number;
  status?: string;
  status_code?: number | string;
  statusmain?: number | string;
  aprobadoflag?: boolean | string | number;
  created?: string;
  pricing?: string;
  ejecutivo_ventas?: string;
  telefono?: string;
  sentido?: string;
  tipo_de_carga?: string;
  incoterms?: string;
  origen?: string;
  destino?: string;
  marketing?: string;
  id_marketing?: number | string;
  idmarketing?: number | string;
  idMarketing?: number | string;
  fechaemisionpdf?: string;
  url_folderonedrive?: string;
  recibidocotizacion?: string;
  enviadocliente?: string;
  id_master_recibidocotizacion?: number | string;
  id_master_enviadocliente?: number | string;
  fecha_enviocliente?: string;
  details?: DetalleLlamada[];
  quote?: string;
}

export interface LlamadaCotizacion {
  id?: number;
  rowId?: string;
  codigo?: string;
  cliente?: string;
  status?: string;
  created_at?: string;
  fecha_ultima_llamada?: string;
  ultimo_comentario?: string;
  ejecutivo_pricing?: string;
  ejecutivo_ventas?: string;
  telefono?: string;
  sentido?: string;
  tipo_de_carga?: string;
  incoterms?: string;
  origen?: string;
  destino?: string;
  marketing?: string;
  fechaemisionpdf?: string;
  fecha_solicitud?: string;
}

export interface HouseListado {
  id: number;
  id_cot?: number | string | null;
  code_house?: string;
  code_master?: string;
  nro_house?: string;
  nro_hbl?: string;
  nameconsigner?: string;
  nameportbegin?: string;
  nameportend?: string;
}

export interface HouseDisponible {
  id: number;
  codigo: string;
  master: string;
  cliente: string;
  origen: string;
  destino: string;
}

export interface FormNotaLlamada {
  date: string;
  descripcion: string;
  identities: number | string;
}

export interface ResumenEstadoCotizacion {
  id?: number;
  nombre_estado?: string;
  cantidad?: string;
  color?: string;
}

export interface EjecutivoCotizacion {
  id?: number;
  id_entitie?: number;
  id_branch?: number;
  name?: string;
  nombrecompleto?: string;
  status?: number;
}

export interface ServicioPredeterminado {
  id?: number;
  id_modality?: number;
  code_modality?: string;
  modality?: string;
  id_shipment?: number;
  shipment?: string;
  id_incoterms?: number;
  incoterms?: string;
  id_begend?: number;
  codebegend?: string;
  code_service?: string;
  service?: string;
  orden?: number;
  status?: boolean;
}

export interface RolModuloCotizacion {
  id?: number;
  value?: number;
  text?: string;
  id_role?: number;
}

export interface EmpresaCotizacion {
  id?: number;
  pais?: string;
  document?: string;
  trade_name?: string;
  business_name?: string;
  slogan?: string;
  address?: string;
  phone?: string;
  iso_pais?: number;
}

export interface ClienteCotizacion {
  id?: number;
  nombrecompleto?: string;
  names?: string;
  surname?: string;
  phone?: string | null;
  document?: string | null;
  address?: string | null;
}

export interface InstructivoCotizacion {
  notas?: unknown;
  code_house?: string | null;
  code_master?: string | null;
  expediente?: string | null;
  sentido?: string;
  carga?: string;
  incoterms?: string;
  direccion?: string | null;
  proveedor?: string | null;
  origen?: string;
  destino?: string;
  fiscal?: string | null;
  ruc?: string | null;
  direccionorigen?: string | null;
  icotems?: string;
}

export interface ExpedienteMaster {
  id: number | string;
  code_master?: string;
  Expediente?: string;
  tienepagos?: boolean | number;
  url_folderonedrive?: string;
  id_modality?: number | string;
  id_shipment?: number | string;
  id_incoterms?: number | string;
  id_port_begin?: number | string;
  id_port_end?: number | string;
}

export interface HouseAsociadoMaster {
  id: number;
  code_house: string;
  correlativos?: string | null;
}

export interface LineaInstructivo {
  descripcion?: string;
  proveedor?: string;
  service?: string;
  valor?: number | string;
  orden?: number;
  igv?: number | string;
  total?: number | string;
  id?: Numerico;
  [campo: string]: unknown;
}

export interface OpcionInstructivo {
  nro_propuesta?: number;
  opcion?: LineaInstructivo[];
  [campo: string]: unknown;
}

export interface IngresoInstructivoAprobar {
  nro_propuesta?: number;
  dataIngresos: LineaInstructivo[];
  dataCostos: LineaInstructivo[];
  totalIngresos: number;
  totalCostos: number;
  dataVentas: LineaInstructivo[];
}

export interface CotizacionNoAsignada {
  id?: number;
  code?: string;
  porasignar?: boolean;
}

export interface ServicioInstructivo {
  name?: string;
  status?: string;
}

export interface FiltroCotizaciones {
  fechainicio: string;
  fechadesde?: string;
  fechafin: string;
  fechaemisiondesde?: string | null;
  fechaemisionhasta?: string | null;
  tipopdf?: number;
  id_cliente?: number | string | null;
  id_pricing?: number | string | null;
  id_entities?: number | string | null;
  id_marketing?: number | string | null;
  id_status?: number | string | null;
  id_modality?: number | string | null;
  id_shipment?: number | string | null;
  id_incoterm?: number | string | null;
  id_masterdetalletemperaturaventa?: number | string | null;
  estado?: string | boolean | null;
}

export interface CotizacionHouse {
  id?: number;
  [campo: string]: unknown;
}

export interface OpcionCostoDetalle {
  id?: number;
  nro_propuesta?: number;
  date_end?: string;
  tiempo_transito?: Numerico;
  listcostos: Costo[];
  listimpuestos: Impuesto[];
  listnotasquote: Nota[];
  selected?: boolean;
}

export interface CotizacionDetalle extends Omit<DatosPrincipales, "opcioncostos"> {
  id: number;
  quote: string;
  cliente: ClienteCotizacion[];
  namestatusquote?: string;
  descripcionmercancia?: string | null;
  statusquote?: number | string;
  statusmain?: number;
  id_master: number | string | null;
  nro_exp: string | null;
  servicios: Servicio[];
  opcioncostos: OpcionCostoDetalle[];
  aprobadoflag: boolean;
  tiporeporte: string;
}

export type CotizacionAduanaDetalle = Omit<CotizacionDetalle, "cliente" | "id_master" | "nro_exp">;

export interface FiltroLlamadasAduana {
  id_estado?: number | string | null;
  id_sentido?: number | string | null;
  id_carga?: number | string | null;
  id_incoterms?: number | string | null;
  desde?: string | null;
  hasta?: string | null;
}

export interface TextoWhatsappCotizacion {
  texto_pdf?: string;
  texto_link?: string;
}

export interface DocumentoInstructivo {
  key: string;
  label: string;
  flag: boolean;
  file: unknown;
  editable: boolean;
}

export interface FichaInstructivo extends ClienteCotizacion {
  name?: string;
  namelong?: string;
  contacto?: string;
  contacto_phone?: string;
  emailaddress?: string;
  nombre_clean?: string;
}

export interface DatosManualesInstructivo {
  [campo: string]: unknown;
  servicio: string;
  email: string;
  monto: number | string;
  listDiaFecha: string;
  grupoWhatsapp: string;
  pagarProveedor: boolean | string;
  metodoPagarProveedor: number | string;
  condicionesLink: string;
  dondePagar: string;
  clientePago: string;
  linkDePago: string;
  linkDePagoAlibaba: string;
  condiciones: string;
  nroFactura: string;
  seguro: string;
  observacion1: string;
  observacion2: string;
  id_path: number[];
  montoRecibido: number | string;
  bancoBenbeficiario: string;
  direccionBancoBeneficiario: string;
  nombreBeneficiario: string;
  direccionBeneficiario: string;
  numeroCuentaBeneficiario: unknown;
  paisReceptor: unknown;
  porcentajePago: number | string;
  numeroContratoAlibaba: unknown;
}

export interface DatosInstructivoManual {
  guardarFlag?: boolean;
  [campo: string]: unknown;
}

export interface FiltroPuertos {
  id_transport?: number | string;
  id?: number | string | null;
  search?: string | null;
  limit?: number;
}

export interface CambioIncoterms {
  listServices: Servicio[];
  opcionCostos: OpcionCosto[];
}

export interface OpcionesReporte {
  tipo?: string;
  nro_propuesta?: number;
  guardarFlag?: boolean;
  enviarWspCliente?: boolean;
  textWhatsapp?: string;
  pdfflag?: boolean;
  linkflag?: boolean;
  tipoCotizacion?: string;
  fecha_salida?: string;
  nombre_cliente?: string;
  fecha_max?: string | null;
  nombrePdfEnviarCliente?: string;
}

export interface FiltrosReporte {
  filtroSeleccionado?: unknown;
  filtroCabecera?: unknown;
}

export type DatosPrevisualizacion = Record<string, unknown>;

export interface OpcionVistaPrevia {
  date_end?: string | null;
  tiempo_transito?: number | string;
  totalFlete: string;
  datosFlete: LineaReporte[];
  totalOrigen: string;
  datosOrigen: LineaReporte[];
  totalLocales: string;
  datosLocales: LineaReporte[];
  totalAduanas: string;
  datosAduanas: LineaReporte[];
  totalAlmacenes: string;
  datosAlmacenes: LineaReporte[];
  totalGastosTercero: string;
  datosGastosTercero: LineaReporte[];
  conceptos: { name?: string }[];
  totalServicios: string;
  impuesto: ImpuestoReporte[];
  totalImpuesto: string;
  totalImpuestosIGV: string;
  total: string;
  listServices: Servicio[];
  listNotasQuote: Nota[];
}

export interface VistaPreviaCotizacion {
  tipo?: string;
  isImport?: boolean;
  iso?: string | number;
  cliente?: string;
  origen?: string;
  destino?: string;
  sentido?: string;
  embarque?: string;
  icoterm?: string;
  numerobultos?: Numerico;
  peso?: Numerico;
  volumen?: Numerico;
  TipoCostos: { name?: string; codigo?: string }[];
  flete?: EstadoServicioReporte[];
  almacen?: EstadoServicioReporte[];
  aduana?: EstadoServicioReporte[];
  local?: EstadoServicioReporte[];
  OpcionesSelecciondas: OpcionVistaPrevia[];
}

export interface AprobacionCotizacion {
  IdempotencyKey?: string;
  nuevoexpediente?: boolean;
  url_folderonedrive?: string | null;
  [campo: string]: unknown;
}

export interface ParametrosTextoWhatsapp {
  id_shipment?: number | string | TipoCarga;
  id_quote?: number | string;
  id_containers?: string;
  id_branch?: number;
}

export interface LineaReporte {
  name?: string;
  valor: string;
}

export interface EstadoServicioReporte {
  name?: string;
  estado: string;
}

export interface ImpuestoReporte {
  type?: number | string;
  name?: string;
  percentage?: Numerico;
  valor: string;
}

export interface RespuestaArchivo extends ApiResponse {
  path?: string;
  msg?: string;
  error?: unknown;
}

export interface RespuestaRegistroCotizacion {
  insertId: number;
  nro_quote: string;
  msg: string;
}

export interface CotizacionCopiada {
  insertid: number;
  nro_quote: string;
  mensaje: string;
}

export interface MasterAprobado {
  id_master?: number;
  code_master?: string;
  nro_master?: string;
}

export interface RolModulo {
  id: number;
  id_role: number;
  name: string;
}

export interface CostoServicioDetalle {
  id?: number;
  id_groupservices?: number;
  id_incoterms?: number;
  id_modality?: number;
  id_multiplicador?: number | string | null;
  id_services?: number;
  id_shipment?: number;
  id_begend?: number;
  id_role?: number | null;
  id_proveedor?: number | string | null;
  namebegend?: string;
  namegroupservice?: string;
  namemultiplicador?: string;
  namerole?: string;
  nameservice?: string;
  price?: Numerico;
  categoria_role?: string;
  code_cost?: number | string | null;
  esorigenflag?: boolean;
  eslocalflag?: boolean;
  esaduanaflag?: boolean;
  esalmacenflag?: boolean;
  esfleteflag?: boolean;
  esgastostercerosflag?: boolean;
}

export interface FormMedidasCarga {
  idLongitud: number | null;
  idpeso: number | null;
  bultos: Numerico;
  largo: Numerico;
  ancho: Numerico;
  alto: Numerico;
  peso: Numerico;
}

export interface FilaMedidaCarga {
  uni: Numerico;
  peso: Numerico;
  volumen: Numerico;
  largo: Numerico;
  ancho: Numerico;
  alto: Numerico;
  pesoXBulto: Numerico;
}

export interface TotalMedidaCarga {
  descripcion: string | null;
  uni: Numerico;
  peso: Numerico;
  volumen: Numerico;
}

export interface FormNuevoCosto {
  id?: number;
  idOpcion?: string;
  nameservice?: string;
  ventaFlag: number;
  esopcionflag: number;
  id_begend: number;
  costounitario: Numerico;
  esorigenflag: number;
  eslocalflag: number;
  esaduanaflag: number;
  esalmacenflag: number;
  esfleteflag?: number;
  esgastostercerosflag?: number;
  seguro: number;
  cif: number;
  esventaflag: number;
  status: number;
  id_groupservices: number;
  id_multiplicador: number;
  id_proveedor: number;
}

export interface EncabezadoComparativa {
  text: string;
  value: string;
  cellClass?: string;
}

export interface OpcionComparativa extends OpcionCosto {
  proveedor: string;
  flete: string;
  origen: string;
  local: string;
  aduana: string;
  almacen: string;
  gastostercero: string;
  total: string;
}

export type FilaServicioNota = Servicio & Omit<Nota, "id">;
