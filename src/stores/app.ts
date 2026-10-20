import { defineStore } from "pinia";
import { computed, ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import { useBancosStore } from "@/stores/bancos";
import { useEntitiesStore } from "@/stores/entities";
import { useHousesStore } from "@/stores/houses";
import { useMastersStore } from "@/stores/masters";
import { useSecuritysStore } from "@/stores/securitys";
import type { ApiResponse } from "@/types/api";
import type {
  BegEndHouseRaiz,
  ClienteRaiz,
  ContactoRaiz,
  ContenedorMasterRaiz,
  ControlRaiz,
  EntidadListadoRaiz,
  ExpedienteMasterRaiz,
  FilaConIdRaiz,
  FilaRaiz,
  FiltroCargaMasterRaiz,
  FiltroControlGastosRaiz,
  GrupoMenuRaiz,
  IncotermRaiz,
  ListaPagosRaiz,
  NroHouseRaiz,
  OperadorRaiz,
  ProveedorRolRaiz,
  RolSinParsearRaiz,
  TelefonoListadoRaiz,
  TelefonoRaiz,
  TipoEmbarqueRaiz,
  TipoTelefonoRaiz,
  TotalProveedorRaiz,
  FacturaAdminRaiz,
  ProveedorRaiz,
  HouseListaRaiz,
} from "@/types/app";
import type { ConceptoSolicitud, MasterListadoControlGasto } from "@/types/billing";
import type { DocumentoPais, Modalidad, Moneda, Pais, TipoContenedor } from "@/types/catalogos";
import type { FiltroPuertos, Numerico, Puerto } from "@/types/cotizacion";
import type { OpcionCuentaBancaria, RolProveedor } from "@/types/entidades";
import type { CuentaBancariaPic, ServicioHouse } from "@/types/operaciones";
import type { ExpedienteMasterReporte } from "@/types/reportes";
import type { ExpedienteSinSolicitud } from "@/types/requests";
import type { ItemMenu, SucursalSesion, UsuarioSesion } from "@/types/sesion";
import { dataBranchAtAppLoad } from "@/utils/appLoad";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

// getPortBegin/getPortEnd can return the selected port twice; Vuetify 4 would show it twice in the field.
const withoutDuplicatePorts = (ports: Puerto[]): Puerto[] => {
  const seen = new Set();
  return ports.filter((port) => !seen.has(port.id_port) && seen.add(port.id_port));
};

export const useAppStore = defineStore("app", () => {
  const recargarClienteFlag = ref(false);
  const dialogProcessing = ref(false);
  const lstMenu = ref<ItemMenu[]>([]);
  const registroClienteFlag = ref(false);
  const refreshReport = ref(false);
  const imgSave = ref("/img/svg/save.svg");
  const imgFolder = ref("/img/svg/folder.svg");
  const imgMailbox = ref("/img/svg/mailbox.svg");
  const imgList = ref("/img/svg/lista.svg");
  const dataList = ref(false);
  const dataGastos = ref(false);
  const dataGastosMain = ref(false);
  const dataMaster = ref(false);
  const dataHouse = ref(false);
  const nro_cuotas = ref(3);
  const spiner = ref(false);
  const house_id_master = ref<Numerico>("");
  const cuota = ref<Numerico[]>([]);
  const fechacuota = ref<string[]>([]);
  const modalAgente = ref(false);
  const modalAdmin = ref(false);
  const modalPro = ref(false);
  const modalConsigner = ref(false);
  const modalNotify = ref(false);
  const modalColoader = ref(false);
  const modalNaviera = ref(false);
  const modalContainers = ref(false);
  const modalEntitie = ref(false);
  const modalvelocidad = ref(false);
  const modalPhones = ref(false);
  const modalPhonesEdit = ref(false);
  const modalContacts = ref(false);
  const modalContactsEdit = ref(false);
  const modalCuentas = ref(false);
  const actualizar = ref(false);
  const limpiar = ref(false);
  const totalIngresos = ref(0);
  const totalIngresosOp = ref(0);
  const totalIgvIngresos = ref(0);
  const totalIgvIngresosOp = ref(0);
  const totalTotalIngresos = ref(0);
  const totalTotalIngresosOp = ref(0);
  const totalEgresos = ref(0);
  const totalEgresosOp = ref(0);
  const totalIgvEgresos = ref(0);
  const totalIgvEgresosOp = ref(0);
  const totalTotalEgresos = ref(0);
  const totalTotalEgresosOp = ref(0);
  const security = ref(2);
  const departamentoUser = ref<number | string>(0);
  const menuName = ref("");
  const modalServices = ref(false);
  const phone_id = ref<TipoTelefonoRaiz>("" as unknown as TipoTelefonoRaiz);
  const phone_number = ref<Numerico>("");
  const contact_name = ref("");
  const contact_number = ref<Numerico>("");
  const cuentas_pic = ref<CuentaBancariaPic[]>([]);
  const itemsPhone = ref<TipoTelefonoRaiz[]>([
    {
      id: 1,
      name: "Oficina",
    },
    {
      id: 2,
      name: "Celular",
    },
    {
      id: 3,
      name: "WhatsApp",
    },
  ]);
  const itemsListPhone = ref<TelefonoRaiz[]>([]);
  const itemsListPhoneEdit = ref<FilaConIdRaiz[]>([]);
  const contact_id = ref<Numerico>("");
  const itemsContact = ref<TipoTelefonoRaiz[]>([
    {
      id: 1,
      name: "Oficina",
    },
    {
      id: 2,
      name: "Celular",
    },
  ]);
  const itemsListContact = ref<ContactoRaiz[]>([]);
  const itemsListContactEdit = ref<FilaConIdRaiz[]>([]);
  const itemsEntities = ref<EntidadListadoRaiz[]>([]);
  const itemsAgents = ref<FilaRaiz[]>([]);
  const itemsConsigners = ref<FilaRaiz[]>([]);
  const itemsNotify = ref<FilaRaiz[]>([]);
  const itemsAirlines = ref<FilaRaiz[]>([]);
  const itemsNavieras = ref<FilaRaiz[]>([]);
  const itemsMotonave = ref<FilaRaiz[]>([]);
  const itemsContainers = ref<TipoContenedor[]>([]);
  const itemsDocumentsPais = ref<DocumentoPais[]>([]);
  const itemsPais = ref<Pais[]>([]);
  const itemsState = ref<FilaRaiz[]>([]);
  const itemsCity = ref<FilaRaiz[]>([]);
  const itemsTown = ref<FilaRaiz[]>([]);
  const itemsSex = ref<FilaRaiz[]>([]);
  const itemsModality = ref<Modalidad[]>([]);
  const itemsShipment = ref<TipoEmbarqueRaiz[]>([]);
  const itemsPortBegin = ref<Puerto[]>([]);
  const itemsPortEnd = ref<Puerto[]>([]);
  const itemsIncoterms = ref<IncotermRaiz[]>([]);
  const itemsServicesEnd = ref<FilaRaiz[]>([]);
  const itemsServicesFlete = ref<FilaRaiz[]>([]);
  const itemsServicesOpcional = ref<FilaRaiz[]>([]);
  const itemsMenu = ref<ItemMenu[]>([]);
  const itemsList = ref<GrupoMenuRaiz[]>([]);
  const itemsFleteCon = ref<FilaRaiz[]>([]);
  const itemsCoinsList = ref<Moneda[]>([]);
  const itemsHouseList = ref<HouseListaRaiz[]>([]);
  const itemsMasterList = ref<ExpedienteMasterRaiz[]>([]);
  const itemsHouseListAll = ref<ExpedienteSinSolicitud[]>([]);
  const itemsHouseServices = ref<ServicioHouse[]>([]);
  const itemsBegEndList = ref<BegEndHouseRaiz[]>([]);
  const itemsOperadorList = ref<OperadorRaiz[]>([]);
  const itemsProveedorList = ref<ProveedorRolRaiz[]>([]);
  const itemsReportFileAll = ref<ExpedienteMasterReporte[]>([]);
  const itemsReportFileAllMaster = ref<FilaRaiz[]>([]);
  const itemsTotalesAll = ref<FilaRaiz[]>([]);
  const itemsDataControl = ref<ControlRaiz[]>([]);
  const itemsDataIngresos = ref<FilaRaiz[]>([]);
  const itemsDataIngresosList = ref<FilaRaiz[]>([]);
  const itemsDataEgresosList = ref<FilaRaiz[]>([]);
  const itemsDataControlList = ref<MasterListadoControlGasto[]>([]);
  const itemsDataRoleList = ref<RolProveedor[]>([]);
  const itemsDataAccountList = ref<OpcionCuentaBancaria[]>([]);
  const itemsDataBanksList = ref<OpcionCuentaBancaria[]>([]);
  const itemsDataAccountsNumberList = ref<FilaConIdRaiz[]>([]);
  const itemsDataConceptos = ref<ConceptoSolicitud[]>([]);
  const itemsProveedorRolAerolinea = ref<FilaRaiz[]>([]);
  const itemsProveedorRolShipper = ref<FilaRaiz[]>([]);
  const provedores = ref<ProveedorRaiz[]>([]);
  const clientes = ref<ClienteRaiz[]>([]);
  const itemsDataTotalesProveedor = ref<TotalProveedorRaiz[]>([]);
  const performances = ref<FilaRaiz[]>([]);
  const InvoiceAdmin = ref<FacturaAdminRaiz[]>([]);
  const month = ref<FilaRaiz[]>([]);
  const year = ref<FilaRaiz[]>([]);
  const listPagosXProveedorCxP = ref<ListaPagosRaiz>([]);
  const datanroMaster = ref<Numerico>("");
  const datanroHouse = ref<Numerico>("");
  const drawer = ref(false);
  const mainTitle = ref("INICIO");
  const master_id_trasnport = ref<TipoEmbarqueRaiz>("" as unknown as TipoEmbarqueRaiz);
  const master_embarque = ref<Numerico>("");
  const master_origen = ref<Numerico>("");
  const master_destino = ref<Numerico>("");
  const master_id_containers = ref<TipoContenedor>("" as unknown as TipoContenedor);
  const master_nro_containers = ref("");
  const master_nro_precinto = ref("");
  const accountIdTypeAccount = ref<number | string>(1);
  const accountIdBanks = ref<number | string>("");
  const accountIdCoins = ref<number | string>("");
  const accountNumer = ref("");
  const accountIdEntities = ref<Numerico>("");
  const accountStatus = ref(1);
  const master_cantidad = ref<number | string>("");
  const master_id_agente = ref<Numerico>("");
  const master_master_monto = ref<Numerico>("");
  const cg_filtrarData = ref(false);
  const controlgastosfiltro = ref<FiltroControlGastosRaiz>({} as FiltroControlGastosRaiz);
  const dataControl_Numero = ref<Numerico | string[]>("");
  const dataControl_idControl = ref<Numerico>("");
  const dataControl_id_house = ref<Numerico | string[]>("");
  const dataControl_id_user = ref<Numerico>("");
  const dataControl_status = ref(1);
  const dataControl_id_orders = ref<Numerico>("");
  const house_Id_get = ref<Numerico | string[]>("");
  const house_cotizanion = ref<Numerico>("");
  const house_embarque = ref<Numerico>("");
  const house_cantidad_house = ref(1);
  const house_insertId = ref(1);
  const house_id_consigner = ref<Numerico>("");
  const house_master_monto = ref<Numerico>("");
  const house_expediente = ref<Numerico>("");
  const totalItemsHouseListAll = ref(0);
  const services_id_begend = ref<Numerico>("");
  const services_name = ref<Numerico>("");
  const services_price = ref<Numerico>("");
  const dataHouse_modality = ref<Numerico>("");
  const dataHouse_shipment = ref<Numerico>("");
  const dataHouse_port_begin = ref<Numerico>("");
  const dataHouse_port_end = ref<Numerico>("");
  const dataHouse_agente = ref<Numerico>("");
  const dataHouse_consigners = ref<Numerico>("");
  const dataHouse_notify = ref<Numerico>("");
  const dataHouse_ruc = ref<Numerico>("");
  const dataHouse_exp = ref<Numerico>("");
  const dataHouse_code_house = ref<Numerico>("");
  const dataHouse_code_master = ref<Numerico>("");
  const dataHouse_bultos = ref<Numerico>("");
  const dataHouse_peso = ref<Numerico>("");
  const dataHouse_volumen = ref<Numerico>("");
  const dataHouse_operador = ref<Numerico>("");
  const dataIngreso_concepto = ref<Numerico>("");
  const dataIngreso_statusCalcula = ref(true);
  const dataIngreso_montoop = ref<Numerico>("");
  const dataIngreso_montopr = ref<Numerico>("");
  const dataIngreso_igvop = ref<Numerico>("");
  const dataIngreso_igvpr = ref<Numerico>("");
  const dataIngreso_totalop = ref<Numerico>("");
  const dataIngreso_totalpr = ref<Numerico>("");
  const dataIngreso_opcion = ref<Numerico>("");
  const dataIngreso_fnumero = ref<Numerico>("");
  const dataIngreso_ffecha = ref<Numerico>("");
  const dataIngreso_id = ref<Numerico>("");
  const dataIngresoItems = ref<FilaRaiz[]>([]);
  const dataCostos_proveedorName = ref<Numerico>("");
  const dataCostos_idProveedor = ref<Numerico>("");
  const dataCostos_concepto = ref<Numerico>("");
  const dataCostos_statusCalcula = ref(true);
  const dataCostos_monto = ref<Numerico>("");
  const dataCostos_igv = ref<Numerico>("");
  const dataCostos_total = ref<Numerico>("");
  const dataCostos_id = ref<Numerico>("");
  const dataCostos_opcion = ref<Numerico>("");
  const dataCostos_fnumero = ref<Numerico>("");
  const dataCostos_ffecha = ref<Numerico>("");
  const dataCostosItems = ref<FilaRaiz[]>([]);
  const dataTotalIngreso = ref<Numerico>("");
  const dataTotalCostos = ref<Numerico>("");
  const dataTotalIGV = ref<Numerico>("");
  const dataTotalCI = ref<Numerico>("");
  const report_id_status = ref<Numerico>("");
  const report_id_status_adm = ref<Numerico>("");
  const report_id_sentido = ref<Numerico>("");
  const report_id_operador = ref<Numerico>("");
  const reportFecha_ini = ref<Numerico>("");
  const reportFecha_fin = ref<Numerico>("");
  const reportStatusTable = ref(true);
  const reportStatusTotal = ref(true);
  const reportsDialog = ref(false);
  const reportsButton = ref(false);
  const totalExpedientesMaster = ref(0);
  const totalExpedientesHouse = ref(0);
  const totalIA = ref(0);
  const totalEA = ref(0);
  const totalIM = ref(0);
  const totalEM = ref(0);
  const totalLL = ref(0);
  const totalPL = ref(0);
  const totalSS = ref(0);
  const totalPS = ref(0);
  const branchs = ref<SucursalSesion[]>(null as unknown as SucursalSesion[]);
  const id_role_actual = ref<Numerico | string[]>("");
  const master_itemsContainers = ref<ContenedorMasterRaiz[]>([]);
  const embar_title_nacn = ref("Aerolinea/Coloader/Naviera");
  const dataBranch = ref(dataBranchAtAppLoad);
  const service_id_begend = ref<Numerico>();

  const isEmpresaPermitida = computed(() => {
    const valEmpresaPic = [1, 2];
    const dataBranch = localStorage.getItem("dataBranch");

    if (!dataBranch) return false;

    try {
      const empresa = (JSON.parse(dataBranch) as SucursalSesion[])[0];
      return empresa && valEmpresaPic.includes(empresa.id);
    } catch (e) {
      console.error("Error al parsear dataBranch", e);
      return false;
    }
  });
  const itemsEntitie = computed(() => itemsEntities.value);
  const itemsConsigner = computed(() => itemsContainers.value);
  const itemsNotifyGetter = computed(() => itemsNotify.value);
  const itemsAgentsGetter = computed(() => itemsAgents.value);
  const itemsAirlinesGetter = computed(() => itemsAirlines.value);
  const itemsNavierasGetter = computed(() => itemsNavieras.value);
  const itemsMotonaveGetter = computed(() => itemsMotonave.value);
  const itemsContainersGetter = computed(() => itemsContainers.value);
  const itemsDocument = computed(() => itemsDocumentsPais.value);
  const itemsPaisGetter = computed(() => itemsPais.value);
  const itemsStateGetter = computed(() => itemsState.value);
  const itemsCityGetter = computed(() => itemsCity.value);
  const itemsTownGetter = computed(() => itemsTown.value);
  const itemsSexGetter = computed(() => itemsSex.value);
  const itemsModalityGetter = computed(() => itemsModality.value);
  const itemsShipmentGetter = computed(() => itemsShipment.value);
  const itemsPortBeginGetter = computed(() => itemsPortBegin.value);
  const itemsPortEndGetter = computed(() => itemsPortEnd.value);
  const itemsIncotermsGetter = computed(() => itemsIncoterms.value);
  const itemsServicesEndGetter = computed(() => itemsServicesEnd.value);
  const itemsServicesFleteGetter = computed(() => itemsServicesFlete.value);
  const itemsServicesOpcionalGetter = computed(() => itemsServicesOpcional.value);
  const itemsMenuGetter = computed(() => itemsMenu.value);
  const itemsListGetter = computed(() => itemsMenu.value);
  const itemsFleteConGetter = computed(() => itemsFleteCon.value);
  const itemsCoinsListGetter = computed(() => itemsCoinsList.value);
  const itemsHouseListGetter = computed(() => itemsHouseList.value);
  const itemsMasterListGetter = computed(() => itemsMasterList.value);
  const itemsHouseListAllGetter = computed(() => itemsHouseListAll.value);
  const itemsHouseServicesGetter = computed(() => itemsHouseServices.value);
  const itemsBegEndListGetter = computed(() => itemsBegEndList.value);
  const itemsOperadorListGetter = computed(() => itemsOperadorList.value);
  const itemsReportFileAllGetter = computed(() => itemsReportFileAll.value);
  const itemsReportFileAllMasterGetter = computed(() => itemsReportFileAllMaster.value);
  const itemsTotalesAllGetter = computed(() => itemsTotalesAll.value);
  const itemsDataControlGetter = computed(() => itemsDataControl.value);
  const itemsDataIngresosGetter = computed(() => itemsDataIngresos.value);
  const itemsDataIngresosListGetter = computed(() => itemsDataIngresosList.value);
  const itemsDataEgresosListGetter = computed(() => itemsDataEgresosList.value);
  const itemsDataRoleListGetter = computed(() => itemsDataRoleList.value);
  const itemsDataAccountListGetter = computed(() => itemsDataAccountList.value);
  const itemsDataBanksListGetter = computed(() => itemsDataBanksList.value);
  const itemsDataAccountsNumberListGetter = computed(() => itemsDataAccountsNumberList.value);
  const itemsDataTotalesProveedorGetter = computed(() => itemsDataTotalesProveedor.value);
  const datanroMasterGetter = computed(() => datanroMaster.value);
  const datanroHouseGetter = computed(() => datanroHouse.value);
  const master_embarqueGetter = computed(() => master_id_trasnport.value.id);
  const id_role_actualGetter = computed(() => id_role_actual.value);
  const performancesGetter = computed(() => performances.value);
  const InvoiceAdminGetter = computed(() => InvoiceAdmin.value);
  const monthGetter = computed(() => InvoiceAdmin.value);
  const yearGetter = computed(() => InvoiceAdmin.value);
  const listPagosXProveedorCxPGetter = computed(() => listPagosXProveedorCxP.value);
  const provedoresGetter = computed(() => provedores.value);
  const clientesGetter = computed(() => clientes.value);

  function _setEntities(dataEntities: EntidadListadoRaiz[]): void {
    itemsEntities.value = dataEntities;

    dataList.value = true;
  }

  function _setConsigners(dataConsigner: FilaRaiz[]): void {
    itemsConsigners.value = dataConsigner;
  }

  function _setNotify(dataNotify: FilaRaiz[]): void {
    itemsNotify.value = dataNotify;
  }

  function _setAgents(dataAgents: FilaRaiz[]): void {
    itemsAgents.value = dataAgents;
  }

  function _setDocumentsPais(dataDocumentsPais: DocumentoPais[]): void {
    itemsDocumentsPais.value = dataDocumentsPais;
  }

  function _setPais(dataPais: Pais[]): void {
    itemsPais.value = dataPais;
  }

  function _setState(dataState: FilaRaiz[]): void {
    itemsState.value = dataState;
  }

  function _setCity(dataCity: FilaRaiz[]): void {
    itemsCity.value = dataCity;
  }

  function _setTown(dataTown: FilaRaiz[]): void {
    itemsTown.value = dataTown;
  }

  function _setSex(dataSex: FilaRaiz[]): void {
    itemsSex.value = dataSex;
  }

  function _setModality(dataModality: Modalidad[]): void {
    itemsModality.value = dataModality;
  }

  function _setShipment(dataShipment: TipoEmbarqueRaiz[]): void {
    itemsShipment.value = dataShipment;
  }

  function _setPortBegin(dataPortBegint: Puerto[]): void {
    itemsPortBegin.value = withoutDuplicatePorts(dataPortBegint);
  }

  function _setPortEnd(dataPortEnd: Puerto[]): void {
    itemsPortEnd.value = withoutDuplicatePorts(dataPortEnd);
  }

  function _setIncoterms(dataIncoterms: IncotermRaiz[]): void {
    itemsIncoterms.value = dataIncoterms;
  }

  function _setServicesEnd(dataServicesEnd: FilaRaiz[]): void {
    itemsServicesEnd.value = dataServicesEnd;
  }

  function _setServicesFlete(dataServicesFlete: FilaRaiz[]): void {
    itemsServicesFlete.value = dataServicesFlete;
  }

  function _setServicesOpcional(dataServicesOpcional: FilaRaiz[]): void {
    itemsServicesOpcional.value = dataServicesOpcional;
  }

  function _setItemsMenu(dataItemsMenu: ItemMenu[]): void {
    const securitysStore = useSecuritysStore();
    itemsMenu.value = dataItemsMenu;
    securitysStore.dataMenu = true;
  }

  function _setItemsList(dataItemsList: GrupoMenuRaiz[]): void {
    itemsList.value = dataItemsList;
  }

  function _setItemsContainers(dataContainers: TipoContenedor[]): void {
    itemsContainers.value = dataContainers;
  }

  function _setItemsAirlines(dataAirlines: FilaRaiz[]): void {
    itemsAirlines.value = dataAirlines;
  }

  function _setItemsNaviera(dataNaviera: FilaRaiz[]): void {
    itemsNavieras.value = dataNaviera;
  }

  function _setItemsMotonave(dataMotonave: FilaRaiz[]): void {
    itemsMotonave.value = dataMotonave;
  }

  function _setItemsFleteCon(data: FilaRaiz[]): void {
    itemsFleteCon.value = data;
  }

  function _setItemsCoinsList(data: Moneda[]): void {
    itemsCoinsList.value = data;
  }

  function _setDataNroHouse(data: NroHouseRaiz[]): void {
    const mastersStore = useMastersStore();
    house_expediente.value = new Date().getFullYear() + "HBL" + data[0]!.nro_house;
    mastersStore.house_nro_expediente = data[0]!.nro_house;
  }

  function _setHouseList(data: HouseListaRaiz[]): void {
    itemsHouseList.value = data;
  }

  function _setMasterList(data: ExpedienteMasterRaiz[]): void {
    itemsMasterList.value = data;
    // state.totalItemsMasterList = data.length || 0;
    dataMaster.value = true;
  }

  function _setHouseListAll(data: ExpedienteSinSolicitud[]): void {
    itemsHouseListAll.value = data;
    // state.totalItemsHouseListAll = data.length || 0;
    dataHouse.value = true;
  }

  function _setTotalHouseListAll(data: number): void {
    totalItemsHouseListAll.value = data;
  }

  function _setHouseServices(data: ServicioHouse[]): void {
    itemsHouseServices.value = data;
  }

  function _setBegEndList(data: BegEndHouseRaiz[]): void {
    itemsBegEndList.value = data;
  }

  function _setItemsOperador(data: OperadorRaiz[]): void {
    itemsOperadorList.value = data;
  }

  function _setItemsProveedorList(data: ProveedorRolRaiz[]): void {
    itemsProveedorList.value = data;
  }

  function _setItemsDataControl(data: ControlRaiz[]): void {
    dataControl_Numero.value = data[0]!.nrocontrol;
    dataControl_idControl.value = data[0]!.idcontrol;
    dataControl_id_orders.value = data[0]!.idorders;

    itemsDataControl.value = data;
    drawer.value = !drawer.value;
  }

  function _setItemsDataIngresos(data: FilaRaiz[]): void {
    itemsDataIngresos.value = data;
  }

  function _setItemsDataTotalesProveedor(data: TotalProveedorRaiz[]): void {
    itemsDataTotalesProveedor.value = data;
  }

  function _setItemsDataIngresosList(data: FilaRaiz[]): void {
    itemsDataIngresosList.value = data;
  }

  function _setItemsDataRoleList(data: RolSinParsearRaiz[]): void {
    let res: RolProveedor[] = [];
    if (data.length > 0) {
      res = data.map((r) => {
        return {
          ...r,
          id: parseInt(r.id),
        };
      });
    }
    itemsDataRoleList.value = res;
  }

  function _setItemsDataAccountList(data: OpcionCuentaBancaria[]): void {
    itemsDataAccountList.value = data;
  }

  function _setItemsDataBanksList(data: OpcionCuentaBancaria[]): void {
    itemsDataBanksList.value = data;
  }

  function _setItemsDataAccountsNumberList(data: FilaConIdRaiz[]): void {
    itemsDataAccountsNumberList.value = data;
  }

  function _setItemsDataControlList(data: MasterListadoControlGasto[]): void {
    itemsDataControlList.value = data;
    dataGastos.value = true;
  }

  function _setItemsReportFileAll(data: ExpedienteMasterReporte[]): void {
    itemsReportFileAll.value = [];
    // data.sort((a, b) => {
    //   if (
    //     a.dataHouse.fecha_disponibilidad < b.dataHouse.fecha_disponibilidad
    //   ) {
    //     return -1;
    //   }
    //   if (
    //     a.dataHouse.fecha_disponibilidad > b.dataHouse.fecha_disponibilidad
    //   ) {
    //     return 1;
    //   }
    //   return 0;
    // });
    itemsReportFileAll.value = data;

    reportStatusTable.value = false;
    reportsDialog.value = false;
  }

  function _setItemsReportFileAllMaster(datas: FilaRaiz[]): void {
    itemsReportFileAllMaster.value = [];
    itemsReportFileAllMaster.value = datas;
    reportStatusTable.value = false;
    reportsDialog.value = false;
  }

  function _setItemsTotalesAll(data: FilaRaiz[]): void {
    itemsTotalesAll.value = data;
  }

  function _setItemsPhone(data: FilaConIdRaiz[]): void {
    itemsListPhoneEdit.value = data;
  }

  function _setItemsContacts(data: FilaConIdRaiz[]): void {
    itemsListContactEdit.value = data;
  }

  function _setPerfomance(data: FilaRaiz[]): void {
    performances.value = data;
  }

  function _setInvoiceAdmin(data: FacturaAdminRaiz[]): void {
    InvoiceAdmin.value = data;
  }

  function _setMonth(data: FilaRaiz[]): void {
    month.value = data;
  }

  function _setYear(data: FilaRaiz[]): void {
    year.value = data;
  }

  function _setListPagosXProveedorCxP(data: ListaPagosRaiz): void {
    listPagosXProveedorCxP.value = data;
  }

  function _setProveedores(data: ProveedorRaiz[]): void {
    provedores.value = data;
  }

  function _setClientes(data: ClienteRaiz[]): void {
    clientes.value = data;
  }

  function SET_BRANCH(data: SucursalSesion[]): void {
    branchs.value = data;
  }

  function SET_CUENTAS(data: CuentaBancariaPic[]): void {
    cuentas_pic.value = data;
    useBancosStore().cuentas = data;
  }

  function _setItemsProveedorRolAerolinea(data: FilaRaiz[]): void {
    itemsProveedorRolAerolinea.value = data;
  }

  function _setItemsProveedorRolShipper(data: FilaRaiz[]): void {
    itemsProveedorRolShipper.value = data;
  }

  async function _getEntities(role?: unknown): Promise<void> {
    const data = JSON.stringify({
      id_role: role,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<EntidadListadoRaiz[]>>(config)
      .then(function (response) {
        if (response.data.data) {
          _setEntities(response.data.data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getEntitiesCliente(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "get_listado_cliente?id_branch=" + sessionBranchId(),
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<EntidadListadoRaiz[]>>(config)
      .then(function (response) {
        if (response.data.data) {
          _setEntities(response.data.data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getConsigners(): Promise<void> {
    const data = JSON.stringify({
      id_role: 11,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setConsigners(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getNotify(): Promise<void> {
    const data = JSON.stringify({
      id_role: 11,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setNotify(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getAgents(): Promise<void> {
    const data = JSON.stringify({
      id_role: 1,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setAgents(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getProveedor(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "CargarProveedores?id_branch=" + sessionBranchId(),
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ProveedorRolRaiz[]>>(config)
      .then(function (response) {
        _setItemsProveedorList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getNavieras(): Promise<void> {
    const data = JSON.stringify({
      id_role: 2,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsNaviera(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getOperador(): Promise<void> {
    const data = JSON.stringify({
      id_role: 19,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<OperadorRaiz[]>>(config)
      .then(function (response) {
        _setItemsOperador(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getDocumentsPais(): Promise<void> {
    const data = JSON.stringify({
      id_pais: 139,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getDocumentsList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<DocumentoPais[]>>(config)
      .then(function (response) {
        _setDocumentsPais(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getPais(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPais",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<Pais[]>>(config)
      .then(function (response) {
        _setPais(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getState(idPais?: Numerico): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_state?id_pais=${idPais || ""}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag == true) {
          _setState(response.data.data);
        } else {
          _setState([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getCity(idState?: Numerico): Promise<void> {
    const data = JSON.stringify({
      idState: idState,
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getCity",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag == true) {
          _setCity(response.data.data);
        } else {
          _setCity([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getTown(idCity?: Numerico): Promise<void> {
    const data = JSON.stringify({
      idCity: idCity,
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getTown",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setTown(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getSex(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getSex?id_branch=" + sessionBranchId(),

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setSex(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getModality(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getModality",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<Modalidad[]>>(config)
      .then(function (response) {
        _setModality(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getShipment(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getShipment",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<TipoEmbarqueRaiz[]>>(config)
      .then(function (response) {
        _setShipment(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getPortBegin({ id_transport = 0, id = null, search = null }: FiltroPuertos): Promise<void> {
    const data = JSON.stringify({
      id_transport: id_transport,
      id_branch: sessionBranchId(),
      id: id,
      search: search,
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPortBegin",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<Puerto[]>>(config)
      .then(function (response) {
        _setPortBegin(response.data.data || []);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getPortEnd({ id_transport = 0, id = null, search = null }: FiltroPuertos): Promise<void> {
    const data = JSON.stringify({
      id_transport: id_transport,
      id_branch: sessionBranchId(),

      id: id,
      search: search,
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPortEnd",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<Puerto[]>>(config)
      .then(function (response) {
        _setPortEnd(response.data.data || []);
      })
      .catch(function () {});
  }

  async function _getIncoterms(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getIncoterms",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<IncotermRaiz[]>>(config)
      .then(function (response) {
        _setIncoterms(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function _getGroupList(): void {
    const dataUser = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[];
    const data = JSON.stringify({
      id_entitie: dataUser[0]!.id,
      id_module: sessionStorage.getItem("idMenu"),
      id_branch: sessionBranchId(),
    });

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getGroupList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios<ApiResponse<GrupoMenuRaiz[]>>(config)
      .then(function (response) {
        const menu: GrupoMenuRaiz[] = [];
        response.data.data.forEach((element) => {
          if (menu.filter((v) => v.namegroup == element.namegroup).length == 0) {
            menu.push(element);
          }
        });
        // commit("_setItemsList", response.data.data);
        _setItemsList(menu);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getContainers(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getContainersList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<TipoContenedor[]>>(config)
      .then(function (response) {
        if (!!response.data.estadoflag) {
          _setItemsContainers(response.data.data);
        } else {
          _setItemsContainers([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getAirlines(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getAirlines?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsAirlines(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getMotonave(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getMotonave?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsMotonave(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getFleteCon(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getFleteCon",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsFleteCon(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getCoinsList(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getCoinsList?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<Moneda[]>>(config)
      .then(function (response) {
        _setItemsCoinsList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getnroHouse(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getNroHouse?" + `id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<NroHouseRaiz[]>>(config)
      .then(function (response) {
        _setDataNroHouse(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getHouseList(): Promise<void> {
    const mastersStore = useMastersStore();
    const data = {
      id_master: mastersStore.master_insertId,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getHouseList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<HouseListaRaiz[]>>(config)
      .then(function (response) {
        _setHouseList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function cargarMaster(data: FiltroCargaMasterRaiz): Promise<void> {
    dataMaster.value = false;
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `cargar_master?id_branch=${sessionBranchId()}&id_modality=${data.idsentido ? data.idsentido : ""}&id_shipment=${
          data.idtipocarga ? data.idtipocarga : ""
        }&id_incoterms=${data.idincoterms ? data.idincoterms : ""}&id_port_begin=${
          data.idorigen ? data.idorigen : ""
        }&id_port_end=${data.idsentido ? data.idsentido : ""}
          
          `,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<ExpedienteMasterRaiz[]>>(config)
      .then(function (response) {
        let data: ApiResponse<ExpedienteMasterRaiz[]> | ExpedienteMasterRaiz[] = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          data = data.data.map((elemento, index) => {
            return { ...elemento, index };
          });
          _setMasterList(data);
        } else {
          _setMasterList([]);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && (data as ApiResponse<ExpedienteMasterRaiz[]>).status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getMasterList(): Promise<void> {
    const mastersStore = useMastersStore();
    dataMaster.value = false;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getMasterList",
      params: {
        ...mastersStore.master_filtro,
        id_branch: sessionBranchId(),
        id_tipo_embarque: mastersStore.master_filtro.id_tipo_embarque
          ? mastersStore.master_filtro.id_tipo_embarque.id || ""
          : "",
        status_adm:
          mastersStore.master_filtro.status_administrativo == 0 || mastersStore.master_filtro.status_administrativo == 1
            ? mastersStore.master_filtro.status_administrativo
            : "",
        pagina: mastersStore.master_filtro.pagina
          ? (mastersStore.master_filtro.pagina - 1) * (mastersStore.master_filtro.limite || 10)
          : 0,
        limite: mastersStore.master_filtro.limite || -1,
      },
      // `getMasterList?id_branch=${

      // }&id_canal=${vm.state.master_filtro.id_canal || ""}&id_sentido=${
      //   vm.state.master_filtro.id_sentido || ""
      // }&id_tipo_embarque=${
      //   vm.state.master_filtro.id_tipo_embarque
      //     ? vm.state.master_filtro.id_tipo_embarque.id || ""
      //     : ""
      // }&id_origen=${vm.state.master_filtro.id_origen || ""}&id_destino=${
      //   vm.state.master_filtro.id_destino || ""
      // }&id_agente=${vm.state.master_filtro.id_agente || ""}&fecha_etd=${
      //   vm.state.master_filtro.fecha_etd || ""
      // }&fecha_eta=${vm.state.master_filtro.fecha_eta || ""}&status_op=${
      //   vm.state.master_filtro.status_operativo == 0 ||
      //   vm.state.master_filtro.status_operativo == 1
      //     ? vm.state.master_filtro.status_operativo
      //     : ""
      // }&status_adm=${
      //   vm.state.master_filtro.status_administrativo == 0 ||
      //   vm.state.master_filtro.status_administrativo == 1
      //     ? vm.state.master_filtro.status_administrativo
      //     : ""
      // }&pagina=${
      //   vm.state.master_filtro.pagina
      //     ? (vm.state.master_filtro.pagina - 1) *
      //       (vm.state.master_filtro.limite || 10)
      //     : 0
      // }&limite=${vm.state.master_filtro.limite || -1}&orden=${
      //   vm.state.master_filtro.orden || ""
      // }&busqueda=${vm.state.master_filtro.busqueda || ""}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ExpedienteMasterRaiz[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setMasterList(response.data.data);
        } else {
          _setMasterList([]);

          if (mastersStore.master_filtrarData) {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
            });
          }
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getHouseListAll(): Promise<void> {
    const housesStore = useHousesStore();
    dataHouse.value = false;
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `getHouseListAll?id_branch=${sessionBranchId()}&id_master=${
          housesStore.house_filtro.id_master || ""
        }&id_sentido=${housesStore.house_filtro.id_sentido || ""}&id_tipo_embarque=${
          housesStore.house_filtro.id_tipo_embarque ? housesStore.house_filtro.id_tipo_embarque.id || "" : ""
        }&id_origen=${housesStore.house_filtro.id_origen || ""}&id_destino=${
          housesStore.house_filtro.id_destino || ""
        }&id_cliente=${housesStore.house_filtro.id_cliente || ""}&fecha_etd=${
          housesStore.house_filtro.fecha_etd || ""
        }&fecha_eta=${housesStore.house_filtro.fecha_eta || ""}&pagina=${
          housesStore.house_filtro.pagina
            ? (housesStore.house_filtro.pagina - 1) * (housesStore.house_filtro.limite || 10)
            : 0
        }&limite=${housesStore.house_filtro.limite || -1}&orden=${
          housesStore.house_filtro.orden || "code_master DESC"
        }&busqueda=${housesStore.house_filtro.busqueda || ""}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ExpedienteSinSolicitud[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setHouseListAll(response.data.data);
        } else {
          _setHouseListAll([]);

          if (housesStore.house_filtrarData) {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
            });
          }
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getTotalHouseListAll(): Promise<void> {
    const housesStore = useHousesStore();
    dataHouse.value = false;
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `getTotalHouseListAll?id_branch=${sessionBranchId()}&id_master=${
          housesStore.house_filtro.id_master || ""
        }&id_sentido=${housesStore.house_filtro.id_sentido || ""}&id_tipo_embarque=${
          housesStore.house_filtro.id_tipo_embarque ? housesStore.house_filtro.id_tipo_embarque.id || "" : ""
        }&id_origen=${housesStore.house_filtro.id_origen || ""}&id_destino=${
          housesStore.house_filtro.id_destino || ""
        }&id_cliente=${housesStore.house_filtro.id_cliente || ""}&fecha_etd=${
          housesStore.house_filtro.fecha_etd || ""
        }&fecha_eta=${housesStore.house_filtro.fecha_eta || ""}&busqueda=${housesStore.house_filtro.busqueda || ""}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse & { total: string }>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        _setTotalHouseListAll(parseInt(response.data.total) || 0);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getHouseServices(): Promise<void> {
    const data = {
      id: house_Id_get.value,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getHouseListAll",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<ServicioHouse[]>>(config)
      .then(function (response) {
        _setHouseServices(response.data.data);
      })
      .catch(function (error) {
        _setHouseServices([]);
        console.error(error);
      });
  }

  async function _getBegEndList(): Promise<void> {
    const data = {
      id: house_Id_get.value,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getBegEndList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<BegEndHouseRaiz[]>>(config)
      .then(function (response) {
        _setBegEndList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getControlFileAll(filtro: FilaRaiz): Promise<void> {
    filtro.id_branch = sessionBranchId();
    reportStatusTable.value = true;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getControlFile`,
      params: filtro,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ExpedienteMasterReporte[]>>(config)
      .then(function (response) {
        if (response.data.estadoflag == true) {
          _setItemsReportFileAll(response.data.data);
        } else {
          _setItemsReportFileAll([]);
          Swal.fire({
            icon: "error",
            text: response.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getControlFileAllMaster(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };
    reportStatusTable.value = true;
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getControlFileAllMaster",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsReportFileAllMaster(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getControlFileAllFilter(): Promise<void> {
    reportStatusTable.value = true;
    const data = {
      idsentido: report_id_sentido.value,
      idOperador: report_id_operador.value,
      idStatus: report_id_status.value,
      idStatusAdm: report_id_status_adm.value,
      fecha_ini: reportFecha_ini.value,
      fecha_fin: reportFecha_fin.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getControlFileAllFilter",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<ExpedienteMasterReporte[]>>(config)
      .then(function (response) {
        _setItemsReportFileAll(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getControlFileAllFilterMaster(): Promise<void> {
    reportStatusTable.value = true;
    const data = {
      idsentido: report_id_sentido.value,
      fecha_ini: reportFecha_ini.value,
      fecha_fin: reportFecha_fin.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getControlFileAllFilterMaster",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsReportFileAllMaster(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getTotalesAll(): Promise<void> {
    reportStatusTable.value = true;

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getTotalesAll",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsTotalesAll(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getTotales(): Promise<void> {
    reportStatusTable.value = true;
    const data = {
      idsentido: report_id_sentido.value,
      idOperador: report_id_operador.value,
      idStatus: report_id_status.value,
      idStatusAdm: report_id_status_adm.value,
      fecha_ini: reportFecha_ini.value,
      fecha_fin: reportFecha_fin.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getTotales",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsTotalesAll(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _addPhones(id_entities: Numerico): Promise<void> {
    itemsListPhone.value.push({
      id: phone_id.value.id,
      name: phone_id.value.name,
      number: phone_number.value,
    });
    const data = {
      id: id_entities,
      tipo: phone_id.value.id,
      phone: phone_number.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "guardar_telefono",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then()
      .catch(function (error) {
        console.error(error);
      });
    phone_id.value = "" as unknown as TipoTelefonoRaiz;
    phone_number.value = "";
  }

  function _addContacts(): void {
    itemsListContact.value.push({
      name: contact_name.value.toUpperCase(),
      number: contact_number.value,
    });

    contact_name.value = "";
    contact_number.value = "";
  }

  async function ListarPhones(id: Numerico): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_phone/" + id,
      headers: {
        "Content-Type": "application/json",
      },
    };
    itemsListPhone.value = [];
    await axios<ApiResponse<TelefonoListadoRaiz[]>>(config)
      .then(function (response) {
        response.data.data.forEach((element) => {
          itemsListPhone.value.push({
            id: element.id,
            name: element.name,
            number: element.phone_number,
          });
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  // `index` is an object rather than a row number: alert shows [object Object] and splice removes the first phone.
  function _deletePhones(): void {
    const index = {} as unknown as number;
    alert(index);
    itemsListPhone.value.splice(index, 1);
  }

  // `i` is an object rather than a row number: alert shows [object Object] and splice removes the first contact.
  function _deleteContacts(): void {
    const i = {} as unknown as number;
    alert(i);
    itemsListContact.value.splice(i, 1);
  }

  async function _getPhone(): Promise<void> {
    const entitiesStore = useEntitiesStore();
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPhone/" + entitiesStore.id_entitie_selected,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaConIdRaiz[]>>(config)
      .then(function (response) {
        _setItemsPhone(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getContacts(): Promise<void> {
    const entitiesStore = useEntitiesStore();
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getContacts/" + entitiesStore.id_entitie_selected,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaConIdRaiz[]>>(config)
      .then(function (response) {
        _setItemsContacts(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _setControl(): Promise<void> {
    const data = {
      id_house: dataControl_id_house.value,
      id_user: dataControl_id_user.value ? dataControl_id_user.value : null,
      status: dataControl_status.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setControl",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<ControlRaiz[]>>(config)
      .then(function (response) {
        _setItemsDataControl(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _setIngresos(): Promise<void> {
    const data = {
      id_orders: dataControl_id_orders.value,
      concepto: dataIngreso_concepto.value,
      monto_op: dataIngreso_montoop.value,
      igv_op: dataIngreso_igvop.value,
      total_op: dataIngreso_totalop.value,
      id_user: dataControl_id_user.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setIngresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsDataIngresos(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getIngresos(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getIngresos/" + dataControl_id_orders.value,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsDataIngresosList(response.data.data);
      })
      .catch(function (error) {
        // @ts-expect-error `d` is not defined, so a failed request rejects with a ReferenceError instead of logging.
        d; // eslint-disable-line @typescript-eslint/no-unused-expressions
        console.error(error);
      });
  }

  async function _getRole(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getRole",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<RolSinParsearRaiz[]>>(config)
      .then(function (response) {
        _setItemsDataRoleList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getTotalesProveedor(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getTotalesProveedor/" + dataControl_id_orders.value,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<TotalProveedorRaiz[]>>(config)
      .then(function (response) {
        _setItemsDataTotalesProveedor(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getControlList(): Promise<void> {
    const data = {
      ...controlgastosfiltro.value,
      id_branch: sessionBranchId(),
    };
    dataGastos.value = false;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getControlList",
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios<ApiResponse<MasterListadoControlGasto[]> & { statusText?: string }>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          _setItemsDataControlList(response.data.data);
        } else {
          _setItemsDataControlList([]);
          Swal.fire({
            icon: "error",
            title: data.statusText,
            text: data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && data.status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getAccountList(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getTypeAccount/",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<OpcionCuentaBancaria[]>>(config)
      .then(function (response) {
        _setItemsDataAccountList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getBanksList(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getBanksList/",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<OpcionCuentaBancaria[]>>(config)
      .then(function (response) {
        _setItemsDataBanksList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getPerformance(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPerfomance",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setPerfomance(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getInvoiceAdmin(id: Numerico): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getVerInvoiceAdmin/" + id,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FacturaAdminRaiz[]>>(config)
      .then(function (response) {
        _setInvoiceAdmin(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getInvoiceAdminCxC(id: Numerico): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getVerInvoiceAdminCxC/" + id,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FacturaAdminRaiz[]>>(config)
      .then(function (response) {
        _setInvoiceAdmin(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getChargeMonth(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getChargeMonth",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setMonth(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getChargeYear(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getChargeYear",
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setYear(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getListaPagosXProveedorCxP(id: Numerico): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = {
      id_proveedor: id,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN + `getListaPagosXProveedorCxP?id_proveedor=${id}&id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
      // params: data,
    };
    await axios<ApiResponse<ListaPagosRaiz>>(config)
      .then(function (response) {
        const res = response.data;
        if (!!res.estadoflag) {
          _setListPagosXProveedorCxP(res.data);
        } else {
          _setListPagosXProveedorCxP([]);
          Swal.fire({
            icon: "warning",
            title: "Advertencia",
            text: response.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getListaPagosXProveedorCxC(id: Numerico): Promise<void> {
    _setListPagosXProveedorCxP([]);
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getListaPagosXProveedorCxC/${id}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ListaPagosRaiz> & { statusBol?: boolean }>(config)
      .then(function (response) {
        if (!!response.data.statusBol) {
          const data = response.data.data;
          let index = 0;
          data.forEach((element) => {
            element.index = index;
            element.tipocambio = element.tipocambio ?? 1;
            element.id_coins = element.id_coins ?? 1;
            index++;
          });
          _setListPagosXProveedorCxP(data);
        } else {
          Swal.fire({
            icon: "warning",
            title: "Advertencia",
            text: response.data.mensaje,
          });
          // alert(response.data.mensaje);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  //ZONE ADD DATA
  async function cargarProveedores(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "CargarProveedores?id_branch=" + sessionBranchId(),
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ProveedorRaiz[]>>(config)
      .then(function (response) {
        _setProveedores(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function cargarClientes(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "CargarClientes?id_branch=" + sessionBranchId(),
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ClienteRaiz[]>>(config)
      .then(function (response) {
        // console.log(response)
        _setClientes(response.data.data);
        // vm.dataList = false;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function cargarBranch(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "CargarBranch/" + sessionUser().id_user,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<SucursalSesion[]> & { statusBol?: boolean }>(config).then(function (response) {
      if (response.data.statusBol == true) {
        SET_BRANCH(response.data.data);
      }
    });
  }

  function atras(): void {
    router.go(-1);
  }

  async function getListBanksDetailsCargar(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CuentaBancariaPic[]>>(config)
      .then(function (response) {
        SET_CUENTAS(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getListBanksDetailsCargarPorSucursal(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargarPorSucursal",
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CuentaBancariaPic[]>>(config)
      .then(function (response) {
        SET_CUENTAS(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getProveedorRolAerolinea(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_proveedor_x_rol?id_branch=${sessionBranchId()}&rol=AEROLINEA`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setItemsProveedorRolAerolinea(response.data.data);
        } else {
          _setItemsProveedorRolAerolinea([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getProveedorRolShipper(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_proveedor_x_rol?id_branch=${sessionBranchId()}&rol=SHIPPER`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setItemsProveedorRolShipper(response.data.data);
        } else {
          _setItemsProveedorRolShipper([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    recargarClienteFlag,
    dialogProcessing,
    lstMenu,
    registroClienteFlag,
    refreshReport,
    imgSave,
    imgFolder,
    imgMailbox,
    imgList,
    dataList,
    dataGastos,
    dataGastosMain,
    dataMaster,
    dataHouse,
    nro_cuotas,
    spiner,
    house_id_master,
    cuota,
    fechacuota,
    modalAgente,
    modalAdmin,
    modalPro,
    modalConsigner,
    modalNotify,
    modalColoader,
    modalNaviera,
    modalContainers,
    modalEntitie,
    modalvelocidad,
    modalPhones,
    modalPhonesEdit,
    modalContacts,
    modalContactsEdit,
    modalCuentas,
    actualizar,
    limpiar,
    totalIngresos,
    totalIngresosOp,
    totalIgvIngresos,
    totalIgvIngresosOp,
    totalTotalIngresos,
    totalTotalIngresosOp,
    totalEgresos,
    totalEgresosOp,
    totalIgvEgresos,
    totalIgvEgresosOp,
    totalTotalEgresos,
    totalTotalEgresosOp,
    security,
    departamentoUser,
    menuName,
    modalServices,
    phone_id,
    phone_number,
    contact_name,
    contact_number,
    cuentas_pic,
    itemsPhone,
    itemsListPhone,
    itemsListPhoneEdit,
    contact_id,
    itemsContact,
    itemsListContact,
    itemsListContactEdit,
    itemsEntities,
    itemsAgents,
    itemsConsigners,
    itemsNotify,
    itemsAirlines,
    itemsNavieras,
    itemsMotonave,
    itemsContainers,
    itemsDocumentsPais,
    itemsPais,
    itemsState,
    itemsCity,
    itemsTown,
    itemsSex,
    itemsModality,
    itemsShipment,
    itemsPortBegin,
    itemsPortEnd,
    itemsIncoterms,
    itemsServicesEnd,
    itemsServicesFlete,
    itemsServicesOpcional,
    itemsMenu,
    itemsList,
    itemsFleteCon,
    itemsCoinsList,
    itemsHouseList,
    itemsMasterList,
    itemsHouseListAll,
    itemsHouseServices,
    itemsBegEndList,
    itemsOperadorList,
    itemsProveedorList,
    itemsReportFileAll,
    itemsReportFileAllMaster,
    itemsTotalesAll,
    itemsDataControl,
    itemsDataIngresos,
    itemsDataIngresosList,
    itemsDataEgresosList,
    itemsDataControlList,
    itemsDataRoleList,
    itemsDataAccountList,
    itemsDataBanksList,
    itemsDataAccountsNumberList,
    itemsDataConceptos,
    itemsProveedorRolAerolinea,
    itemsProveedorRolShipper,
    provedores,
    clientes,
    itemsDataTotalesProveedor,
    performances,
    InvoiceAdmin,
    month,
    year,
    listPagosXProveedorCxP,
    datanroMaster,
    datanroHouse,
    drawer,
    mainTitle,
    master_id_trasnport,
    master_embarque,
    master_origen,
    master_destino,
    master_id_containers,
    master_nro_containers,
    master_nro_precinto,
    accountIdTypeAccount,
    accountIdBanks,
    accountIdCoins,
    accountNumer,
    accountIdEntities,
    accountStatus,
    master_cantidad,
    master_id_agente,
    master_master_monto,
    cg_filtrarData,
    controlgastosfiltro,
    dataControl_Numero,
    dataControl_idControl,
    dataControl_id_house,
    dataControl_id_user,
    dataControl_status,
    dataControl_id_orders,
    house_Id_get,
    house_cotizanion,
    house_embarque,
    house_cantidad_house,
    house_insertId,
    house_id_consigner,
    house_master_monto,
    house_expediente,
    totalItemsHouseListAll,
    services_id_begend,
    services_name,
    services_price,
    dataHouse_modality,
    dataHouse_shipment,
    dataHouse_port_begin,
    dataHouse_port_end,
    dataHouse_agente,
    dataHouse_consigners,
    dataHouse_notify,
    dataHouse_ruc,
    dataHouse_exp,
    dataHouse_code_house,
    dataHouse_code_master,
    dataHouse_bultos,
    dataHouse_peso,
    dataHouse_volumen,
    dataHouse_operador,
    dataIngreso_concepto,
    dataIngreso_statusCalcula,
    dataIngreso_montoop,
    dataIngreso_montopr,
    dataIngreso_igvop,
    dataIngreso_igvpr,
    dataIngreso_totalop,
    dataIngreso_totalpr,
    dataIngreso_opcion,
    dataIngreso_fnumero,
    dataIngreso_ffecha,
    dataIngreso_id,
    dataIngresoItems,
    dataCostos_proveedorName,
    dataCostos_idProveedor,
    dataCostos_concepto,
    dataCostos_statusCalcula,
    dataCostos_monto,
    dataCostos_igv,
    dataCostos_total,
    dataCostos_id,
    dataCostos_opcion,
    dataCostos_fnumero,
    dataCostos_ffecha,
    dataCostosItems,
    dataTotalIngreso,
    dataTotalCostos,
    dataTotalIGV,
    dataTotalCI,
    report_id_status,
    report_id_status_adm,
    report_id_sentido,
    report_id_operador,
    reportFecha_ini,
    reportFecha_fin,
    reportStatusTable,
    reportStatusTotal,
    reportsDialog,
    reportsButton,
    totalExpedientesMaster,
    totalExpedientesHouse,
    totalIA,
    totalEA,
    totalIM,
    totalEM,
    totalLL,
    totalPL,
    totalSS,
    totalPS,
    branchs,
    id_role_actual,
    master_itemsContainers,
    embar_title_nacn,
    dataBranch,
    service_id_begend,
    isEmpresaPermitida,
    itemsEntitie,
    itemsConsigner,
    itemsNotifyGetter,
    itemsAgentsGetter,
    itemsAirlinesGetter,
    itemsNavierasGetter,
    itemsMotonaveGetter,
    itemsContainersGetter,
    itemsDocument,
    itemsPaisGetter,
    itemsStateGetter,
    itemsCityGetter,
    itemsTownGetter,
    itemsSexGetter,
    itemsModalityGetter,
    itemsShipmentGetter,
    itemsPortBeginGetter,
    itemsPortEndGetter,
    itemsIncotermsGetter,
    itemsServicesEndGetter,
    itemsServicesFleteGetter,
    itemsServicesOpcionalGetter,
    itemsMenuGetter,
    itemsListGetter,
    itemsFleteConGetter,
    itemsCoinsListGetter,
    itemsHouseListGetter,
    itemsMasterListGetter,
    itemsHouseListAllGetter,
    itemsHouseServicesGetter,
    itemsBegEndListGetter,
    itemsOperadorListGetter,
    itemsReportFileAllGetter,
    itemsReportFileAllMasterGetter,
    itemsTotalesAllGetter,
    itemsDataControlGetter,
    itemsDataIngresosGetter,
    itemsDataIngresosListGetter,
    itemsDataEgresosListGetter,
    itemsDataRoleListGetter,
    itemsDataAccountListGetter,
    itemsDataBanksListGetter,
    itemsDataAccountsNumberListGetter,
    itemsDataTotalesProveedorGetter,
    datanroMasterGetter,
    datanroHouseGetter,
    master_embarqueGetter,
    id_role_actualGetter,
    performancesGetter,
    InvoiceAdminGetter,
    monthGetter,
    yearGetter,
    listPagosXProveedorCxPGetter,
    provedoresGetter,
    clientesGetter,
    _setEntities,
    _setConsigners,
    _setNotify,
    _setAgents,
    _setDocumentsPais,
    _setPais,
    _setState,
    _setCity,
    _setTown,
    _setSex,
    _setModality,
    _setShipment,
    _setPortBegin,
    _setPortEnd,
    _setIncoterms,
    _setServicesEnd,
    _setServicesFlete,
    _setServicesOpcional,
    _setItemsMenu,
    _setItemsList,
    _setItemsContainers,
    _setItemsAirlines,
    _setItemsNaviera,
    _setItemsMotonave,
    _setItemsFleteCon,
    _setItemsCoinsList,
    _setDataNroHouse,
    _setHouseList,
    _setMasterList,
    _setHouseListAll,
    _setTotalHouseListAll,
    _setHouseServices,
    _setBegEndList,
    _setItemsOperador,
    _setItemsProveedorList,
    _setItemsDataControl,
    _setItemsDataIngresos,
    _setItemsDataTotalesProveedor,
    _setItemsDataIngresosList,
    _setItemsDataRoleList,
    _setItemsDataAccountList,
    _setItemsDataBanksList,
    _setItemsDataAccountsNumberList,
    _setItemsDataControlList,
    _setItemsReportFileAll,
    _setItemsReportFileAllMaster,
    _setItemsTotalesAll,
    _setItemsPhone,
    _setItemsContacts,
    _setPerfomance,
    _setInvoiceAdmin,
    _setMonth,
    _setYear,
    _setListPagosXProveedorCxP,
    _setProveedores,
    _setClientes,
    SET_BRANCH,
    SET_CUENTAS,
    _setItemsProveedorRolAerolinea,
    _setItemsProveedorRolShipper,
    _getEntities,
    _getEntitiesCliente,
    _getConsigners,
    _getNotify,
    _getAgents,
    _getProveedor,
    _getNavieras,
    _getOperador,
    _getDocumentsPais,
    _getPais,
    _getState,
    _getCity,
    _getTown,
    _getSex,
    _getModality,
    _getShipment,
    _getPortBegin,
    _getPortEnd,
    _getIncoterms,
    _getGroupList,
    _getContainers,
    _getAirlines,
    _getMotonave,
    _getFleteCon,
    _getCoinsList,
    _getnroHouse,
    _getHouseList,
    cargarMaster,
    _getMasterList,
    _getHouseListAll,
    _getTotalHouseListAll,
    _getHouseServices,
    _getBegEndList,
    _getControlFileAll,
    _getControlFileAllMaster,
    _getControlFileAllFilter,
    _getControlFileAllFilterMaster,
    _getTotalesAll,
    _getTotales,
    _addPhones,
    _addContacts,
    ListarPhones,
    _deletePhones,
    _deleteContacts,
    _getPhone,
    _getContacts,
    _setControl,
    _setIngresos,
    _getIngresos,
    _getRole,
    _getTotalesProveedor,
    _getControlList,
    _getAccountList,
    _getBanksList,
    _getPerformance,
    _getInvoiceAdmin,
    _getInvoiceAdminCxC,
    _getChargeMonth,
    _getChargeYear,
    _getListaPagosXProveedorCxP,
    _getListaPagosXProveedorCxC,
    cargarProveedores,
    cargarClientes,
    cargarBranch,
    atras,
    getListBanksDetailsCargar,
    getListBanksDetailsCargarPorSucursal,
    _getProveedorRolAerolinea,
    _getProveedorRolShipper,
  };
});
