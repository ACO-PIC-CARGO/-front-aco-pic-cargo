import Vue from "vue";
import Vuex from "vuex";
import axios from "@/api/axios-config";
import router from "@/router";
import imgSave from "../../public/img/svg/save.svg";
import imgFolder from "../../public/img/svg/folder.svg";
import imgMailbox from "../../public/img/svg/mailbox.svg";
import imgList from "../../public/img/svg/lista.svg";
import VueSweetalert2 from "vue-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import pricing from "./modules/pricing";
import calculadoras from "./modules/calculadora";
import controlGastos from "./modules/controlGasto";
import consolidacion from "./modules/consolidacion";
import bancos from "./modules/banco";
import programaciones from "./modules/programacion";
import balances from "./modules/balanace";
import proyecciones from "./modules/proyeccion";
import entities from "./modules/entitie";
import houses from "./modules/house";
import files from "./modules/file";
import monedas from "./modules/moneda";
import masters from "./modules/master";
import securitys from "./modules/security";
import enterprises from "./modules/enterprise";
import masterusuarios from "./modules/masterusuario";
import marketing from "./modules/marketing";
import type_phone from "./modules/typePhone";
import document from "./modules/document";
import year from "./modules/year";
import sex from "./modules/sex";
import groupservices from "./modules/groupservices";
import incoterm from "./modules/incoterm";
import performance from "./modules/performance";
import bank from "./modules/bank";
import modality from "./modules/modality";
import transport from "./modules/transport";
import reportes from "./modules/reporte";
import gastos from "./modules/gastos";
import coins from "./modules/coins";
import ingresos from "./modules/ingresos";
import containers from "./modules/containers";
import shipment from "./modules/shipment";
import multiplicador from "./modules/multiplicador";
import airlines from "./modules/airlines";
import QuoteStatus from "./modules/QuoteStatus";
import puerto from "./modules/puerto";
import motonave from "./modules/motonave";
import states from "./modules/state";
import city from "./modules/city";
import town from "./modules/town";
import begend from "./modules/begend";
import typepayment from "./modules/typepayment";
import subingreso from "./modules/SubIngreso";
import subgasto from "./modules/SubGasto";
import itemServices from "./modules/itemServices";
import user from "./modules/user";
import position from "./modules/position";
import comentariosPredefinidos from "./modules/comentariosPredefinidos";
import configEmpresa from "./modules/configEmpresa";
import statushouse from "./modules/statushouse";
import configAviso from "./modules/configAviso";
import branch from "./modules/branch";
import aduana from "./modules/aduana";
import proveedor from "./modules/proveedor";
import configuracion from "./modules/configuracion";
import Swal from "sweetalert2";
Vue.use(Vuex);
Vue.use(VueSweetalert2);

export default new Vuex.Store({
  state: {
    salidaflag: false,
    llegadaflag: false,
    disponibilidadflag: false,
    recargarClienteFlag: false,
    dialogProcessing: false,
    lstMenu: [],
    namecampaign: "",
    comentario: [],
    copy_house: null,
    id_canal: "",
    nro_manifiesto: "",
    url_folderonedrive: "",
    fecha_libre_almacenaje: "",
    fecha_libre_sobreestadia: "",
    almacen_recepcion: "",
    dias_sobreestadia: 0,
    registroClienteFlag: false,
    refreshReport: false,
    imgSave: imgSave,
    imgFolder: imgFolder,
    imgMailbox: imgMailbox,
    imgList: imgList,
    dataList: false,
    dataMenu: false,
    dataGastos: false,
    dataGastosMain: false,
    dataMaster: false,
    dataHouse: false,
    grupalflag: false,
    nro_cuotas: 3,
    spiner: false,
    house_id_master: "",
    cuota: [],
    fechacuota: [],
    modalAgente: false,
    modalAdmin: false,
    modalPro: false,
    modalConsigner: false,
    modalNotify: false,
    modalColoader: false,
    modalNaviera: false,
    modalContainers: false,
    modalEntitie: false,
    modalvelocidad: false,
    modalPhones: false,
    modalPhonesEdit: false,
    modalContacts: false,
    modalContactsEdit: false,
    modalCuentas: false,
    actualizar: false,
    limpiar: false,
    totalIngresos: 0,
    totalIngresosOp: 0,
    totalIgvIngresos: 0,
    totalIgvIngresosOp: 0,
    totalTotalIngresos: 0,
    totalTotalIngresosOp: 0,
    totalEgresos: 0,
    totalEgresosOp: 0,
    totalIgvEgresos: 0,
    totalIgvEgresosOp: 0,
    totalTotalEgresos: 0,
    totalTotalEgresosOp: 0,
    security: 2,
    departamentoUser: 0,

    menuName: "",

    modalServices: false,
    modalServices_manualMode: false,

    phone_id: "",
    phone_number: "",

    contact_name: "",
    contact_number: "",
    cuentas_pic: [],
    itemsPhone: [
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
    ],

    itemsListPhone: [],
    itemsListPhoneEdit: [],

    contact_id: "",
    contact_number: "",

    itemsContact: [
      {
        id: 1,
        name: "Oficina",
      },
      {
        id: 2,
        name: "Celular",
      },
    ],

    itemsListContact: [],
    itemsListContactEdit: [],

    id_entitie_selected: "",

    data_id_role: "",

    itemsEntities: [],
    itemsAgents: [],
    itemsConsigners: [],
    itemsColoaders: [],
    itemsNotify: [],
    itemsAirlines: [],
    itemsNavieras: [],
    itemsMotonave: [],
    itemsContainers: [],
    itemsDocumentsPais: [],
    itemsPais: [],
    itemsState: [],
    itemsCity: [],
    itemsTown: [],
    itemsSex: [],
    itemsModality: [],
    itemsShipment: [],
    itemsPortBegin: [],
    itemsPortEnd: [],
    itemsIncoterms: [],
    itemsServicesBegin: [],
    itemsServicesList: [],
    itemsServicesEnd: [],
    itemsServicesFlete: [],
    itemsServicesOpcional: [],
    itemsMenu: [],
    itemsList: [],
    itemsBitacoraList: [],
    itemsFleteCon: [],
    itemsCoinsList: [],
    itemsHouseList: [],
    itemsMasterList: [],
    itemsBitacoraLineal: [],
    itemsHouseListAll: [],
    itemsHouseServices: [],
    itemsBegEndList: [],
    itemsBitacora: [],
    itemsHouseContainers: [],
    itemsOperadorList: [],
    itemsProveedorList: [],
    itemsReportFileAll: [],
    itemsReportFileAllMaster: [],
    itemsTotalesAll: [],
    itemsDataControl: [],
    itemsDataIngresos: [],
    itemsDataIngresosList: [],
    itemsDataEgresosList: [],
    itemsDataControlList: [],
    itemsDataRoleList: [],
    itemsDataAccountList: [],
    itemsDataBanksList: [],
    itemsDataAccountsNumberList: [],
    itemsDataConceptos: [],
    itemsProveedorRolAgente: [],
    itemsProveedorRolAerolinea: [],
    itemsProveedorRolColoader: [],
    itemsProveedorRolNaviera: [],
    itemsProveedorRolShipper: [],
    itemsComentariosPredefinidos: [],
    provedores: [],
    clientes: [],
    itemsDataTotalesProveedor: [],
    performances: [],
    InvoiceAdmin: [],
    month: [],
    year: [],
    listPagosXProveedorCxP: [],
    statusData: false,

    datanroMaster: "",
    datanroHouse: "",

    drawer: false,
    mainTitle: "INICIO",

    master_expediente: "",
    master_Id_get: "",
    master_nro_expediente: "",
    master_id_trasnport: "",
    master_cotizanion: "",
    master_sentido: "",
    master_embarque: "",
    master_incoterms: "",
    master_origen: "",
    master_destino: "",
    master_ganancia_pricing: "",
    master_ganancia_operaciones: "",
    master_id_containers: "",
    master_nro_containers: "",
    master_nro_precinto: "",
    master_id_operador: "",

    accountIdTypeAccount: 1,
    accountIdBanks: "",
    accountIdCoins: "",
    accountNumer: "",
    accountIdEntities: "",
    accountStatus: 1,

    master_cantidad: "",
    master_cantidad_house: 1,
    master_insertId: 1,

    master_id_agente: "",
    master_id_consigner: "",
    master_id_notify: "",
    master_id_airlines: "",
    master_id_coloader: "",
    master_id_naviera: "",
    master_id_motonave: "",
    master_viaje: "",
    master_bultos: "",
    master_peso: "",
    master_volumen: "",
    master_id_condicion: "",
    master_id_coins: "",
    master_master_monto: "",
    master_blmaster: "",

    totalItemsMasterList: 0,
    master_filtrarData: false,
    cg_filtrarData: false,
    master_filtro: {},
    controlgastosfiltro: {},

    dataControl_Numero: "",
    dataControl_idControl: "",
    dataControl_id_house: "",
    dataControl_id_user: "",
    dataControl_id_house: "",
    dataControl_status: 1,
    dataControl_id_orders: "",

    master_fecha_eta: new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .substr(0, 10),
    master_fecha_etd: new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .substr(0, 10),

    master_fecha_disponibilidad: new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .substr(0, 10),

    house_Id_get: "",
    house_id_trasnport: "",
    house_cotizanion: "",
    house_sentido: "",
    house_embarque: "",
    house_incoterms: "",
    house_origen: "",
    telexconfirmado: false,
    fechaconfirmaciontelex: "",
    house_destino: "",
    house_id_containers: "",
    house_cantidad: "",
    house_cantidad_house: 1,
    house_insertId: 1,

    house_id: "",
    house_id_agente: "",
    house_id_consigner: "",
    house_id_consigner_real: "",
    house_id_notify: "",
    house_id_airlines: "",
    house_id_coloader: "",
    house_id_naviera: "",
    house_id_motonave: "",
    house_viaje: "",
    house_bultos: "",
    house_peso: "",
    house_volumen: "",
    house_id_condicion: "",
    house_id_coins: "",
    house_master_monto: "",
    house_blmaster: "",
    url_onedrive: "",

    house_expediente: "",
    house_master: "",
    house_master_expediente: "",
    house_nro_expediente: "",

    house_nro_declaracion_aduana: "",
    house_canal_aduana: "",

    totalItemsHouseListAll: 0,
    house_filtrarData: false,
    house_filtro: {},

    services_id_begend: "",
    services_name: "",
    services_price: "",

    dataHouse_modality: "",
    dataHouse_shipment: "",
    dataHouse_port_begin: "",
    dataHouse_port_end: "",
    dataHouse_agente: "",
    dataHouse_consigners: "",
    dataHouse_notify: "",
    dataHouse_ruc: "",
    dataHouse_exp: "",
    dataHouse_transporte: "",

    dataHouse_code_house: "",
    dataHouse_code_master: "",

    dataHouse_bultos: "",
    dataHouse_peso: "",
    dataHouse_volumen: "",

    dataHouse_operador: "",

    dataIngreso_concepto: "",
    dataIngreso_statusCalcula: true,
    dataIngreso_montoop: "",
    dataIngreso_montopr: "",
    dataIngreso_igvop: "",
    dataIngreso_igvpr: "",
    dataIngreso_totalop: "",
    dataIngreso_totalpr: "",

    dataIngreso_opcion: "",
    dataIngreso_fnumero: "",
    dataIngreso_ffecha: "",

    dataIngreso_id: "",

    dataIngresoItems: [],

    dataCostos_proveedorName: "",
    dataCostos_idProveedor: "",
    dataCostos_concepto: "",
    dataCostos_statusCalcula: true,
    dataCostos_monto: "",
    dataCostos_igv: "",
    dataCostos_total: "",
    dataCostos_id: "",

    dataCostos_opcion: "",
    dataCostos_fnumero: "",
    dataCostos_ffecha: "",

    dataCostosItems: [],

    dataTotalIngreso: "",
    dataTotalCostos: "",
    dataTotalIGV: "",
    dataTotalCI: "",

    report_id_status: "",
    report_id_status_adm: "",
    report_id_sentido: "",
    report_id_operador: "",
    reportFecha_ini: "",
    reportFecha_fin: "",
    reportStatusTable: true,
    reportStatusTotal: true,

    reportsDialog: false,
    reportsButton: false,

    totalExpedientesMaster: 0,
    totalExpedientesHouse: 0,
    totalIA: 0,
    totalEA: 0,
    totalIM: 0,
    totalEM: 0,
    totalLL: 0,
    totalPL: 0,
    totalSS: 0,
    totalPS: 0,

    bitacora_id_bitacora: "",
    bitacora_comentario_predefinido: "",
    bitacora_comentario: "",
    bitacora_comentario_flag: false,
    branchs: null,
    bitacora_fecha: new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .substr(0, 10),
    bitacora_visible_cliente: true,
    house_enlace_tracking: "",

    rowMaster: "",

    id_role_actual: "",

    master_itemsContainers: [],

    embar_title_nacn: "Aerolinea/Coloader/Naviera",

    dataBranch: JSON.parse(sessionStorage.getItem("dataBranch")),
  },
  getters: {
    itemsEntitie: (state) => state.itemsEntities,
    itemsConsigner: (state) => state.itemsContainers,
    itemsColoaders: (state) => state.itemsColoaders,
    itemsNotify: (state) => state.itemsNotify,
    itemsAgents: (state) => state.itemsAgents,
    itemsAirlines: (state) => state.itemsAirlines,
    itemsNavieras: (state) => state.itemsNavieras,
    itemsMotonave: (state) => state.itemsMotonave,
    itemsContainers: (state) => state.itemsContainers,
    itemsDocument: (state) => state.itemsDocumentsPais,
    itemsPais: (state) => state.itemsPais,
    itemsState: (state) => state.itemsState,
    itemsCity: (state) => state.itemsCity,
    itemsTown: (state) => state.itemsTown,
    itemsSex: (state) => state.itemsSex,
    itemsModality: (state) => state.itemsModality,
    itemsShipment: (state) => state.itemsShipment,
    itemsPortBegin: (state) => state.itemsPortBegin,
    itemsPortEnd: (state) => state.itemsPortEnd,
    itemsIncoterms: (state) => state.itemsIncoterms,
    itemsServicesBegin: (state) => state.itemsServicesBegin,
    itemsServicesList: (state) => state.itemsServicesList,
    itemsServicesEnd: (state) => state.itemsServicesEnd,
    itemsServicesFlete: (state) => state.itemsServicesFlete,
    itemsServicesOpcional: (state) => state.itemsServicesOpcional,
    itemsBitacoraList: (state) => state.itemsBitacoraList,
    itemsMenu: (state) => state.itemsMenu,
    itemsList: (state) => state.itemsMenu,
    itemsFleteCon: (state) => state.itemsFleteCon,
    itemsCoinsList: (state) => state.itemsCoinsList,
    itemsHouseList: (state) => state.itemsHouseList,
    itemsMasterList: (state) => state.itemsMasterList,
    itemsBitacoraLineal: (state) => state.itemsBitacoraLineal,
    itemsHouseListAll: (state) => state.itemsHouseListAll,
    itemsHouseServices: (state) => state.itemsHouseServices,
    itemsBegEndList: (state) => state.itemsBegEndList,
    itemsBitacora: (state) => state.itemsBitacora,
    itemsHouseContainers: (state) => state.itemsHouseContainers,
    itemsOperadorList: (state) => state.itemsOperadorList,
    itemsReportFileAll: (state) => state.itemsReportFileAll,
    itemsReportFileAllMaster: (state) => state.itemsReportFileAllMaster,
    itemsTotalesAll: (state) => state.itemsTotalesAll,
    itemsDataControl: (state) => state.itemsDataControl,
    itemsDataIngresos: (state) => state.itemsDataIngresos,
    itemsDataIngresosList: (state) => state.itemsDataIngresosList,
    itemsDataEgresosList: (state) => state.itemsDataEgresosList,
    itemsDataRoleList: (state) => state.itemsDataRoleList,
    itemsDataAccountList: (state) => state.itemsDataAccountList,
    itemsDataBanksList: (state) => state.itemsDataBanksList,
    itemsDataAccountsNumberList: (state) => state.itemsDataAccountsNumberList,
    itemsDataTotalesProveedor: (state) => state.itemsDataTotalesProveedor,
    itemsComentariosPredefinidos: (state) => state.itemsComentariosPredefinidos,

    datanroMaster: (state) => state.datanroMaster,
    datanroHouse: (state) => state.datanroHouse,

    master_embarque: (state) => state.master_id_trasnport.id,

    id_role_actual: (state) => state.id_role_actual,
    performances: (state) => state.performances,
    InvoiceAdmin: (state) => state.InvoiceAdmin,
    month: (state) => state.InvoiceAdmin,
    year: (state) => state.InvoiceAdmin,
    listPagosXProveedorCxP: (state) => state.listPagosXProveedorCxP,
    provedores: (state) => state.provedores,
    clientes: (state) => state.clientes,
  },
  mutations: {
    _setEntities(state, dataEntities) {
      state.itemsEntities = dataEntities;

      state.dataList = true;
    },

    _setConsigners(state, dataConsigner) {
      state.itemsConsigners = dataConsigner;
    },

    _setNotify(state, dataNotify) {
      state.itemsNotify = dataNotify;
    },

    _setAgents(state, dataAgents) {
      state.itemsAgents = dataAgents;
    },

    _setColoaders(state, dataColoaders) {
      state.itemsColoaders = dataColoaders;
    },

    _setDocumentsPais(state, dataDocumentsPais) {
      state.itemsDocumentsPais = dataDocumentsPais;
    },
    _setPais(state, dataPais) {
      state.itemsPais = dataPais;
    },
    _setState(state, dataState) {
      state.itemsState = dataState;
    },
    _setCity(state, dataCity) {
      state.itemsCity = dataCity;
    },
    _setTown(state, dataTown) {
      state.itemsTown = dataTown;
    },
    _setSex(state, dataSex) {
      state.itemsSex = dataSex;
    },
    _setModality(state, dataModality) {
      state.itemsModality = dataModality;
    },
    _setShipment(state, dataShipment) {
      state.itemsShipment = dataShipment;
    },
    _setPortBegin(state, dataPortBegint) {
      state.itemsPortBegin = dataPortBegint;
    },
    _setPortEnd(state, dataPortEnd) {
      state.itemsPortEnd = dataPortEnd;
    },
    _setIncoterms(state, dataIncoterms) {
      state.itemsIncoterms = dataIncoterms;
    },
    _setServicesBegin(state, dataServicesBegin) {
      state.itemsServicesBegin = dataServicesBegin.sort();
    },
    _setServicesEnd(state, dataServicesEnd) {
      state.itemsServicesEnd = dataServicesEnd;
    },
    _setServicesFlete(state, dataServicesFlete) {
      state.itemsServicesFlete = dataServicesFlete;
    },
    _setServicesOpcional(state, dataServicesOpcional) {
      state.itemsServicesOpcional = dataServicesOpcional;
    },
    _setItemsMenu(state, dataItemsMenu) {
      state.itemsMenu = dataItemsMenu;
      state.dataMenu = true;
    },
    _setItemsList(state, dataItemsList) {
      state.itemsList = dataItemsList;
    },
    _setItemsBitacoraList(state, dataBitacoraList) {
      state.itemsBitacoraList = dataBitacoraList;
    },
    _setItemsContainers(state, dataContainers) {
      state.itemsContainers = dataContainers;
    },

    _setItemsAirlines(state, dataAirlines) {
      state.itemsAirlines = dataAirlines;
    },

    _setItemsNaviera(state, dataNaviera) {
      state.itemsNavieras = dataNaviera;
    },

    _setItemsMotonave(state, dataMotonave) {
      state.itemsMotonave = dataMotonave;
    },

    _setItemsFleteCon(state, data) {
      state.itemsFleteCon = data;
    },

    _setItemsCoinsList(state, data) {
      state.itemsCoinsList = data;
    },

    _setDataNroMaster(state, data) {
      state.master_expediente =
        new Date().getFullYear() + "MBL" + data[0].nro_master;
      state.master_nro_expediente = data[0].nro_master;
    },

    _setDataNroHouse(state, data) {
      state.house_expediente =
        new Date().getFullYear() + "HBL" + data[0].nro_house;
      state.house_nro_expediente = data[0].nro_house;
    },

    _setRowMaster(state, data) {
      state.rowMaster = data;
    },

    _setHouseList(state, data) {
      state.itemsHouseList = data;
    },

    _setMasterList(state, data) {
      state.itemsMasterList = data;
      // state.totalItemsMasterList = data.length || 0;
      state.dataMaster = true;
    },

    _setTotalMasterList(state, data) {
      state.totalItemsMasterList = data;
    },

    _setBitacoraLineal(state, data) {
      state.itemsBitacoraLineal = data;
    },

    _setHouseListAll(state, data) {
      state.itemsHouseListAll = data;
      // state.totalItemsHouseListAll = data.length || 0;
      state.dataHouse = true;
    },

    _setTotalHouseListAll(state, data) {
      state.totalItemsHouseListAll = data;
    },

    _setHouseServices(state, data) {
      state.itemsHouseServices = data;
    },

    _setBegEndList(state, data) {
      state.itemsBegEndList = data;
    },
    _setItemsBitacora(state, data) {
      state.itemsBitacora = data;
    },

    _setItemsHouseContainers(state, data) {
      state.itemsHouseContainers = data;
    },

    _setServicesList(state, data) {
      state.itemsServicesList = data;
    },

    _setItemsOperador(state, data) {
      state.itemsOperadorList = data;
    },

    _setItemsProveedorList(state, data) {
      state.itemsProveedorList = data;
    },

    _setItemsDataControl(state, data) {
      state.dataControl_Numero = data[0].nrocontrol;
      state.dataControl_idControl = data[0].idcontrol;
      state.dataControl_id_orders = data[0].idorders;

      state.itemsDataControl = data;
      state.drawer = !state.drawer;
    },

    _setItemsDataIngresos(state, data) {
      state.itemsDataIngresos = data;
    },

    _setItemsDataTotalesProveedor(state, data) {
      state.itemsDataTotalesProveedor = data;
    },

    _setItemsDataIngresosList(state, data) {
      state.itemsDataIngresosList = data;
    },

    _setItemsDataRoleList(state, data) {
      let res = [];
      if (data.length > 0) {
        res = data.map((r) => {
          return {
            ...r,
            id: parseInt(r.id),
          };
        });
      }
      state.itemsDataRoleList = res;
    },

    _setItemsDataAccountList(state, data) {
      state.itemsDataAccountList = data;
    },

    _setItemsDataBanksList(state, data) {
      state.itemsDataBanksList = data;
    },

    _setItemsDataAccountsNumberList(state, data) {
      state.itemsDataAccountsNumberList = data;
    },

    _setItemsDataControlList(state, data) {
      state.itemsDataControlList = data;
      state.dataGastos = true;
    },

    _setItemsReportFileAll(state, data) {
      state.itemsReportFileAll = [];
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
      state.itemsReportFileAll = data;

      this.state.reportStatusTable = false;
      this.state.reportsDialog = false;
    },

    _setItemsReportFileAllMaster(state, datas) {
      state.itemsReportFileAllMaster = [];
      state.itemsReportFileAllMaster = datas;
      this.state.reportStatusTable = false;
      this.state.reportsDialog = false;
    },

    _setItemsTotalesAll(state, data) {
      state.itemsTotalesAll = data;
    },

    _setItemsPhone(state, data) {
      state.itemsListPhoneEdit = data;
    },

    _setItemsContacts(state, data) {
      state.itemsListContactEdit = data;
    },

    _setPerfomance(state, data) {
      state.performances = data;
    },
    _setInvoiceAdmin(state, data) {
      state.InvoiceAdmin = data;
    },
    _setMonth(state, data) {
      state.month = data;
    },
    _setYear(state, data) {
      state.year = data;
    },
    _setListPagosXProveedorCxP(state, data) {
      state.listPagosXProveedorCxP = data;
    },
    _setProveedores(state, data) {
      state.provedores = data;
    },
    _setClientes(state, data) {
      state.clientes = data;
    },
    SET_BRANCH(state, data) {
      state.branchs = data;
    },
    SET_CUENTAS(state, data) {
      state.cuentas_pic = data;
    },
    _setItemsProveedorRolAgente(state, data) {
      state.itemsProveedorRolAgente = data;
    },
    _setItemsProveedorRolAerolinea(state, data) {
      state.itemsProveedorRolAerolinea = data;
    },
    _setItemsProveedorRolColoader(state, data) {
      state.itemsProveedorRolColoader = data;
    },
    _setItemsProveedorRolNaviera(state, data) {
      state.itemsProveedorRolNaviera = data;
    },
    _setItemsProveedorRolShipper(state, data) {
      state.itemsProveedorRolShipper = data;
    },
    _setItemsComentariosPredefinidos(state, data) {
      state.itemsComentariosPredefinidos = data;
    },
  },
  actions: {
    openURL(__, { url }) {
      window.open(url, "_blank");
    },
    async _getEntities({ commit }, role) {
      var data = JSON.stringify({
        id_role: role,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitiesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          if (response.data.data) {
            commit("_setEntities", response.data.data);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getEntitiesCliente({ commit }, role) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "get_listado_cliente?id_branch=" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          if (response.data.data) {
            commit("_setEntities", response.data.data);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getConsigners({ commit }) {
      var data = JSON.stringify({
        id_role: 11,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitiesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setConsigners", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getNotify({ commit }) {
      var data = JSON.stringify({
        id_role: 11,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitiesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setNotify", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getAgents({ commit }) {
      var data = JSON.stringify({
        id_role: 1,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitiesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setAgents", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getProveedor({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "CargarProveedores?id_branch=" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsProveedorList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getNavieras({ commit }) {
      var data = JSON.stringify({
        id_role: 2,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitiesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsNaviera", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getColoaders({ commit }) {
      var data = JSON.stringify({
        id_role: 17,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitiesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setColoaders", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getOperador({ commit }) {
      var data = JSON.stringify({
        id_role: 19,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitiesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsOperador", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getDocumentsPais({ commit }) {
      var data = JSON.stringify({
        id_pais: 139,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getDocumentsList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setDocumentsPais", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getPais({ commit }) {
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getPais",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setPais", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getState({ commit }, idPais) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN + `cargar_state?id_pais=${idPais || ""}`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          if (data.estadoflag == true) {
            commit("_setState", response.data.data);
          } else {
            commit("_setState", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getCity({ commit }, idState) {
      var data = JSON.stringify({
        idState: idState,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getCity",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          if (data.estadoflag == true) {
            commit("_setCity", response.data.data);
          } else {
            commit("_setCity", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getTown({ commit }, idCity) {
      var data = JSON.stringify({
        idCity: idCity,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getTown",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setTown", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getSex({ commit }) {
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getSex?id_branch=" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,

        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setSex", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getModality({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getModality",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setModality", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getShipment({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getShipment",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setShipment", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getPortBegin(
      { commit },
      { id_transport = 0, id = null, search = null },
    ) {
      var data = JSON.stringify({
        id_transport: id_transport,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id: id,
        search: search,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getPortBegin",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setPortBegin", response.data.data || []);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getPortEnd(
      { commit },
      { id_transport = 0, id = null, search = null },
    ) {
      var data = JSON.stringify({
        id_transport: id_transport,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,

        id: id,
        search: search,
      });
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getPortEnd",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setPortEnd", response.data.data || []);
        })
        .catch(function (error) {});
    },

    async _getIncoterms({ commit }) {
      let data = {
        id_branch: 1,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getIncoterms",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setIncoterms", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getServicesBegin({ commit }) {
      var data = {
        id_modality: this.state.master_sentido
          ? this.state.master_sentido
          : null,
        id_shipment: this.state.master_id_trasnport.id
          ? this.state.master_id_trasnport.id
          : null,
        id_incoterms: this.state.master_incoterms
          ? this.state.master_incoterms
          : null,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getItemsServices",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          if (response.data.data) {
            commit("_setServicesBegin", response.data.data);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    _getGroupList({ commit }) {
      var dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
      var data = JSON.stringify({
        id_entitie: dataUser[0].id,
        id_module: sessionStorage.getItem("idMenu"),
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getGroupList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          let menu = [];
          response.data.data.forEach((element) => {
            if (
              menu.filter((v) => v.namegroup == element.namegroup).length == 0
            ) {
              menu.push(element);
            }
          });
          // commit("_setItemsList", response.data.data);
          commit("_setItemsList", menu);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getBitacoraList({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getBitacoraList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsBitacoraList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getContainers({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getContainersList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsContainers", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getAirlines({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getAirlines?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsAirlines", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getMotonave({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getMotonave?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsMotonave", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getFleteCon({ commit }) {
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getFleteCon",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsFleteCon", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getCoinsList({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getCoinsList?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsCoinsList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getnroMaster({ commit }) {
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getNroMaster",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setDataNroMaster", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getnroHouse({ commit }) {
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getNroHouse?" +
          `id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setDataNroHouse", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getHouseList({ commit }) {
      var data = {
        id_master: this.state.master_insertId,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getHouseList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setHouseList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async cargarMaster({ commit }, data) {
      this.state.dataMaster = false;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `cargar_master?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_modality=${data.idsentido ? data.idsentido : ""}&id_shipment=${
            data.idtipocarga ? data.idtipocarga : ""
          }&id_incoterms=${
            data.idincoterms ? data.idincoterms : ""
          }&id_port_begin=${data.idorigen ? data.idorigen : ""}&id_port_end=${
            data.idsentido ? data.idsentido : ""
          }
          
          `,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          if (data.estadoflag) {
            data = data.data.map((elemento, index) => {
              return { ...elemento, index };
            });
            commit("_setMasterList", data);
          } else {
            commit("_setMasterList", []);
            Swal.fire({
              icon: "error",
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
          console.log(error);
        });
    },

    async _getMasterList({ commit }) {
      var vm = this;
      vm.state.dataMaster = false;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getMasterList?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_canal=${vm.state.master_filtro.id_canal || ""}&id_sentido=${
            vm.state.master_filtro.id_sentido || ""
          }&id_tipo_embarque=${
            vm.state.master_filtro.id_tipo_embarque
              ? vm.state.master_filtro.id_tipo_embarque.id || ""
              : ""
          }&id_origen=${vm.state.master_filtro.id_origen || ""}&id_destino=${
            vm.state.master_filtro.id_destino || ""
          }&id_agente=${vm.state.master_filtro.id_agente || ""}&fecha_etd=${
            vm.state.master_filtro.fecha_etd || ""
          }&fecha_eta=${vm.state.master_filtro.fecha_eta || ""}&status_op=${
            vm.state.master_filtro.status_operativo == 0 ||
            vm.state.master_filtro.status_operativo == 1
              ? vm.state.master_filtro.status_operativo
              : ""
          }&status_adm=${
            vm.state.master_filtro.status_administrativo == 0 ||
            vm.state.master_filtro.status_administrativo == 1
              ? vm.state.master_filtro.status_administrativo
              : ""
          }&pagina=${
            vm.state.master_filtro.pagina
              ? (vm.state.master_filtro.pagina - 1) *
                (vm.state.master_filtro.limite || 10)
              : 0
          }&limite=${vm.state.master_filtro.limite || -1}&orden=${
            vm.state.master_filtro.orden || ""
          }&busqueda=${vm.state.master_filtro.busqueda || ""}`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setMasterList", response.data.data);
          } else {
            commit("_setMasterList", []);

            if (vm.state.master_filtrarData) {
              Swal.fire({
                icon: "error",
                text: response.data.mensaje,
              });
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getTotalMasterList({ commit }) {
      var vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getTotalMasterList?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_canal=${vm.state.master_filtro.id_canal || ""}&id_sentido=${
            vm.state.master_filtro.id_sentido || ""
          }&id_tipo_embarque=${
            vm.state.master_filtro.id_tipo_embarque
              ? vm.state.master_filtro.id_tipo_embarque.id || ""
              : ""
          }&id_origen=${vm.state.master_filtro.id_origen || ""}&id_destino=${
            vm.state.master_filtro.id_destino || ""
          }&id_agente=${vm.state.master_filtro.id_agente || ""}&fecha_etd=${
            vm.state.master_filtro.fecha_etd || ""
          }&fecha_eta=${vm.state.master_filtro.fecha_eta || ""}&status_op=${
            vm.state.master_filtro.status_operativo == 0 ||
            vm.state.master_filtro.status_operativo == 1
              ? vm.state.master_filtro.status_operativo
              : ""
          }&status_adm=${
            vm.state.master_filtro.status_administrativo == 0 ||
            vm.state.master_filtro.status_administrativo == 1
              ? vm.state.master_filtro.status_administrativo
              : ""
          }&busqueda=${vm.state.master_filtro.busqueda || ""}`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          commit("_setTotalMasterList", parseInt(response.data.total) || 0);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getBitacoraLineal({ commit }, data) {
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getBitacoraLineal",
        headers: {
          "Content-Type": "application/json",
        },
        params: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setBitacoraLineal", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getHouseListAll({ commit }) {
      var vm = this;
      vm.state.dataHouse = false;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getHouseListAll?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_master=${vm.state.house_filtro.id_master || ""}&id_sentido=${
            vm.state.house_filtro.id_sentido || ""
          }&id_tipo_embarque=${
            vm.state.house_filtro.id_tipo_embarque
              ? vm.state.house_filtro.id_tipo_embarque.id || ""
              : ""
          }&id_origen=${vm.state.house_filtro.id_origen || ""}&id_destino=${
            vm.state.house_filtro.id_destino || ""
          }&id_cliente=${vm.state.house_filtro.id_cliente || ""}&fecha_etd=${
            vm.state.house_filtro.fecha_etd || ""
          }&fecha_eta=${vm.state.house_filtro.fecha_eta || ""}&pagina=${
            vm.state.house_filtro.pagina
              ? (vm.state.house_filtro.pagina - 1) *
                (vm.state.house_filtro.limite || 10)
              : 0
          }&limite=${vm.state.house_filtro.limite || -1}&orden=${
            vm.state.house_filtro.orden || "code_master DESC"
          }&busqueda=${vm.state.house_filtro.busqueda || ""}`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setHouseListAll", response.data.data);
          } else {
            commit("_setHouseListAll", []);

            if (vm.state.house_filtrarData) {
              Swal.fire({
                icon: "error",
                text: response.data.mensaje,
              });
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getTotalHouseListAll({ commit }) {
      var vm = this;
      vm.state.dataHouse = false;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getTotalHouseListAll?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_master=${vm.state.house_filtro.id_master || ""}&id_sentido=${
            vm.state.house_filtro.id_sentido || ""
          }&id_tipo_embarque=${
            vm.state.house_filtro.id_tipo_embarque
              ? vm.state.house_filtro.id_tipo_embarque.id || ""
              : ""
          }&id_origen=${vm.state.house_filtro.id_origen || ""}&id_destino=${
            vm.state.house_filtro.id_destino || ""
          }&id_cliente=${vm.state.house_filtro.id_cliente || ""}&fecha_etd=${
            vm.state.house_filtro.fecha_etd || ""
          }&fecha_eta=${vm.state.house_filtro.fecha_eta || ""}&busqueda=${
            vm.state.house_filtro.busqueda || ""
          }`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          commit("_setTotalHouseListAll", parseInt(response.data.total) || 0);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getHouseServices({ commit }) {
      var data = {
        id: this.state.house_Id_get,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getHouseListAll",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setHouseServices", response.data.data);
        })
        .catch(function (error) {
          commit("_setHouseServices", []);
          console.log(error);
        });
    },

    async _getBegEndList({ commit }) {
      var data = {
        id: this.state.house_Id_get,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getBegEndList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setBegEndList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getHouseBitacora({ commit }) {
      var data = {
        id: this.state.house_Id_get,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getHouseBitacora",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit(
            "_setItemsBitacora",
            response.data.estadoflag ? response.data.data : [],
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getHouseContainers({ commit }, data) {
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getHouseContainers",
        headers: {
          "Content-Type": "application/json",
        },
        params: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsHouseContainers", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getServicesList({ commit }) {
      var data = {
        id_modality: this.state.master_sentido,
        id_shipment: this.state.master_id_trasnport.id,
        id_incoterms: this.state.master_incoterms,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getItemsServicesList",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setServicesList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getControlFileAll({ commit }, filtro) {
      filtro.id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
      this.state.reportStatusTable = true;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getControlFile`,
        params:filtro,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          if (response.data.estadoflag == true) {
            commit("_setItemsReportFileAll", response.data.data);
          } else {
            commit("_setItemsReportFileAll", []);
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getControlFileAllMaster({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      this.state.reportStatusTable = true;
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getControlFileAllMaster",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsReportFileAllMaster", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getControlFileAllFilter({ commit }) {
      this.state.reportStatusTable = true;
      var data = {
        idsentido: this.state.report_id_sentido,
        idOperador: this.state.report_id_operador,
        idStatus: this.state.report_id_status,
        idStatusAdm: this.state.report_id_status_adm,
        fecha_ini: this.state.reportFecha_ini,
        fecha_fin: this.state.reportFecha_fin,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getControlFileAllFilter",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsReportFileAll", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getControlFileAllFilterMaster({ commit }) {
      this.state.reportStatusTable = true;
      var data = {
        idsentido: this.state.report_id_sentido,
        fecha_ini: this.state.reportFecha_ini,
        fecha_fin: this.state.reportFecha_fin,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getControlFileAllFilterMaster",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsReportFileAllMaster", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getTotalesAll({ commit }) {
      this.state.reportStatusTable = true;

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getTotalesAll",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsTotalesAll", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getTotales({ commit }) {
      this.state.reportStatusTable = true;
      var data = {
        idsentido: this.state.report_id_sentido,
        idOperador: this.state.report_id_operador,
        idStatus: this.state.report_id_status,
        idStatusAdm: this.state.report_id_status_adm,
        fecha_ini: this.state.reportFecha_ini,
        fecha_fin: this.state.reportFecha_fin,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getTotales",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsTotalesAll", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _addPhones(__, id_entities) {
      var vm = this;
      vm.state.itemsListPhone.push({
        id: vm.state.phone_id.id,
        name: vm.state.phone_id.name,
        number: vm.state.phone_number,
      });
      var data = {
        id: id_entities,
        tipo: vm.state.phone_id.id,
        phone: vm.state.phone_number,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "guardar_telefono",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then()
        .catch(function (error) {
          console.log(error);
        });
      this.state.phone_id = "";
      this.state.phone_number = "";
    },

    _addContacts() {
      this.state.itemsListContact.push({
        name: this.state.contact_name.toUpperCase(),
        number: this.state.contact_number,
      });

      this.state.contact_name = "";
      this.state.contact_number = "";
    },
    async ListarPhones(__, id) {
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "listar_phone/" + id,
        headers: {
          "Content-Type": "application/json",
        },
      };
      var vm = this;
      vm.state.itemsListPhone = [];
      await axios(config)
        .then(function (response) {
          response.data.data.forEach((element) => {
            vm.state.itemsListPhone.push({
              id: element.id,
              name: element.name,
              number: element.phone_number,
            });
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    _deletePhones(index) {
      alert(index);
      this.state.itemsListPhone.splice(index, 1);
    },

    _deleteContacts(i) {
      alert(i);
      this.state.itemsListContact.splice(i, 1);
    },

    async _getPhone({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getPhone/" +
          this.state.id_entitie_selected,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsPhone", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getContacts({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getContacts/" +
          this.state.id_entitie_selected,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsContacts", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _setControl({ commit }) {
      var data = {
        id_house: this.state.dataControl_id_house,
        id_user: this.state.dataControl_id_user
          ? this.state.dataControl_id_user
          : null,
        status: this.state.dataControl_status,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setControl",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsDataControl", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _setIngresos({ commit }) {
      var data = {
        id_orders: this.state.dataControl_id_orders,
        concepto: this.state.dataIngreso_concepto,
        monto_op: this.state.dataIngreso_montoop,
        igv_op: this.state.dataIngreso_igvop,
        total_op: this.state.dataIngreso_totalop,
        id_user: this.state.dataControl_id_user,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setIngresos",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsDataIngresos", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getIngresos({ commit }) {
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getIngresos/" +
          this.state.dataControl_id_orders,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsDataIngresosList", response.data.data);
        })
        .catch(function (error) {
          d;
          console.log(error);
        });
    },

    async _getRole({ commit }) {
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getRole",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsDataRoleList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getTotalesProveedor({ commit }) {
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getTotalesProveedor/" +
          this.state.dataControl_id_orders,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsDataTotalesProveedor", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getControlList({ commit }) {
      let data = {
        ...this.state.controlgastosfiltro,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      this.state.dataGastos = false;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getControlList",
        headers: {
          "Content-Type": "application/json",
        },
        params: data,
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          if (data.estadoflag) {
            commit("_setItemsDataControlList", response.data.data);
          } else {
            commit("_setItemsDataControlList", []);
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
          console.log(error);
        });
    },

    async _getAccountList({ commit }) {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getTypeAccount/",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsDataAccountList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getBanksList({ commit }) {
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getBanksList/",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setItemsDataBanksList", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getPerformance({ commit }) {
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getPerfomance",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setPerfomance", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getInvoiceAdmin({ commit }, id) {
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getVerInvoiceAdmin/" + id,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setInvoiceAdmin", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getInvoiceAdminCxC({ commit }, id) {
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getVerInvoiceAdminCxC/" + id,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setInvoiceAdmin", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getChargeMonth({ commit }, id) {
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getChargeMonth",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setMonth", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getChargeYear({ commit }, id) {
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getChargeYear",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setYear", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getListaPagosXProveedorCxP({ commit }, id) {
      let data = {
        id_proveedor: id,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getListaPagosXProveedorCxP?id_proveedor=${id}&id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "Content-Type": "application/json",
        },
        // params: data,
      };
      await axios(config)
        .then(function (response) {
          let res = response.data;
          if (!!res.estadoflag) {
            commit("_setListPagosXProveedorCxP", res.data);
          } else {
            commit("_setListPagosXProveedorCxP", []);
            Swal.fire({
              icon: "warning",
              title: "Advertencia",
              text: response.data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getListaPagosXProveedorCxC({ commit }, id) {
      commit("_setListPagosXProveedorCxP", []);
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + `getListaPagosXProveedorCxC/${id}`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          if (!!response.data.statusBol) {
            let data = response.data.data;
            let index = 0;
            data.forEach((element) => {
              element.index = index;
              element.tipocambio = element.tipocambio ?? 1;
              element.id_coins = element.id_coins ?? 1;
              index++;
            });
            commit("_setListPagosXProveedorCxP", data);
          } else {
            var vm = this;
            Swal.fire({
              icon: "warning",
              title: "Advertencia",
              text: response.data.mensaje,
            });
            // alert(response.data.mensaje);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    //ZONE ADD DATA
    async cargarProveedores({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "CargarProveedores?id_branch=" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("_setProveedores", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async cargarClientes({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "CargarClientes?id_branch=" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          // console.log(response)
          commit("_setClientes", response.data.data);
          // vm.dataList = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async cargarBranch({ commit }) {
      let vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "CargarBranch/" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user,

        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config).then(function (response) {
        if (response.data.statusBol == true) {
          commit("SET_BRANCH", response.data.data);
        }
      });
    },
    atras() {
      router.go(-1);
    },
    async getListBanksDetailsCargar({ commit }) {
      let vm = this;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getListBanksDetailsCargar",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("SET_CUENTAS", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async getListBanksDetailsCargarPorSucursal({ commit }) {
      let vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN + "getListBanksDetailsCargarPorSucursal",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          commit("SET_CUENTAS", response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getProveedorRolAgente({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `cargar_proveedor_rol_no_shipper?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setItemsProveedorRolAgente", response.data.data);
          } else {
            commit("_setItemsProveedorRolAgente", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getProveedorRolAerolinea({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `cargar_proveedor_x_rol?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&rol=AEROLINEA`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setItemsProveedorRolAerolinea", response.data.data);
          } else {
            commit("_setItemsProveedorRolAerolinea", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getProveedorRolColoader({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `cargar_proveedor_x_rol?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&rol=COLOADER`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setItemsProveedorRolColoader", response.data.data);
          } else {
            commit("_setItemsProveedorRolColoader", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getProveedorRolNaviera({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `cargar_proveedor_x_rol?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&rol=NAVIERA`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setItemsProveedorRolNaviera", response.data.data);
          } else {
            commit("_setItemsProveedorRolNaviera", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getProveedorRolShipper({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `cargar_proveedor_x_rol?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&rol=SHIPPER`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setItemsProveedorRolShipper", response.data.data);
          } else {
            commit("_setItemsProveedorRolShipper", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getComentariosPredefinidos({ commit }) {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getComentariosPredefinidos?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }`,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.estadoflag) {
            commit("_setItemsComentariosPredefinidos", response.data.data);
          } else {
            commit("_setItemsComentariosPredefinidos", []);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },

  modules: {
    reportes,
    entities,
    pricing,
    calculadoras,
    controlGastos,
    consolidacion,
    bancos,
    programaciones,
    files,
    balances,
    houses,
    proyecciones,
    monedas,
    masters,
    securitys,
    enterprises,
    masterusuarios,
    marketing,
    type_phone,
    document,
    year,
    sex,
    groupservices,
    incoterm,
    performance,
    bank,
    modality,
    transport,
    gastos,
    coins,
    ingresos,
    containers,
    shipment,
    multiplicador,
    airlines,
    QuoteStatus,
    puerto,
    motonave,
    states,
    city,
    town,
    begend,
    typepayment,
    subingreso,
    subgasto,
    itemServices,
    user,
    position,
    comentariosPredefinidos,
    configEmpresa,
    statushouse,
    configAviso,
    branch,
    aduana,
    proveedor,
    configuracion,
  },
});
