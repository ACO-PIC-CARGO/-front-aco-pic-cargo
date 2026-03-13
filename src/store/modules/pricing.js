import axios from "axios";
import Swal from "sweetalert2";
import miMixin from "../../components/mixins/funciones";
import moment from "moment";
import router from "@/router";
import masterusuario from "./masterusuario";
import enterprise from "./enterprise";
import modules from "./../index";
const state = {
  dataCliente: {},
  step: 1,
  nro_exp:'',
  preServices: [],
  preCostos: [],
  itemsDataRoleList: [],
  listadoResumen: [],
  listadoFilesDrive: [],
  selectedFile: [],
  actualizarCostosFlag: true,
  costoflag: false,
  impuestoflag: false,
  mostrarBtnActualizarFlag: true,
  bloquearBtnImprimir: true,
  vendedor: "",
  aprobadoflag: false,
  totalIngresos: 0,
  totalCostos: 0,
  totalIngresosAprobar: [],
  totalCostosAprobar: [],
  tiporeporte: "",
  abrirModalContenedor: false,
  index: 0,
  cantidadOpcionesSeleccionadas: 0,
  tab: 1,
  llenadoCostos: true,
  actualizarComparativa: false,
  mostrarGuardarCostos: false,
  actualizarNotas: false,
  cancelarLlenadoNuevaOpcion: false,
  recargarCostoSeleccionados: false,
  reCalcularOpciones: false,
  reset: false,
  namesection: [],
  page: 1,
  nombre_cotizacion: "",
  filtro: {
    id_marketing: "",
    id_status: "",
    id_entities: "",
    id_modality: "",
    id_shipment: "",
    id_incoterm: "",
    fechainicio: "",
    fechafin: "",
    estado: "activo",
  },
  filtroCalls: {
    id_marketing: "",
    id_status: "",
    id_entities: "",
    id_modality: "",
    id_shipment: "",
    id_incoterm: "",
    fechainicio: "",
    fechafin: "",
    estado: "activo",
  },
  ventaflag: false,
  dataQuote: null,
  filtrarQuoteFlag: false,
  filtrarCallsFlag: false,
  btnRegistrar: false,
  step2: false,
  step3: false,
  errfecha_fin: "",
  errtiempo_transito: "",
  id: "",
  nro_quote: "",
  urlFolder: "",
  mensaje: "",
  copy_quote: null,
  copylistServices: null,
  copylistCostos: null,
  copydatosPrincipales: {},
  datosPrincipales: {
    id_percepcionaduana: "",
    id_marketing: "",
    id_status: "",
    id_proveedor: "",
    id_vendedor: JSON.parse(sessionStorage.getItem("dataUser"))
      ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
      : "",
    id_pricing: JSON.parse(sessionStorage.getItem("dataUser"))
      ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
      : "",
    cif: "",
    contacto: "",
    descripcionMercancia: "",
    begEndList: "",
    ejecutivo_ventas: "",
    fecha_fin: "",
    fecha_inicio: "",
    fullflag: false,
    ganancia: 0,
    id: "",
    id_entitie: "",
    iddestino: "",
    idincoterms: "",
    idorigen: "",
    idsentido: "",
    idtipocarga: "",
    monto: "",
    nameStatusQuote: "",
    nombre: "",
    numerobultos: "",
    peso: "",
    volumen: "",
    quote: "",
    rangeDays: "",
    seguro: "",
    statusMain: "",
    statusQuote: "",
    telefono: "",
    proveedor: "",
    telefonoproveedor: "",
    tiempo_transito: "",
    direccionproveedor: "",
    containers: [],
    iddistrito: "",
    idprovincia: "",
    datosInstructivoManual: null,
  },
  opcionCostos: [
    {
      nro_propuesta: 1,
      date_end: "",
      tiempo_transito: 0,
      listCostos: [],
      listImpuestos: [],
      listNotasQuote: [],
      selected: false,
    },
  ],
  datosEmpresa: [],
  listQuotes: [],
  listCall: [],
  listMarketing: [],
  listQuoteStatus: [],
  listEjecutivo: [],
  listModality: [],
  listShipment: [],
  listIncoterms: [],
  listPortBegin: [],
  listPortEnd: [],
  listServices: [],
  listCostos: [],
  listMultiplicador: [],
  listRoles: [],
  errorValorMercancia: "",
  totalFlete: 0,
  listNotasQuote: [],
  totalCosto: 0,
  totalVenta: 0,
  listImpuestos: [],
  listInstructivo: [],
  listRecibidoCotizacion: [],
  listEnviadoCliente: [],
  listIngresosInstructivoAprobar: [],
  listCostosInstructivoAprobar: [],
  listServiciosInstructivo: [],
  listImpuestosInstructivoAprobar: [],
  listTipoCostos: [],
  listIngresosInstructivo: [],
  listCostosInstructivo: [],
  listImpuestosInstructivo: [],
  e1: 1,
  step: 1,
};

const mutations = {
  SET_RESET(state) {
    state.preServices = [];
    state.preCostos = [];
    state.itemsDataRoleList = [];
    state.listadoResumen = [];
    state.actualizarCostosFlag = true;
    state.costoflag = false;
    state.impuestoflag = false;
    state.mostrarBtnActualizarFlag = true;
    state.bloquearBtnImprimir = true;
    state.vendedor = "";
    state.aprobadoflag = false;
    state.totalIngresos = 0;
    state.totalCostos = 0;
    state.totalIngresosAprobar = [];
    state.totalCostosAprobar = [];
    state.tiporeporte = "";
    state.abrirModalContenedor = false;
    state.index = 0;
    state.cantidadOpcionesSeleccionadas = 0;
    state.tab = 1;
    state.llenadoCostos = true;
    state.actualizarComparativa = false;
    state.mostrarGuardarCostos = false;
    state.actualizarNotas = false;
    state.cancelarLlenadoNuevaOpcion = false;
    state.recargarCostoSeleccionados = false;
    state.reCalcularOpciones = false;
    state.reset = false;
    state.namesection = [];
    state.page = 1;
    state.filtro = {
      id_marketing: "",
      id_status: "",
      id_entities: "",
      id_modality: "",
      id_shipment: "",
      id_incoterm: "",
      fechainicio: "",
      fechafin: "",
      estado: "activo",
    };
    state.filtroCalls = {
      id_marketing: "",
      id_status: "",
      id_entities: "",
      id_modality: "",
      id_shipment: "",
      id_incoterm: "",
      fechainicio: "",
      fechafin: "",
      estado: "activo",
    };
    state.ventaflag = false;
    state.dataQuote = null;
    state.filtrarQuoteFlag = false;
    (state.filtrarCallsFlag = false),
      (state.btnRegistrar = false),
      (state.step2 = false),
      (state.step3 = false),
      (state.errfecha_fin = ""),
      (state.errtiempo_transito = ""),
      (state.id = ""),
      (state.nro_quote = ""),
      (state.urlFolder = ""),
      (state.mensaje = ""),
      (state.copy_quote = null);
    state.copylistServices = null;
    state.copylistCostos = null;
    state.copydatosPrincipales = {};
    state.datosPrincipales = {
      id_percepcionaduana: "",
      id_marketing: "",
      id_status: "",
      id_vendedor: JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
        : "",
      id_pricing: JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
        : "",
      cif: "",
      contacto: "",
      descripcionMercancia: "",
      begEndList: "",
      ejecutivo_ventas: "",
      fecha_fin: "",
      fecha_inicio: "",
      fullflag: false,
      ganancia: 0,
      id: "",
      id_entitie: "",
      iddestino: "",
      idincoterms: "",
      idorigen: "",
      idsentido: "",
      idtipocarga: "",
      monto: "",
      nameStatusQuote: "",
      nombre: "",
      numerobultos: "",
      peso: "",
      volumen: "",
      quote: "",
      rangeDays: "",
      seguro: "",
      statusMain: "",
      statusQuote: "",
      telefono: "",
      proveedor: "",
      telefonoproveedor: "",
      tiempo_transito: "",
      direccionproveedor: "",
      containers: [],
      iddistrito: "",
      idprovincia: "",
    };
    state.opcionCostos = [
      {
        nro_propuesta: 1,
        date_end: "",
        tiempo_transito: 0,
        listCostos: [],
        listImpuestos: [],
        listNotasQuote: [],
        selected: false,
      },
    ];
    state.datosEmpresa = [];
    state.listQuotes = [];
    state.listCall = [];
    state.listMarketing = [];
    state.listQuoteStatus = [];
    state.listEjecutivo = [];
    state.listModality = [];
    state.listShipment = [];
    state.listIncoterms = [];
    state.listPortBegin = [];
    state.listPortEnd = [];
    state.listServices = [];
    state.listCostos = [];
    state.listMultiplicador = [];
    state.listRoles = [];
    state.errorValorMercancia = "";
    state.totalFlete = 0;
    state.listNotasQuote = [];
    state.totalCosto = 0;
    state.totalVenta = 0;
    state.listImpuestos = [];
    state.listInstructivo = [];
    state.listRecibidoCotizacion = [];
    state.listEnviadoCliente = [];
    state.listIngresosInstructivoAprobar = [];
    state.listCostosInstructivoAprobar = [];
    state.listServiciosInstructivo = [];
    state.listImpuestosInstructivoAprobar = [];
    state.listTipoCostos = [];
    state.listIngresosInstructivo = [];
    state.listCostosInstructivo = [];
    state.listImpuestosInstructivo = [];
    state.e1 = 1;
    state.step = 1;
  },
  ACTUALIZAR_IMPUEST(state, data) {
    state.listImpuestos = data;
  },
  LISTADO_RESUMEN(state, data) {
    state.listadoResumen = data;
  },
  LISTADO_FILES_DRIVE(state, data) {
    state.listadoFilesDrive = data;
  },
  PRE_SERVICES(state, data) {
    state.preServices = data;
  },
  PRE_COSTOS(state, data) {
    state.preCostos = data;
  },
  SET_QUOTE(state) {
    state.opcionCostos = [
      {
        nro_propuesta: 1,
        date_end: "",
        tiempo_transito: 0,
        listCostos: [],
        listImpuestos: [],
        listNotasQuote: [],
        selected: false,
      },
    ];
    state.listServices = [];
    state.listCostos = [];
    state.btnRegistrar = false;
    state.step2 = false;
    state.step3 = false;
    state.datosPrincipales = {
      id_marketing: "",
      id_status: "",
      id_vendedor: JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
        : "",
      id_pricing: JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
        : "",
      cif: "",
      contacto: "",
      descripcionMercancia: "",

      ejecutivo_ventas: "",
      fecha_fin: "",
      fecha_inicio: "",
      fullflag: false,
      ganancia: 0,
      id: "",
      id_entitie: "",
      iddestino: "",
      idincoterms: "",
      idorigen: "",
      idsentido: "",
      idtipocarga: "",
      monto: "",
      nameStatusQuote: "",
      nombre: "",
      numerobultos: "",
      peso: "",
      volumen: "",
      quote: "",
      rangeDays: "",
      seguro: "",
      statusMain: "",
      statusQuote: "",
      telefono: "",
      proveedor: "",
      telefonoproveedor: "",
      tiempo_transito: "",
      direccionproveedor: "",
      containers: [],
      iddistrito: "",
      idprovincia: "",
    };
  },
  SET_CARGAR_LIST_RECIBIDO_COTIZACION(state, data) {
    state.listRecibidoCotizacion = data;
  },
  SET_DATA_QUOTE_NO_ASIGNDA(state, data) {
    state.dataQuote = data;
  },
  SET_CARGAR_LIST_ENVIADO_CLIENTE(state, data) {
    state.listEnviadoCliente = data;
  },
  SET_LIST_QUOTES(state, data) {
    state.listQuotes = data;
  },

  SET_CARGAR_NOTAS_COTIZACION(state, data) {
    state.listNotasQuote = data;
  },
  SET_LIST_CALLS(state, data) {
    state.listCall = data;
  },
  SET_LIST_MARKETING(state, data) {
    var sorted = (data || []).slice().sort(function (a, b) {
      var nameA = (a.name || "").toLowerCase();
      var nameB = (b.name || "").toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    state.listMarketing = sorted;
  },
  SET_LIST_QUOTE_STATUS(state, data) {
    state.listQuoteStatus = data;
  },
  SET_LIST_EJECUTIVO(state, data) {
    state.listEjecutivo = data;
  },
  SET_LIST_MODALITY(state, data) {
    state.listModality = data;
  },

  SET_LIST_SHIPMENT(state, data) {
    state.listShipment = data;
  },
  SET_LIST_INCOTERMS(state, data) {
    state.listIncoterms = data;
  },
  SET_LIST_PORT_BEGIN(state, data) {
    state.listPortBegin = data;
  },
  SET_LIST_PORT_END(state, data) {
    state.listPortEnd = data;
  },
  SET_LIST_SERVICES(state, data) {
    state.listServices = data;
    state.copylistServices = data;
  },
  SET_LIST_COSTES(state, data) {
    state.listCostos = data;
  },
  SET_STEP_3(state, data) {
    state.step3 = data;
  },
  SET_MULTPLICADOR(state, data) {
    state.listMultiplicador = data;
  },
  SET_ROLE(state, data) {
    state.listRoles = data;
  },
  SET_CARGAR_IMPUESTOS(state, data) {
    state.listImpuestos = data;
  },
  setInstructivo(state, data) {
    state.listInstructivo = data;
  },
  setbegEndList(state, data) {
    state.begEndList = data;
  },
  SET_TIPO_COSTOS(state, data) {
    state.listTipoCostos = data;
    state.namesection = data;
  },
};

const actions = {
  resetQuoteNew({ commit }) {
    commit("SET_QUOTE");
  },
  async quotePreviewInstructivoManual({ dispatch }, datos) {
    let config = {
      method: "put",
      url: `${process.env.VUE_APP_URL_MAIN}quote_preview_instructivo_manual`,
      data: datos,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config).then((response) => {
      if (!datos.guardarFlag) {
        window.open(
          `${process.env.VUE_APP_URL_MAIN}${response.data.path}`,
          // "",
          "_blank",
        );
      }
    });
  },
  async guardarDatosInstructivo({ dispatch }, datos) {
    let config = {
      method: "put",
      url: `${process.env.VUE_APP_URL_MAIN}actualizar_datos_instructivo_manual`,
      data: datos,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config).then((response) => {
      let data = response.data;
    });
  },
  async obtenerRoles({ commit, rootState }) {
    state.itemsDataRoleList = rootState.itemsDataRoleList;
  },
  async ListarMontosFinalesQuoteMONGODB({ commit }) {
    try {
      const config = {
        method: "get",
        url: `${process.env.VUE_APP_URL_MAIN}listar_montos_finales_quote`,
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };

      const response = await axios(config);
      const { estadoflag, token, data } = response.data;

      if (estadoflag) {
        sessionStorage.setItem("auth-token", token);

        const quotes = data.map((v) => ({
          ...v,
          code: v.expediente,
        }));

        commit("SET_LIST_QUOTES", quotes);
      }
    } catch (error) {
      console.error("Error al listar montos finales quote:", error);
    }
  },
  async getServices({ commit }) {
    let config = {
      method: "get",
      url: `${process.env.VUE_APP_URL_MAIN}obtener_servicio_pricing`,
      params: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag) {
        sessionStorage.setItem("auth-token", data.token);

        commit("PRE_SERVICES", data.data);
      }
    });
  },
  async getResumenPorEstado({ commit }) {
    let config = {
      method: "get",
      url: `${process.env.VUE_APP_URL_MAIN}resumen_por_estado`,
      params: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag) {
        sessionStorage.setItem("auth-token", data.token);

        commit("LISTADO_RESUMEN", data.data);
      }
    });
  },
  async getListQuote({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `getQuoteList?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_marketing=${
          state.filtro.id_marketing ? state.filtro.id_marketing : ""
        }&id_status=${
          state.filtro.id_status ? state.filtro.id_status : ""
        }&id_entities=${
          state.filtro.id_entities ? state.filtro.id_entities : ""
        }&id_modality=${
          state.filtro.id_modality ? state.filtro.id_modality : ""
        }&id_shipment=${
          state.filtro.id_shipment ? state.filtro.id_shipment : ""
        }&id_incoterm=${
          state.filtro.id_incoterm ? state.filtro.id_incoterm : ""
        }&fechainicio=${
          state.filtro.fechainicio ? state.filtro.fechainicio : ""
        }&fechafin=${
          state.filtro.fechafin ? state.filtro.fechafin : ""
        }&estado=${
          state.filtro.estado == "activo"
            ? 1
            : state.filtro.estado == "eliminado"
            ? 0
            : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          data = data.data.map((elemento, index) => {
            return { ...elemento, index };
          });
          commit("SET_LIST_QUOTES", data);
        } else {
          commit("SET_LIST_QUOTES", []);
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
  async getTipoCostos({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `tipo_costo_x_embarque?id_shipment=${
          state.datosPrincipales.idtipocarga.id
            ? state.datosPrincipales.idtipocarga.id
            : state.datosPrincipales.idtipocarga
        }&id_modality=${state.datosPrincipales.idsentido}`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        if (!!data.estadoflag) {
          commit("SET_TIPO_COSTOS", data.data);
        } else {
          commit("SET_TIPO_COSTOS", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getQuoteNoAsignadoHouse({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `quote_cargar_noasignadoshouse?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        if (!!data.estado) {
          commit("SET_LIST_QUOTES", data.data);
        } else {
          commit("SET_LIST_QUOTES", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getQuoteDataNoAsignadaHouse({ commit }, { id_quote = 0 }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + `quote_data_house?id_quote=${id_quote}`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        if (!!data.estadoflag) {
          commit("SET_DATA_QUOTE_NO_ASIGNDA", data.data[0]);
        } else {
          commit("SET_DATA_QUOTE_NO_ASIGNDA", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getQuoteCall({ commit }, filtro) {
    var data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      id_estado: filtro.id_estado,
      id_sentido: filtro.id_sentido,
      id_carga: filtro.id_carga,
      id_incoterms: filtro.id_incoterms,
      desde: filtro.desde,
      hasta: filtro.hasta,
    };

    let header = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listado_llamadas?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_marketing=${
          state.filtroCalls.id_marketing ? state.filtroCalls.id_marketing : ""
        }&id_status=${
          state.filtroCalls.id_status ? state.filtroCalls.id_status : ""
        }&id_entities=${
          state.filtroCalls.id_entities ? state.filtroCalls.id_entities : ""
        }&id_modality=${
          state.filtroCalls.id_modality ? state.filtroCalls.id_modality : ""
        }&id_shipment=${
          state.filtroCalls.id_shipment ? state.filtroCalls.id_shipment : ""
        }&id_incoterm=${
          state.filtroCalls.id_incoterm ? state.filtroCalls.id_incoterm : ""
        }&fechainicio=${
          state.filtroCalls.fechainicio ? state.filtroCalls.fechainicio : ""
        }&fechafin=${
          state.filtroCalls.fechafin ? state.filtroCalls.fechafin : ""
        }&estado=${
          typeof state.filtroCalls.estado === "string"
            ? state.filtroCalls.estado == "activo"
              ? 1
              : 0
            : ""
        }`,
      headers: header,
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_LIST_CALLS", data.data);
        } else {
          commit("SET_LIST_CALLS", []);
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
  async getMarketingList({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getMarketingList",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_MARKETING", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getQuoteStatus({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getQuoteStatus",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_QUOTE_STATUS", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getModulesEntities({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getModulesEntities",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_module: 6,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_EJECUTIVO", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getCargarEjecutivo({ commit }) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "cargar_ejecutivo",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      params: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_module: 6,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_EJECUTIVO", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getPersonalPricing({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "get_personal_pricing?id_branch=" +
        JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_EJECUTIVO", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getBegEndList({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getBegEndList",
      headers: headers,
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let valores = response.data.data;
        commit("setbegEndList", valores);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getModality({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getModality",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_MODALITY", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getShipment({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getShipment",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_SHIPMENT", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getIncoterms({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getIncoterms",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_INCOTERMS", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getPortBegin(
    { commit },
    { id_transport = 0, id = null, search = null },
  ) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getPortBegin",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_transport: id_transport,
        id: id,
        search: search,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_PORT_BEGIN", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getPortEnd({ commit }, { id_transport = 0, id = null, search = null }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getPortEnd",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_transport: id_transport,
        id: id,
        search: search,
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_LIST_PORT_END", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async getItemsServices({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getItemsServices",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,

        id_incoterms: state.datosPrincipales.idincoterms, // 5,
        id_modality: state.datosPrincipales.idsentido, //1,
        // id_shipment: state.datosPrincipales.,//1,
        id_shipment: state.datosPrincipales.idtipocarga.id
          ? state.datosPrincipales.idtipocarga.id
          : state.datosPrincipales.idtipocarga,
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        // let data = response.data.data;
        if (data.data) {
          commit("SET_LIST_SERVICES", data.data);
        } else {
          commit("SET_LIST_SERVICES", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async obtenerCostosPricing({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "obtener_costos_pricing",
      headers: headers,
      params: data,
    };
    await axios(config).then(function (response) {
      commit("PRE_COSTOS", response.data.data);
    });
  },
  async getItemsServicesDetails({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      id_incoterms: state.datosPrincipales.idincoterms, // 5,
      id_modality: state.datosPrincipales.idsentido, //1,
      // id_shipment: state.datosPrincipales.,//1,
      id_shipment: state.datosPrincipales.idtipocarga.id
        ? state.datosPrincipales.idtipocarga.id
        : state.datosPrincipales.idtipocarga,
      services: state.listServices.filter((v) => v.status == true),
      containers: state.datosPrincipales.containers,
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getItemsServicesDetails",
      headers: headers,
      data: data,
    };

    await axios(config).then(function (response) {
      let costes = [];
      let valores = response.data.data;
      if (valores) {
        valores.forEach((element) => {
          costes.push({
            id_groupservices: element.id_groupservices,
            id_incoterms: element.id_incoterms,
            id_modality: element.id_modality,
            id_multiplicador: element.id_multiplicador
              ? element.id_multiplicador
              : "N",
            id_services: element.id_services,
            id_shipment: element.id_shipment,
            namebegend: element.namebegend,
            namegroupservice: element.namegroupservice,
            namemultiplicador: element.namemultiplicador,
            namerole: element.namerole,
            costounitario: element.price ? element.price : 0,
            id: element.id,
            id_begend: element.id_begend,
            nameservice: element.nameservice,
            status: 1,
            id_role: element.id_role,
            statedelete: 0,
            servicioFlag: 1,
            costosflag: 0,
            cif: parseFloat(0.35),
            seguro: parseFloat(0.45),
            id_proveedor: element.id_proveedor ? element.id_proveedor : 0,
            esopcionflag: 1,
            esventaflag: 0,
            esorigenflag: element.esorigenflag == true ? 1 : 0,
            eslocalflag: element.eslocalflag == true ? 1 : 0,
            esaduanaflag: element.esaduanaflag == true ? 1 : 0,
            esalmacenflag: element.esalmacenflag == true ? 1 : 0,
            esfleteflag: element.esfleteflag == true ? 1 : 0,
            esgastostercerosflag: element.esgastostercerosflag == true ? 1 : 0,
            code_cost: element.code_cost,
          });
        });
        valores.forEach((element) => {
          costes.push({
            id_groupservices: element.id_groupservices,
            id_incoterms: element.id_incoterms,
            id_modality: element.id_modality,
            id_multiplicador: element.id_multiplicador
              ? element.id_multiplicador
              : "N",
            id_services: element.id_services,
            id_shipment: element.id_shipment,
            namebegend: element.namebegend,
            namegroupservice: element.namegroupservice,
            namemultiplicador: element.namemultiplicador,
            namerole: element.namerole,
            costounitario: 0,
            id: element.id,
            id_begend: element.id_begend,
            nameservice: element.nameservice,
            status: 1,
            id_role: element.id_role,
            statedelete: 0,
            servicioFlag: 1,
            costosflag: 0,
            cif: 0,
            seguro: 0,
            id_proveedor: element.id_proveedor ? element.id_proveedor : 0,
            esopcionflag: 0,
            esventaflag: 1,
            esorigenflag: element.esorigenflag == true ? 1 : 0,
            eslocalflag: element.eslocalflag == true ? 1 : 0,
            esaduanaflag: element.esaduanaflag == true ? 1 : 0,
            esalmacenflag: element.esalmacenflag == true ? 1 : 0,
            esfleteflag: element.esfleteflag == true ? 1 : 0,
            esgastostercerosflag: element.esgastostercerosflag == true ? 1 : 0,
            categoria_role: element.categoria_role,
            code_cost: element.code_cost,
          });
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "ADVERTENCIA",
          text: "No existen costos, para la combinación seleccionada de Sentido,Incoterms,Tipo de Embarque y la sucursal logueada.",
        });
      }
      commit(
        "SET_LIST_COSTES",
        costes.filter(
          (v) =>
            v.esorigenflag == 1 ||
            v.eslocalflag == 1 ||
            v.esaduanaflag == 1 ||
            v.esfleteflag == 1 ||
            v.esalmacenflag == 1 ||
            v.esgastostercerosflag == 1,
        ),
      );
    });
  },
  async getMultiplicador({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var data = {
      id_shipment: state.datosPrincipales.idtipocarga.id
        ? state.datosPrincipales.idtipocarga.id
        : state.datosPrincipales.idtipocarga,
      containers: state.datosPrincipales.containers
        ? state.datosPrincipales.containers
        : state.datosPrincipales.containers,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    //
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getMultiplicador",
      data: data,
      headers: headers,
    };
    await axios(config)
      .then(function (response) {
        let valores = [];
        response.data.data.forEach((element) => {
          valores.push({
            id: element.id,
            value: element.id,
            code: element.code,
            text: element.name,
            valor: element.valor ? element.valor : 0,
          });
        });

        commit("SET_MULTPLICADOR", valores);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getModuleRole({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var data = JSON.stringify({
      id_module: 6,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    });
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getModuleRole",
      headers: headers,
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let valores = [];
        response.data.data.forEach((element) => {
          valores.push({
            id: element.id,
            value: element.id_role,
            text: element.name,
            id_role: element.id_role,
          });
        });
        commit("SET_ROLE", valores);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getCargarMasterDetalleNotasCotizacion({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),

      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_notas_cotizacion?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag == true) {
        commit("SET_CARGAR_NOTAS_COTIZACION", response.data.data);
      } else {
        Swal.fire({
          icon: "error",
          text: data.mensaje,
        });
        commit("SET_CARGAR_NOTAS_COTIZACION", []);
      }
    });
  },
  async getImpuestos({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),

      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_impuesto?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    await axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag == true) {
        commit("SET_CARGAR_IMPUESTOS", response.data.data);
      } else {
        Swal.fire({
          icon: "error",
          text: data.mensaje,
        });
        commit("SET_CARGAR_IMPUESTOS", []);
      }
    });
  },
  async registrarQuote(__, { fullflag = true }) {
    let imp = state.listServices.filter(
      (v) => v.code_service == "15" && v.status == true,
    );
    let isFCL = state.listShipment.some(
      (v) =>
        v.id ==
          (state.datosPrincipales.idtipocarga.id
            ? state.datosPrincipales.idtipocarga.id
            : state.datosPrincipales.idtipocarga) && v.code == "FCL",
    );
    let opciones = [];
    await state.opcionCostos.forEach(async (opcionCosto) => {
      let costocotizacion = miMixin.methods.formatearCostos({
        costos: opcionCosto.listCostos,
        services: state.listServices,
        multiplicadores: state.listMultiplicador,
        datosPrincipales: state.datosPrincipales,
        totalDeFlete: state.totalFlete,
      });
      let notacosto = miMixin.methods.formatearNotas({
        notas: opcionCosto.listNotasQuote.filter((v) => v.estado == 1),
      });
      let impuestos =
        imp.length > 0
          ? miMixin.methods.formatImp({
              impuestos: opcionCosto.listImpuestos,
              datosPrincipales: state.datosPrincipales,
              totalFlete: state.totalFlete,
            })
          : [];
      opciones.push({
        nro_propuesta: opcionCosto.nro_propuesta,
        date_end: opcionCosto.date_end,
        tiempo_transito: opcionCosto.tiempo_transito,
        listCostos: costocotizacion,
        listImpuestos: impuestos,
        listNotasQuote: notacosto,
        selected: opcionCosto.selected,
      });
    });

    let data = {
      tiporeporte: state.tiporeporte ? state.tiporeporte : "TOTAL",
      id_percepcionaduana: state.datosPrincipales.id_percepcionaduana,
      fullflag: fullflag,
      id_marketing: state.datosPrincipales.id_marketing,
      statusquote: state.datosPrincipales.id_status,
      idVendedor: state.datosPrincipales.id_vendedor,
      id_proveedor: state.datosPrincipales.id_proveedor,
      idPricing: state.datosPrincipales.id_pricing,
      id_entitie: state.datosPrincipales.id_entitie,
      idsentido: state.datosPrincipales.idsentido,
      idtipocarga: state.datosPrincipales.idtipocarga.id
        ? state.datosPrincipales.idtipocarga.id
        : state.datosPrincipales.idtipocarga,
      idincoterms: state.datosPrincipales.idincoterms,
      proveedor: state.datosPrincipales.proveedor,
      telefonoproveedor: state.datosPrincipales.telefonoproveedor,
      direccionproveedor: state.datosPrincipales.direccionproveedor,
      idorigen: state.datosPrincipales.idorigen,
      iddestino: state.datosPrincipales.iddestino,
      numerobultos: !isFCL ? state.datosPrincipales.numerobultos : 0,
      peso: !isFCL ? state.datosPrincipales.peso : 0,
      volumen: !isFCL ? state.datosPrincipales.volumen : 0,
      contenedores: isFCL
        ? miMixin.methods.formatearContainer({
            containers: state.datosPrincipales.containers,
          })
        : [],
      serviciocotizacion: miMixin.methods.formatearServicios({
        services: state.listServices,
      }),
      monto: state.datosPrincipales.amount,

      iddistrito: state.datosPrincipales.iddistrito,
      idprovincia: state.datosPrincipales.idprovincia,

      descripcionMercancia: state.datosPrincipales.descripcioncarga
        ? state.datosPrincipales.descripcioncarga
        : "",
      ventascasillerodetalles: [],
      opcionCostos: opciones,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    //  console.log(data.costocotizacion);
    let config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "setQuote",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    // let vm = this;
    await axios(config).then(async (response) => {
      state.id = response.data.insertId;
      state.nro_quote = response.data.nro_quote;
      state.mensaje = response.data.msg;
      state.tiporeporte = "";
    });
  },
  async copiarQuote(__, { fullflag = true, id = null }) {
    let data = { id: id };
    //  console.log(data.costocotizacion);
    let config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "copiar_cotizacion",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    // let vm = this;
    await axios(config).then(async (response) => {
      state.id = response.data.data[0].insertid;
      state.nro_quote = response.data.data[0].nro_quote;
      state.mensaje = response.data.data[0].mensaje;
      state.tiporeporte = "";
    });
  },
  async crearCarpetaOneDrive(__, { nro_quote = "", nombre = "" }) {
    let folder = nro_quote + "-" + nombre;
    let config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `crear-carpeta-cotizacion?nombrecotizacion=${folder}`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await axios(config);
      // IMPORTANTE: Debes retornar el valor para que 'urlGenerada' tenga contenido
      return response.data.data;
    } catch (error) {
      console.error("Error en crearCarpetaOneDrive:", error);
      return null; // Retornamos null para manejar el error en la siguiente etapa
    }
  },
  async actualizarURLEnElQuote(__, { id = "", url = "" }) {
    let config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_quote_folderonedrive`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios(config).then(async (response) => {
      return response.data.data;
    });
  },
  async getQuote({ dispatch }, { id: id }) {
    let config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `getQuoteId?id=${id}`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config).then(async (response) => {
      let res = response.data.data[0];

      state.copy_quote = res;
      state.id = res.id;
      state.dataCliente = res.cliente[0];
      state.nro_quote = res.quote;
      state.datosPrincipales.id_marketing = res.id_marketing;
      state.datosPrincipales.id_status = res.id_status; //-------
      state.datosPrincipales.id_vendedor = res.id_vendedor;
      state.datosPrincipales.id_pricing = res.id_pricing;
      state.datosPrincipales.nombre = res.nombre;
      state.datosPrincipales.id_entitie = res.id_entitie;
      state.datosPrincipales.id_proveedor = res.id_proveedor;
      state.datosPrincipales.telefono = res.telefono;
      state.datosPrincipales.idsentido = res.idsentido;
      state.datosPrincipales.idtipocarga = res.idtipocarga;
      state.datosPrincipales.idincoterms = res.idincoterms;
      state.datosPrincipales.proveedor = res.proveedor;
      state.datosPrincipales.telefonoproveedor = res.telefonoproveedor;
      state.datosPrincipales.direccionproveedor = res.direccionproveedor;
      state.datosPrincipales.id_status = res.statusquote;
      state.datosPrincipales.nameStatusQuote = res.namestatusquote;
      state.datosPrincipales.descripcioncarga = res.descripcionmercancia;
      state.datosPrincipales.fecha_inicio = res.fecha_inicio;
      state.datosPrincipales.url_folderonedrive = res.url_folderonedrive;
      state.nro_exp = res.nro_exp
      state.datosPrincipales.datosinstructivomanual =
        res.datosinstructivomanual;
      // --------------------------------------------------------------
      state.datosPrincipales.iddestino = res.iddestino;
      state.datosPrincipales.idorigen = res.idorigen;
      state.datosPrincipales.numerobultos = res.numerobultos;
      state.datosPrincipales.peso = res.peso;
      state.datosPrincipales.volumen = res.volumen;
      // --------------------------------------------------------------
      state.listServices = res.servicios;
      state.copylistServices = res.servicios;
      state.datosPrincipales.amount = res.monto;
      // --------------------------------------------------------------
      state.opcionCostos = [];
      res.opcioncostos.forEach((element) => {
        state.opcionCostos.push({
          id: element.id,
          nro_propuesta: element.nro_propuesta,
          date_end: element.date_end,
          tiempo_transito: element.tiempo_transito,
          listCostos: element.listcostos,
          listImpuestos: element.listimpuestos,
          listNotasQuote: element.listnotasquote,
          selected: element.selected,
        });
      });

      // --------------------------------------------------------------

      state.datosPrincipales.containers = res.containers;
      state.aprobadoflag = res.aprobadoflag;
      state.fullflag = res.fullflag;
      state.tiporeporte = res.tiporeporte;
      state.datosPrincipales.id_percepcionaduana = res.id_percepcionaduana;
      state.mostrarBtnActualizarFlag = !(
        res.statusmain == 0 || res.aprobadoflag == true
      );
      dispatch("GetArchivos", res.url_folderonedrive);
    });
  },
  async getInstructivoId({ commit }, { id: id }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getInstructivoId/" + id,
      headers: headers,
      data: data,
    };
    await axios(config)
      .then(function (response) {
        commit("setInstructivo", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async obtenerDatosEmpresa() {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `getBranch/${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
      data: data,
    };
    await axios(config).then((res) => {
      let data = res.data.data;
      state.datosEmpresa = data;
    });
  },
  async generarReporte(
    __,
    { tipo = "", nro_propuesta = 0, guardarFlag = false },
  ) {
    let opcion = state.opcionCostos.filter(
      (v) => v.nro_propuesta == nro_propuesta,
    )[0];
    let totalFleteVentas = 0;
    let iso = JSON.parse(sessionStorage.getItem("iso_pais"));
    let TipoCostos = state.namesection.map((v) => ({
      name: v.name,
      codigo: v.codigo,
    }));
    let isImport = state.listModality.some(
      (v) => v.id == state.datosPrincipales.idsentido && v.code == "I",
    );
    let totalImpuesto = 0;
    let imp = [];
    let flete = [];
    let locales = [];
    let aduana = [];
    let almacen = [];
    let incluye = [];
    let noincluye = [];
    let importante = [];
    let contenedor = [];
    let totalSeguroCargaInterna = 0;
    // GENERALES
    /** AGRUPADO */
    let conceptos = [];
    /** !AGRUPADO */
    let datosFlete = [];
    let datosOrigen = [];
    let datosLocales = [];
    let datosAduanas = [];
    let datosAlmacenes = [];
    let datosGastosTerceros = [];
    // SON LOS COSTOS
    let totalFlete = 0;
    let totalOrigen = 0;
    let totalLocales = 0;
    let totalAduanas = 0;
    let totalAlmacenes = 0;
    let totalGastosTercero = 0;
    let isFlete = opcion.listCostos.some(
      (v) => v.esfleteflag == 1 && v.status == true && v.esventaflag == 1,
    );
    let isOrigen = opcion.listCostos.some(
      (v) => v.esorigenflag == 1 && v.status == true && v.esventaflag == 1,
    );

    let isLocal = opcion.listCostos.some(
      (v) => v.eslocalflag == 1 && v.status == true && v.esventaflag == 1,
    );
    let isAduana = opcion.listCostos.some(
      (v) => v.esaduanaflag == 1 && v.status == true && v.esventaflag == 1,
    );
    let isAlmacen = opcion.listCostos.some(
      (v) => v.esalmacenflag == 1 && v.status == true && v.esventaflag == 1,
    );
    let isGastosTercero = opcion.listCostos.some(
      (v) =>
        v.esgastostercerosflag == 1 && v.status == true && v.esventaflag == 1,
    );
    // ----------------------------------------------------------------
    /* contenedor*/

    state.datosPrincipales.containers.forEach((element) => {
      contenedor.push({
        name: element.description,
        valor: element.cantidad,
      });
    });
    // state.nombre_cotizacion = getNombreCotizacion(opcion.listNotasQuote);

    /** incluye - no incluye */
    state.listServices.forEach((element) => {
      if (element.status == 1) {
        incluye.push({
          name: element.service,
        });
      }
      if (element.status != 1) {
        noincluye.push({
          name: element.service,
        });
      }
    });

    opcion.listNotasQuote
      .filter((v) => v.estado == 1 && v.statusincluye == 1)
      .forEach((element) => {
        incluye.push({ name: element.descripcion });
      });

    opcion.listNotasQuote
      .filter((v) => v.estado == 1 && v.statusnoincluye == 1)
      .forEach((element) => {
        noincluye.push({ name: element.descripcion });
      });

    let ExisteSeguro = opcion.listCostos.some(
      (v) => v.code_cost == 15 && v.status == 1 && v.esventaflag == 1,
    );
    /* FLETE - LOCAL - ADUANA - ALMACEN - SERVICIOS SIEMPRE VENTAFLAG == 0*/
    state.listServices.forEach((element) => {
      if (element.codebegend == "OR") {
        flete.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
      if (element.codebegend == "FL") {
        locales.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
      if (element.codebegend == "DE") {
        aduana.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
      if (element.codebegend == "OP") {
        almacen.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
    });

    // Agregar TIEMPO DE TRÁNSITO mostrando los días en el nombre y conservando estado SI/NO
    if (opcion && opcion.tiempo_transito) {
      const diasTxt =
        String(opcion.tiempo_transito) +
        " " +
        (Number(opcion.tiempo_transito) === 1 ? "día" : "días");
      locales.push({
        name: "TIEMPO DE TRÁNSITO: " + diasTxt,
        estado: "SI",
      });
    }

    opcion.listNotasQuote
      .filter((v) => v.estado == 1)
      .forEach((element) => {
        importante.push({ name: element.descripcion });
      });
    totalFleteVentas = await calcularTotalFleteVentaPorOpcion(
      opcion.listCostos,
    );

    /* IMPUESTOS */
    if (state.listServices.some((v) => v.code_service == 15 && v.status == 1)) {
      let codeCalc = ["05", "06", "07", "08", "09", "10", "11", "12"];
      opcion.listImpuestos
        .filter((v) => codeCalc.includes(v.codigo))
        .forEach((element) => {
          imp.push({
            type: element.codigo,
            name: element.descripcion,
            percentage: element.codigo01,
            valor: miMixin.methods.calcularImpuestos({
              impuestos: opcion.listImpuestos,
              item: element,
              totalFlete: totalFleteVentas,
              datosPrincipales: state.datosPrincipales,
            }),
            // miMixin.methods.currencyFormat(element.valor),
          });

          // console.log("valor", element.valor);
          totalImpuesto += parseFloat(
            miMixin.methods.calcularImpuestos({
              impuestos: opcion.listImpuestos,
              item: element,
              totalFlete: totalFleteVentas,
              datosPrincipales: state.datosPrincipales,
            }),
          );
        });
    }

    if (tipo == "AGRUPADO") {
      opcion.listCostos
        .filter((v) => v.status == 1 && v.esventaflag == 1)
        .forEach((element) => {
          if (element.esfleteflag == 1) {
            datosFlete.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : 0
            ) {
              totalFlete +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalFlete += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.esorigenflag == 1) {
            datosOrigen.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : 0
            ) {
              totalOrigen +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalOrigen += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.eslocalflag == 1) {
            datosLocales.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              totalLocales +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalLocales += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.esaduanaflag == 1) {
            datosAduanas.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              totalAduanas +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalAduanas += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }

          if (element.esalmacenflag == 1) {
            datosAlmacenes.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              totalAlmacenes +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalAlmacenes += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.esgastostercerosflag == 1) {
            datosGastosTerceros.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              totalGastosTercero +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalGastosTercero += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
        });
      if (isFlete == true && isImport) {
        opcion.listCostos
          .filter(
            (v) => v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1,
          )
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isOrigen == true) {
        opcion.listCostos
          .filter(
            (v) => v.status == 1 && v.esorigenflag == 1 && v.esventaflag == 1,
          )
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isLocal == true) {
        opcion.listCostos
          .filter(
            (v) => v.status == 1 && v.eslocalflag == 1 && v.esventaflag == 1,
          )
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isAduana == true) {
        opcion.listCostos
          .filter(
            (v) => v.status == 1 && v.esaduanaflag == 1 && v.esventaflag == 1,
          )
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isFlete == true && !isImport) {
        opcion.listCostos
          .filter(
            (v) => v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1,
          )
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isAlmacen == true) {
        opcion.listCostos
          .filter(
            (v) => v.status == 1 && v.esalmacenflag == 1 && v.esventaflag == 1,
          )
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isGastosTercero == true) {
        opcion.listCostos
          .filter(
            (v) =>
              v.status == 1 &&
              v.esgastostercerosflag == 1 &&
              v.esventaflag == 1,
          )
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
    }
    if (tipo == "DETALLE") {
      opcion.listCostos
        .filter((v) => v.status == 1 && v.esventaflag == 1)
        .forEach((element) => {
          if (element.esfleteflag == 1) {
            if (
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              datosFlete.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].valor *
                    element.costounitario *
                    miMixin.methods.calcularFac(
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "N",
                      state.datosPrincipales.volumen,
                      state.datosPrincipales.peso,
                      state.datosPrincipales.containers,
                      state.datosPrincipales.amount,
                    ),
                ),
              });
              totalFlete +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              datosFlete.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  miMixin.methods.calcularValor(
                    state.datosPrincipales.amount,
                    totalFleteVentas,
                    state.listMultiplicador.some(
                      (v) => v.id == element.id_multiplicador,
                    )
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "",
                    state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13 || v.code == 5),
                    )
                      ? state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13),
                        )
                        ? element.cif
                        : element.seguro
                      : 0,
                  ),
                ),
              });
              totalFlete += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.esorigenflag == 1) {
            if (
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              datosOrigen.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].valor *
                    element.costounitario *
                    miMixin.methods.calcularFac(
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "N",
                      state.datosPrincipales.volumen,
                      state.datosPrincipales.peso,
                      state.datosPrincipales.containers,
                      state.datosPrincipales.amount,
                    ),
                ),
              });
              totalOrigen +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              datosOrigen.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  miMixin.methods.calcularValor(
                    state.datosPrincipales.amount,
                    totalFleteVentas,
                    state.listMultiplicador.some(
                      (v) => v.id == element.id_multiplicador,
                    )
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "",
                    state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13 || v.code == 5),
                    )
                      ? state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13),
                        )
                        ? element.cif
                        : element.seguro
                      : 0,
                  ),
                ),
              });
              totalOrigen += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }

          if (element.eslocalflag == 1) {
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              datosLocales.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                    element.costounitario *
                    miMixin.methods.calcularFac(
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "N",
                      state.datosPrincipales.volumen,
                      state.datosPrincipales.peso,
                      state.datosPrincipales.containers,
                      state.datosPrincipales.amount,
                    ),
                ),
              });
              totalLocales +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              datosLocales.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  miMixin.methods.calcularValor(
                    state.datosPrincipales.amount,
                    totalFleteVentas,
                    state.listMultiplicador.some(
                      (v) => v.id == element.id_multiplicador,
                    )
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "",
                    state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13 || v.code == 5),
                    )
                      ? state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13),
                        )
                        ? element.cif
                        : element.seguro
                      : 0,
                  ),
                ),
              });
              totalLocales += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }

          if (element.esaduanaflag == 1) {
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              datosAduanas.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                    element.costounitario *
                    miMixin.methods.calcularFac(
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "N",
                      state.datosPrincipales.volumen,
                      state.datosPrincipales.peso,
                      state.datosPrincipales.containers,
                      state.datosPrincipales.amount,
                    ),
                ),
              });
              totalAduanas +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              datosAduanas.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  miMixin.methods.calcularValor(
                    state.datosPrincipales.amount,
                    totalFleteVentas,
                    state.listMultiplicador.some(
                      (v) => v.id == element.id_multiplicador,
                    )
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "",
                    state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13 || v.code == 5),
                    )
                      ? state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13),
                        )
                        ? element.cif
                        : element.seguro
                      : 0,
                  ),
                ),
              });
              totalAduanas += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }

          if (element.esalmacenflag == 1) {
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              datosAlmacenes.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                    element.costounitario *
                    miMixin.methods.calcularFac(
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "N",
                      state.datosPrincipales.volumen,
                      state.datosPrincipales.peso,
                      state.datosPrincipales.containers,
                      state.datosPrincipales.amount,
                    ),
                ),
              });
              totalAlmacenes +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              datosAlmacenes.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  miMixin.methods.calcularValor(
                    state.datosPrincipales.amount,
                    totalFleteVentas,
                    state.listMultiplicador.some(
                      (v) => v.id == element.id_multiplicador,
                    )
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "",
                    state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13 || v.code == 5),
                    )
                      ? state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13),
                        )
                        ? element.cif
                        : element.seguro
                      : 0,
                  ),
                ),
              });
              totalAlmacenes += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.esgastostercerosflag == 1) {
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              datosGastosTerceros.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                    element.costounitario *
                    miMixin.methods.calcularFac(
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "N",
                      state.datosPrincipales.volumen,
                      state.datosPrincipales.peso,
                      state.datosPrincipales.containers,
                      state.datosPrincipales.amount,
                    ),
                ),
              });
              totalGastosTercero +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              datosGastosTerceros.push({
                name: element.nameservice,
                valor: miMixin.methods.currencyFormat(
                  miMixin.methods.calcularValor(
                    state.datosPrincipales.amount,
                    totalFleteVentas,
                    state.listMultiplicador.some(
                      (v) => v.id == element.id_multiplicador,
                    )
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "",
                    state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13 || v.code == 5),
                    )
                      ? state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13),
                        )
                        ? element.cif
                        : element.seguro
                      : 0,
                  ),
                ),
              });
              totalGastosTercero += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
        });
    }
    if (tipo == "TOTAL") {
      opcion.listCostos
        .filter((v) => v.status == 1 && v.esventaflag == 1)
        .forEach((element) => {
          if (element.esfleteflag == 1) {
            datosFlete.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              totalFlete +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalFlete += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.esorigenflag == 1) {
            datosOrigen.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              totalOrigen +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalOrigen += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }

          if (element.eslocalflag == 1) {
            datosLocales.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              totalLocales +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalLocales += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }

          if (element.esaduanaflag == 1) {
            datosAduanas.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 5 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 13 &&
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code != 14
                : false
            ) {
              totalAduanas +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalAduanas += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }

          if (element.esalmacenflag == 1) {
            datosAlmacenes.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              totalAlmacenes +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalAlmacenes += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
          if (element.esgastostercerosflag == 1) {
            datosGastosTerceros.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 5 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 13 &&
              state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].code != 14
            ) {
              totalGastosTercero +=
                (state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor
                  : 0) *
                element.costounitario *
                miMixin.methods.calcularFac(
                  state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "N",
                  state.datosPrincipales.volumen,
                  state.datosPrincipales.peso,
                  state.datosPrincipales.containers,
                  state.datosPrincipales.amount,
                );
            } else {
              totalGastosTercero += miMixin.methods.calcularValor(
                state.datosPrincipales.amount,
                totalFleteVentas,
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "",
                state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13 || v.code == 5),
                )
                  ? state.listMultiplicador.some(
                      (v) =>
                        v.id == element.id_multiplicador &&
                        (v.code == 14 || v.code == 13),
                    )
                    ? element.cif
                    : element.seguro
                  : 0,
              );
            }
          }
        });
    }
    let totalImpuestosIGV = 0;
    // ----------------------------------------------------------------

    if (isImport) {
      totalImpuestosIGV =
        ((parseFloat(isLocal == true ? totalLocales : 0) +
          parseFloat(isAduana == true ? totalAduanas : 0) +
          parseFloat(isAlmacen == true ? totalAlmacenes : 0) +
          parseFloat(isGastosTercero == true ? totalGastosTercero : 0)) *
          enterprise.state.impuesto.impuesto) /
        100;
    } else {
      totalImpuestosIGV =
        ((parseFloat(isOrigen == true ? totalOrigen : 0) +
          parseFloat(isLocal == true ? totalLocales : 0) +
          parseFloat(isAduana == true ? totalAduanas : 0) +
          parseFloat(isGastosTercero == true ? totalGastosTercero : 0)) *
          enterprise.state.impuesto.impuesto) /
        100;
    }

    // console.log(opcion.date_end);
    // console.log(opcion.tiempo_transito);
    // ----------------------------------------------------------------
    let totalServicios = 0;
    totalServicios =
      (isFlete == true ? totalFlete : 0) +
      (isOrigen == true ? totalOrigen : 0) +
      (isLocal == true ? totalLocales : 0) +
      (isAduana == true ? totalAduanas : 0) +
      (isAlmacen == true ? totalAlmacenes : 0) +
      (isGastosTercero == true ? totalGastosTercero : 0);
    /* GENERAR */
    let data = {
      guardarFlag: guardarFlag,
      url_folderonedrive: state.datosPrincipales.url_folderonedrive,
      nombre_cotizacion: state.nombre_cotizacion,
      nombre_impuesto: enterprise.state.impuesto.nombre_impuesto,
      impuesto: enterprise.state.impuesto.impuesto / 100,
      esunica: state.opcionCostos.filter((v) => v.selected).length == 1,
      url_logo: JSON.parse(sessionStorage.getItem("dataUser"))[0].path,
      TipoCostos: TipoCostos,
      index: nro_propuesta,
      isImport: isImport,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      code: state.nro_quote,
      business_name: state.datosEmpresa[0].business_name
        ? state.datosEmpresa[0].business_name
        : "",
      nameEmpresa: JSON.parse(sessionStorage.getItem("dataBranch"))[0]
        .trade_name,
      address: state.datosEmpresa[0].address,
      iso: state.datosEmpresa[0].iso_pais,
      iso_pais: state.datosEmpresa[0].iso_pais,
      pais: state.datosEmpresa[0].pais,
      document: state.datosEmpresa[0].document,
      phone: state.datosEmpresa[0].phone,
      tipo: tipo,
      cliente: state.datosPrincipales.nombre,
      slogancliente: state.datosPrincipales.slogan
        ? state.datosPrincipales.slogan
        : "",
      fechafin: opcion.date_end,
      tiempoTransito: opcion.tiempo_transito,
      origen:
        state.listPortBegin.filter(
          (v) => v.id_port == state.datosPrincipales.idorigen,
        ).length > 0
          ? state.listPortBegin.filter(
              (v) => v.id_port == state.datosPrincipales.idorigen,
            )[0].name
          : "",
      destino:
        state.listPortEnd.filter(
          (v) => v.id_port == state.datosPrincipales.iddestino,
        ).length > 0
          ? state.listPortEnd.filter(
              (v) => v.id_port == state.datosPrincipales.iddestino,
            )[0].name
          : "",
      impuesto:
        state.listServices.filter((v) => v.code_service == 15).length > 0
          ? state.listServices.filter((v) => v.code_service == 15)[0].status ==
              true ||
            state.listServices.filter((v) => v.code_service == 15)[0].status ==
              1
            ? imp
            : []
          : [],

      flete: flete,
      almacen: almacen,
      aduana: aduana,
      local: locales,
      totalImpuesto: miMixin.methods.currencyFormat(
        parseFloat(totalImpuesto).toFixed(2),
      ),
      incluye: incluye,
      noincluye: noincluye,
      importante: importante,
      contenedor: contenedor,
      conceptos: conceptos,
      numerobultos: state.datosPrincipales.numerobultos,
      peso: state.datosPrincipales.peso,
      volumen: state.datosPrincipales.volumen,
      sentido: state.listModality.filter(
        (v) => v.id == state.datosPrincipales.idsentido,
      )[0].name,
      embarque: state.listShipment.filter(
        (v) =>
          v.id ==
          (state.datosPrincipales.idtipocarga.id
            ? state.datosPrincipales.idtipocarga.id
            : state.datosPrincipales.idtipocarga),
      )[0].embarque,
      icoterm: state.listIncoterms.filter(
        (v) => v.id == state.datosPrincipales.idincoterms,
      )[0].name,
      //
      datosFlete: isFlete == true ? datosFlete : [],
      datosOrigen: isOrigen == true ? datosOrigen : [],
      datosLocales: isLocal == true ? datosLocales : [],
      datosAduanas: isAduana == true ? datosAduanas : [],
      datosAlmacenes: isAlmacen == true ? datosAlmacenes : [],
      datosGastosTerceros: isGastosTercero == true ? datosGastosTerceros : [],

      totalImpuestosIGV: miMixin.methods.currencyFormat(totalImpuestosIGV),
      //
      totalFlete:
        isFlete == true
          ? miMixin.methods.currencyFormat(totalFlete)
          : miMixin.methods.currencyFormat(0),
      totalOrigen:
        isOrigen == true
          ? miMixin.methods.currencyFormat(totalOrigen)
          : miMixin.methods.currencyFormat(0),
      totalLocales:
        isLocal == true
          ? miMixin.methods.currencyFormat(totalLocales)
          : miMixin.methods.currencyFormat(0),
      totalAduanas:
        isAduana == true
          ? miMixin.methods.currencyFormat(totalAduanas)
          : miMixin.methods.currencyFormat(0),
      totalAlmacenes:
        isAlmacen == true
          ? miMixin.methods.currencyFormat(totalAlmacenes)
          : miMixin.methods.currencyFormat(0),
      totalGastosTercero:
        isGastosTercero == true
          ? miMixin.methods.currencyFormat(totalGastosTercero)
          : miMixin.methods.currencyFormat(0),
      totalServicios: miMixin.methods.currencyFormat(totalServicios),

      total: miMixin.methods.currencyFormat(
        parseFloat(totalServicios) +
          parseFloat(totalImpuesto) +
          parseFloat(totalImpuestosIGV),
      ),
      amount: state.datosPrincipales.amount,
    };

    let headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    await axios
      .post(
        process.env.VUE_APP_URL_MAIN + "quote_preview_totales",
        data,
        headers,
      )
      .then((response) => {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: guardarFlag
            ? "Se ha guardado los archivos correctamente."
            : "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });
        if (!guardarFlag) {
          window.open(
            `${process.env.VUE_APP_URL_MAIN}${response.data.path}`,
            // "",
            "_blank",
          );
        }
      })
      .catch((e) => console.log(e));
  },
  async imprimiReporteListado(__, { filtro = [] }) {
    let filtros = {
      id_entities: state.filtro.id_entities,
      id_marketing: state.filtro.id_marketing,
      id_status: state.filtro.id_status,
      id_modality: state.filtro.id_modality,
      id_shipment: state.filtro.id_shipment,
      id_incoterm: state.filtro.id_incoterm,
      fechainicio: state.filtro.fechainicio,
      fechafin: state.filtro.fechafin,
      estado:
        state.filtro.estado == "activo"
          ? "1"
          : state.filtro.estado == "eliminado"
          ? "0"
          : "",
    };

    let headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    let data = {
      filtro: filtros,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    let timerInterval;
    Swal.fire({
      icon: "info",
      title: "Generando  PDF",
      text: "El PDF se descargará automaticamente",
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: null,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((res) => {
      if (res.dismiss) {
        clearInterval(timerInterval);
      }
    });

    await axios
      .post(process.env.VUE_APP_URL_MAIN + "export_list_quote", data, headers)
      .then((response) => {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });

        window.open(
          `${process.env.VUE_APP_URL_MAIN}${response.data.path}`,
          // "",
          "_blank",
        );
      })
      .catch((e) => console.log(e));
  },
  async exportarExcelListadoQuote(__, { filtro = {} }) {
    let filtros = {
      id_entities: state.filtro.id_entities,
      id_marketing: state.filtro.id_marketing,
      id_status: state.filtro.id_status,
      id_modality: state.filtro.id_modality,
      id_shipment: state.filtro.id_shipment,
      id_incoterm: state.filtro.id_incoterm,
      fechainicio: state.filtro.fechainicio,
      fechafin: state.filtro.fechafin,
      estado:
        state.filtro.estado == "activo"
          ? "1"
          : state.filtro.estado == "eliminado"
          ? "0"
          : "",
    };
    let headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer",
    };
    let data = {
      filtro: filtros,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };

    let url = process.env.VUE_APP_URL_MAIN + "export_list_quote_xls";
    await axios.post(url, data, headers).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // let name = this.uuidv4();
      link.setAttribute(
        "download",
        `Reporte de Cotizaciones ${moment().format(
          "DD-MM-YYYY hh:mm:ss",
        )}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      // this.previewFlag = false;
      // this.generandoFlag = false;
    });
  },
  async imprimirMercadeo() {
    let filtros = {
      id_entities: state.filtro.id_entities ? state.filtro.id_entities : "",
      id_marketing: state.filtro.id_marketing ? state.filtro.id_marketing : "",
      id_status: state.filtro.id_status ? state.filtro.id_status : "",
      id_modality: state.filtro.id_modality ? state.filtro.id_modality : "",
      id_shipment: state.filtro.id_shipment ? state.filtro.id_shipment : "",
      id_incoterm: state.filtro.id_incoterm ? state.filtro.id_incoterm : "",
      fechainicio: state.filtro.fechainicio ? state.filtro.fechainicio : "",
      fechafin: state.filtro.fechafin ? state.filtro.fechafin : "",
      estado:
        state.filtro.estado == "activo"
          ? "1"
          : state.filtro.estado == "eliminado"
          ? "0"
          : "",
    };

    let headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    let data = {
      filtro: filtros,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    let timerInterval;
    Swal.fire({
      icon: "info",
      title: "Generando  PDF",
      text: "El PDF se descargará automaticamente",
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: null,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((res) => {
      if (res.dismiss) {
        clearInterval(timerInterval);
      }
    });
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "listado_cotizacion_mercadeo",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        filtro: filtros,
      },
    };

    await axios(config)
      .then((response) => {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });
        if (response.data.estadoflag == true) {
          window.open(
            `${process.env.VUE_APP_URL_MAIN}${response.data.path}`,
            // "",
            "_blank",
          );
        } else {
          Swal.fire({
            icon: "warning",
            title: "Advertencia",
            text: response.data.msg,
          });
        }
      })
      .catch((e) => console.log(e));
  },
  async imprimiReporteListadoCalls(__, { filtro = [] }) {
    let headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer",
    };
    let data = {
      filtro: filtro,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    await axios
      .post(
        process.env.VUE_APP_URL_REPORT + "reporte_llamadas_export",
        data,
        headers,
      )
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        // let name = this.uuidv4();
        link.setAttribute(
          "download",
          `Reporte de Cotizaciones ${moment().format(
            "DD-MM-YYYY hh:mm:ss",
          )}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        this.loading2 = false;
      })
      .catch((e) => console.log(e));
  },

  async getListRecibidoCotizacion({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_recibido?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag == true) {
        commit("SET_CARGAR_LIST_RECIBIDO_COTIZACION", response.data.data);
      } else {
        // Swal.fire({
        //   icon: "error",
        //   text: data.mensaje,
        // });
        commit("SET_CARGAR_LIST_RECIBIDO_COTIZACION", []);
      }
    });
  },
  async getListEnviadoCliente({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_enviado?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag == true) {
        commit("SET_CARGAR_LIST_ENVIADO_CLIENTE", response.data.data);
      } else {
        // Swal.fire({
        //   icon: "error",
        //   text: data.mensaje,
        // });
        commit("SET_CARGAR_LIST_ENVIADO_CLIENTE", []);
      }
    });
  },
  async actualizarQuoteRecibidoEnviado(_, data) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `update_quote_recibido_enviado`,
      headers: headers,
      data: data,
    };
    axios(config).then((response) => {
      let data = response.data;

      Swal.fire({
        icon: data.estado == true ? "info" : "error",
        text: data.mensaje,
      });
    });
  },
  async guardarNotaQuote(__, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "setCalls",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config).catch(function (error) {
      console.log(error);
    });
  },
  async updateQuote() {
    let imp = state.listServices.filter(
      (v) => v.code_service == "15" && v.status == true,
    );
    let opciones = [];
    await state.opcionCostos.forEach(async (opcionCosto) => {
      let costocotizacion = miMixin.methods.formatearCostosEditar({
        costos: opcionCosto.listCostos,
        services: state.listServices,
        multiplicadores: state.listMultiplicador,
        datosPrincipales: state.datosPrincipales,
        totalDeFlete: state.totalFlete,
      });
      let notacosto = miMixin.methods.formatearNotas({
        notas: opcionCosto.listNotasQuote.filter((v) => v.estado == 1),
      });
      let impuestos =
        imp.length > 0
          ? miMixin.methods.formatImp({
              impuestos: opcionCosto.listImpuestos,
              datosPrincipales: state.datosPrincipales,
              totalFlete: state.totalFlete,
            })
          : [];
      opciones.push({
        id: opcionCosto.id,
        nro_propuesta: opcionCosto.nro_propuesta,
        date_end: opcionCosto.date_end,
        tiempo_transito: opcionCosto.tiempo_transito,
        listCostos: costocotizacion,
        listImpuestos: impuestos,
        listNotasQuote: notacosto,
        selected: opcionCosto.selected,
      });
    });
    let data = {
      tiporeporte: state.tiporeporte ? state.tiporeporte : "TOTAL",
      id_percepcionaduana: state.datosPrincipales.id_percepcionaduana,
      id: state.id,
      id_quote: state.id,
      fullflag: true,
      id_marketing: state.datosPrincipales.id_marketing,
      statusquote: state.datosPrincipales.id_status,
      id_proveedor: state.datosPrincipales.id_proveedor,
      idVendedor: state.datosPrincipales.id_vendedor,
      idPricing: state.datosPrincipales.id_pricing,
      id_entitie: state.datosPrincipales.id_entitie,
      idsentido: state.datosPrincipales.idsentido,
      idtipocarga: state.datosPrincipales.idtipocarga.id
        ? state.datosPrincipales.idtipocarga.id
        : state.datosPrincipales.idtipocarga,
      idincoterms: state.datosPrincipales.idincoterms,
      proveedor: state.datosPrincipales.proveedor,
      telefonoproveedor: state.datosPrincipales.telefonoproveedor,
      direccionproveedor: state.datosPrincipales.direccionproveedor,
      idorigen: state.datosPrincipales.idorigen,
      iddestino: state.datosPrincipales.iddestino,
      numerobultos: state.datosPrincipales.numerobultos,
      peso: state.datosPrincipales.peso,
      volumen: state.datosPrincipales.volumen,
      tiempo_transito: state.datosPrincipales.tiempo_transito,
      contenedores: miMixin.methods.formatearContainer({
        containers: state.datosPrincipales.containers,
      }),
      serviciocotizacion: miMixin.methods.formatearServicios({
        services: state.listServices,
      }),
      monto: state.datosPrincipales.amount,

      iddistrito: state.datosPrincipales.iddistrito,
      idprovincia: state.datosPrincipales.idprovincia,

      descripcionMercancia: state.datosPrincipales.descripcioncarga
        ? state.datosPrincipales.descripcioncarga
        : "",
      opcionCostos: opciones,
    };
    let config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "putQuote",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    // let vm = this;
    await axios(config).then(async (response) => {
      let data = response.data;

      Swal.fire({
        icon: "info",
        text: data.mensaje,
      });
    });
  },
  async eliminarRegistro(__, id) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `delQuote`,
      headers: headers,
      data: { id: id },
    };
    axios(config).then((response) => {
      let data = response.data;
    });
  },

  async predata(__, { tipo = "" }) {
    return new Promise(async (resolve, reject) => {
      let iso = JSON.parse(sessionStorage.getItem("iso_pais"));
      let TipoCostos = state.namesection.map((v) => ({
        name: v.name,
        codigo: v.codigo,
      }));
      let isImport = state.listModality.some(
        (v) => v.id == state.datosPrincipales.idsentido && v.code == "I",
      );
      let totalImpuesto = 0;
      let imp = [];
      let flete = [];
      let locales = [];
      let aduana = [];
      let almacen = [];
      let incluye = [];
      let noincluye = [];
      let OpcionesSelecciondas = [];
      let importante = [];
      let contenedor = [];
      let totalSeguroCargaInterna = 0;
      let totalFleteVentas = 0;
      // GENERALES
      /** AGRUPADO */
      let conceptos = [];
      /** !AGRUPADO */
      let datosFlete = [];
      let datosOrigen = [];
      let datosLocales = [];
      let datosAduanas = [];
      let datosAlmacenes = [];
      let datosGastosTerceros = [];
      // SON LOS COSTOS
      let totalFlete = 0;
      let totalOrigen = 0;
      let totalLocales = 0;
      let totalAduanas = 0;
      let totalAlmacenes = 0;
      let totalGastosTercero = 0;

      // ----------------------------------------------------------------
      /* contenedor*/

      state.datosPrincipales.containers.forEach((element) => {
        contenedor.push({
          name: element.description,
          valor: element.cantidad,
        });
      });

      /** incluye - no incluye */
      state.listServices.forEach((element) => {
        if (element.status == 1) {
          incluye.push({
            name: element.service,
          });
        }
        if (element.status != 1) {
          noincluye.push({
            name: element.service,
          });
        }
      });
      /*  let ExisteSeguro = state.listCostos.some(
        (v) => v.code_cost == 15 && v.status == 1 && v.esventaflag == 1
      );
/
      /* NOTAS DE QUOTE - INCLU */

      state.listServices.forEach((element) => {
        if (element.codebegend == "OR") {
          flete.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
        if (element.codebegend == "FL") {
          locales.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
        if (element.codebegend == "DE") {
          aduana.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
        if (element.codebegend == "OP") {
          almacen.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
      });
      state.opcionCostos
        .filter((v) => v.selected)
        .forEach((opcionCosto) => {
          setTimeout(async () => {
            importante = [];
            imp = [];
            datosFlete = [];
            datosOrigen = [];
            datosLocales = [];
            datosAduanas = [];
            datosAlmacenes = [];
            datosGastosTerceros = [];
            conceptos = [];
            totalFlete = 0;
            totalOrigen = 0;
            totalLocales = 0;
            totalAduanas = 0;
            totalAlmacenes = 0;
            totalGastosTercero = 0;
            totalImpuesto = 0;
            totalFleteVentas = await calcularTotalFleteVentaPorOpcion(
              opcionCosto.listCostos,
            );
            let totalServicios = 0;

            //  NOTAS
            opcionCosto.listNotasQuote
              .filter((v) => v.estado == 1)
              .forEach((element) => {
                importante.push({ name: element.descripcion });
              });
            // impuestos
            if (
              state.listServices.some(
                (v) => v.code_service == 15 && v.status == 1,
              )
            ) {
              let codeCalc = ["05", "06", "07", "08", "09", "10", "11", "12"];
              opcionCosto.listImpuestos
                .filter((v) => codeCalc.includes(v.codigo))
                .forEach((element) => {
                  imp.push({
                    type: element.codigo,
                    name: element.descripcion,
                    percentage: element.codigo01,
                    valor: miMixin.methods.calcularImpuestos({
                      impuestos: opcionCosto.listImpuestos,
                      item: element,
                      totalFlete: totalFleteVentas,
                      datosPrincipales: state.datosPrincipales,
                    }),
                    // miMixin.methods.currencyFormat(element.valor),
                  });

                  // console.log("valor", element.valor);
                  totalImpuesto += parseFloat(
                    miMixin.methods.calcularImpuestos({
                      impuestos: opcionCosto.listImpuestos,
                      item: element,
                      totalFlete: totalFleteVentas,
                      datosPrincipales: state.datosPrincipales,
                    }),
                  );
                });
            }
            //  costos
            let isFlete = opcionCosto.listCostos.some(
              (v) =>
                v.esfleteflag == 1 && v.status == true && v.esventaflag == 1,
            );
            let isOrigen = opcionCosto.listCostos.some(
              (v) =>
                v.esorigenflag == 1 && v.status == true && v.esventaflag == 1,
            );

            let isLocal = opcionCosto.listCostos.some(
              (v) =>
                v.eslocalflag == 1 && v.status == true && v.esventaflag == 1,
            );
            let isAduana = opcionCosto.listCostos.some(
              (v) =>
                v.esaduanaflag == 1 && v.status == true && v.esventaflag == 1,
            );
            let isAlmacen = opcionCosto.listCostos.some(
              (v) =>
                v.esalmacenflag == 1 && v.status == true && v.esventaflag == 1,
            );
            let isGastosTercero = opcionCosto.listCostos.some(
              (v) =>
                v.esgastostercerosflag == 1 &&
                v.status == true &&
                v.esventaflag == 1,
            );

            if (tipo == "AGRUPADO") {
              // state.listCostos
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  if (element.esfleteflag == 1) {
                    datosFlete.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : 0
                    ) {
                      totalFlete +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalFlete += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.esorigenflag == 1) {
                    datosOrigen.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : 0
                    ) {
                      totalOrigen +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalOrigen += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.eslocalflag == 1) {
                    datosLocales.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      totalLocales +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalLocales += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.esaduanaflag == 1) {
                    datosAduanas.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      totalAduanas +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalAduanas += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }

                  if (element.esalmacenflag == 1) {
                    datosAlmacenes.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      totalAlmacenes +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalAlmacenes += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.esgastostercerosflag == 1) {
                    datosGastosTerceros.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      totalGastosTercero +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalGastosTercero += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                });
              if (isFlete == true && isImport) {
                opcionCosto.listCostos
                  .filter(
                    (v) =>
                      v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1,
                  )
                  .forEach((element) => {
                    if (
                      conceptos.filter((v) => v.name == element.nameservice)
                    ) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isOrigen == true) {
                opcionCosto.listCostos
                  .filter(
                    (v) =>
                      v.status == 1 &&
                      v.esorigenflag == 1 &&
                      v.esventaflag == 1,
                  )
                  .forEach((element) => {
                    if (
                      conceptos.filter((v) => v.name == element.nameservice)
                    ) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }

              if (isLocal == true) {
                opcionCosto.listCostos
                  .filter(
                    (v) =>
                      v.status == 1 && v.eslocalflag == 1 && v.esventaflag == 1,
                  )
                  .forEach((element) => {
                    if (
                      conceptos.filter((v) => v.name == element.nameservice)
                    ) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isAduana == true) {
                opcionCosto.listCostos
                  .filter(
                    (v) =>
                      v.status == 1 &&
                      v.esaduanaflag == 1 &&
                      v.esventaflag == 1,
                  )
                  .forEach((element) => {
                    if (
                      conceptos.filter((v) => v.name == element.nameservice)
                    ) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isFlete == true && !isImport) {
                opcionCosto.listCostos
                  .filter(
                    (v) =>
                      v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1,
                  )
                  .forEach((element) => {
                    if (
                      conceptos.filter((v) => v.name == element.nameservice)
                    ) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }

              if (isAlmacen == true) {
                opcionCosto.listCostos
                  .filter(
                    (v) =>
                      v.status == 1 &&
                      v.esalmacenflag == 1 &&
                      v.esventaflag == 1,
                  )
                  .forEach((element) => {
                    if (
                      conceptos.filter((v) => v.name == element.nameservice)
                    ) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isGastosTercero == true) {
                opcionCosto.listCostos
                  .filter(
                    (v) =>
                      v.status == 1 &&
                      v.esgastostercerosflag == 1 &&
                      v.esventaflag == 1,
                  )
                  .forEach((element) => {
                    if (
                      conceptos.filter((v) => v.name == element.nameservice)
                    ) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
            }
            if (tipo == "DETALLE") {
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  if (element.esfleteflag == 1) {
                    if (
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      datosFlete.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].valor *
                            element.costounitario *
                            miMixin.methods.calcularFac(
                              state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              ).length > 0
                                ? state.listMultiplicador.filter(
                                    (v) => v.id == element.id_multiplicador,
                                  )[0].code
                                : "N",
                              state.datosPrincipales.volumen,
                              state.datosPrincipales.peso,
                              state.datosPrincipales.containers,
                              state.datosPrincipales.amount,
                            ),
                        ),
                      });
                      totalFlete +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      datosFlete.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          miMixin.methods.calcularValor(
                            state.datosPrincipales.amount,
                            totalFleteVentas,
                            state.listMultiplicador.some(
                              (v) => v.id == element.id_multiplicador,
                            )
                              ? state.listMultiplicador.filter(
                                  (v) => v.id == element.id_multiplicador,
                                )[0].code
                              : "",
                            state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 5),
                            )
                              ? state.listMultiplicador.some(
                                  (v) =>
                                    v.id == element.id_multiplicador &&
                                    (v.code == 14 || v.code == 13),
                                )
                                ? element.cif
                                : element.seguro
                              : 0,
                          ),
                        ),
                      });
                      totalFlete += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.esorigenflag == 1) {
                    if (
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      datosOrigen.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].valor *
                            element.costounitario *
                            miMixin.methods.calcularFac(
                              state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              ).length > 0
                                ? state.listMultiplicador.filter(
                                    (v) => v.id == element.id_multiplicador,
                                  )[0].code
                                : "N",
                              state.datosPrincipales.volumen,
                              state.datosPrincipales.peso,
                              state.datosPrincipales.containers,
                              state.datosPrincipales.amount,
                            ),
                        ),
                      });
                      totalOrigen +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      datosOrigen.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          miMixin.methods.calcularValor(
                            state.datosPrincipales.amount,
                            totalFleteVentas,
                            state.listMultiplicador.some(
                              (v) => v.id == element.id_multiplicador,
                            )
                              ? state.listMultiplicador.filter(
                                  (v) => v.id == element.id_multiplicador,
                                )[0].code
                              : "",
                            state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 5),
                            )
                              ? state.listMultiplicador.some(
                                  (v) =>
                                    v.id == element.id_multiplicador &&
                                    (v.code == 14 || v.code == 13),
                                )
                                ? element.cif
                                : element.seguro
                              : 0,
                          ),
                        ),
                      });
                      totalOrigen += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }

                  if (element.eslocalflag == 1) {
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      datosLocales.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          (state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].valor
                            : 0) *
                            element.costounitario *
                            miMixin.methods.calcularFac(
                              state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              ).length > 0
                                ? state.listMultiplicador.filter(
                                    (v) => v.id == element.id_multiplicador,
                                  )[0].code
                                : "N",
                              state.datosPrincipales.volumen,
                              state.datosPrincipales.peso,
                              state.datosPrincipales.containers,
                              state.datosPrincipales.amount,
                            ),
                        ),
                      });
                      totalLocales +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      datosLocales.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          miMixin.methods.calcularValor(
                            state.datosPrincipales.amount,
                            totalFleteVentas,
                            state.listMultiplicador.some(
                              (v) => v.id == element.id_multiplicador,
                            )
                              ? state.listMultiplicador.filter(
                                  (v) => v.id == element.id_multiplicador,
                                )[0].code
                              : "",
                            state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 5),
                            )
                              ? state.listMultiplicador.some(
                                  (v) =>
                                    v.id == element.id_multiplicador &&
                                    (v.code == 14 || v.code == 13),
                                )
                                ? element.cif
                                : element.seguro
                              : 0,
                          ),
                        ),
                      });
                      totalLocales += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }

                  if (element.esaduanaflag == 1) {
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      datosAduanas.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          (state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].valor
                            : 0) *
                            element.costounitario *
                            miMixin.methods.calcularFac(
                              state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              ).length > 0
                                ? state.listMultiplicador.filter(
                                    (v) => v.id == element.id_multiplicador,
                                  )[0].code
                                : "N",
                              state.datosPrincipales.volumen,
                              state.datosPrincipales.peso,
                              state.datosPrincipales.containers,
                              state.datosPrincipales.amount,
                            ),
                        ),
                      });
                      totalAduanas +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      datosAduanas.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          miMixin.methods.calcularValor(
                            state.datosPrincipales.amount,
                            totalFleteVentas,
                            state.listMultiplicador.some(
                              (v) => v.id == element.id_multiplicador,
                            )
                              ? state.listMultiplicador.filter(
                                  (v) => v.id == element.id_multiplicador,
                                )[0].code
                              : "",
                            state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 5),
                            )
                              ? state.listMultiplicador.some(
                                  (v) =>
                                    v.id == element.id_multiplicador &&
                                    (v.code == 14 || v.code == 13),
                                )
                                ? element.cif
                                : element.seguro
                              : 0,
                          ),
                        ),
                      });
                      totalAduanas += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }

                  if (element.esalmacenflag == 1) {
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      datosAlmacenes.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          (state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].valor
                            : 0) *
                            element.costounitario *
                            miMixin.methods.calcularFac(
                              state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              ).length > 0
                                ? state.listMultiplicador.filter(
                                    (v) => v.id == element.id_multiplicador,
                                  )[0].code
                                : "N",
                              state.datosPrincipales.volumen,
                              state.datosPrincipales.peso,
                              state.datosPrincipales.containers,
                              state.datosPrincipales.amount,
                            ),
                        ),
                      });
                      totalAlmacenes +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      datosAlmacenes.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          miMixin.methods.calcularValor(
                            state.datosPrincipales.amount,
                            totalFleteVentas,
                            state.listMultiplicador.some(
                              (v) => v.id == element.id_multiplicador,
                            )
                              ? state.listMultiplicador.filter(
                                  (v) => v.id == element.id_multiplicador,
                                )[0].code
                              : "",
                            state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 5),
                            )
                              ? state.listMultiplicador.some(
                                  (v) =>
                                    v.id == element.id_multiplicador &&
                                    (v.code == 14 || v.code == 13),
                                )
                                ? element.cif
                                : element.seguro
                              : 0,
                          ),
                        ),
                      });
                      totalAlmacenes += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.esgastostercerosflag == 1) {
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      datosGastosTerceros.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          (state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].valor
                            : 0) *
                            element.costounitario *
                            miMixin.methods.calcularFac(
                              state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              ).length > 0
                                ? state.listMultiplicador.filter(
                                    (v) => v.id == element.id_multiplicador,
                                  )[0].code
                                : "N",
                              state.datosPrincipales.volumen,
                              state.datosPrincipales.peso,
                              state.datosPrincipales.containers,
                              state.datosPrincipales.amount,
                            ),
                        ),
                      });
                      totalGastosTercero +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      datosGastosTerceros.push({
                        name: element.nameservice,
                        valor: miMixin.methods.currencyFormat(
                          miMixin.methods.calcularValor(
                            state.datosPrincipales.amount,
                            totalFleteVentas,
                            state.listMultiplicador.some(
                              (v) => v.id == element.id_multiplicador,
                            )
                              ? state.listMultiplicador.filter(
                                  (v) => v.id == element.id_multiplicador,
                                )[0].code
                              : "",
                            state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13 || v.code == 5),
                            )
                              ? state.listMultiplicador.some(
                                  (v) =>
                                    v.id == element.id_multiplicador &&
                                    (v.code == 14 || v.code == 13),
                                )
                                ? element.cif
                                : element.seguro
                              : 0,
                          ),
                        ),
                      });
                      totalGastosTercero += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                });
            }
            if (tipo == "TOTAL") {
              
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  if (element.esfleteflag == 1) {
                    datosFlete.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      totalFlete +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalFlete += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.esorigenflag == 1) {
                    datosOrigen.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      totalOrigen +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalOrigen += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }

                  if (element.eslocalflag == 1) {
                    datosLocales.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      totalLocales +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalLocales += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }

                  if (element.esaduanaflag == 1) {
                    datosAduanas.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      ).length > 0
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 5 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 13 &&
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code != 14
                        : false
                    ) {
                      totalAduanas +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalAduanas += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }

                  if (element.esalmacenflag == 1) {
                    datosAlmacenes.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      totalAlmacenes +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalAlmacenes += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                  if (element.esgastostercerosflag == 1) {
                    datosGastosTerceros.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 5 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 13 &&
                      state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code != 14
                    ) {
                      totalGastosTercero +=
                        (state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].valor
                          : 0) *
                        element.costounitario *
                        miMixin.methods.calcularFac(
                          state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          ).length > 0
                            ? state.listMultiplicador.filter(
                                (v) => v.id == element.id_multiplicador,
                              )[0].code
                            : "N",
                          state.datosPrincipales.volumen,
                          state.datosPrincipales.peso,
                          state.datosPrincipales.containers,
                          state.datosPrincipales.amount,
                        );
                    } else {
                      totalGastosTercero += miMixin.methods.calcularValor(
                        state.datosPrincipales.amount,
                        totalFleteVentas,
                        state.listMultiplicador.some(
                          (v) => v.id == element.id_multiplicador,
                        )
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "",
                        state.listMultiplicador.some(
                          (v) =>
                            v.id == element.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 5),
                        )
                          ? state.listMultiplicador.some(
                              (v) =>
                                v.id == element.id_multiplicador &&
                                (v.code == 14 || v.code == 13),
                            )
                            ? element.cif
                            : element.seguro
                          : 0,
                      );
                    }
                  }
                });
            }
            // ----------------------------------------------------------------
            totalServicios =
              (isFlete == true ? totalFlete : 0) +
              (isOrigen == true ? totalOrigen : 0) +
              (isLocal == true ? totalLocales : 0) +
              (isAduana == true ? totalAduanas : 0) +
              (isAlmacen == true ? totalAlmacenes : 0) +
              (isGastosTercero == true ? totalGastosTercero : 0);

            let totalImpuestosIGV = 0;
            // ----------------------------------------------------------------

            if (!!isImport) {
              totalImpuestosIGV =
                ((parseFloat(isLocal == true ? totalLocales : 0) +
                  parseFloat(isAduana == true ? totalAduanas : 0) +
                  parseFloat(isAlmacen == true ? totalAlmacenes : 0) +
                  parseFloat(
                    isGastosTercero == true ? totalGastosTercero : 0,
                  )) *
                  enterprise.state.impuesto.impuesto) /
                100;
            } else {
              totalImpuestosIGV =
                ((parseFloat(isOrigen == true ? totalOrigen : 0) +
                  parseFloat(isLocal == true ? totalLocales : 0) +
                  parseFloat(isAduana == true ? totalAduanas : 0) +
                  parseFloat(
                    isGastosTercero == true ? totalGastosTercero : 0,
                  )) *
                  enterprise.state.impuesto.impuesto) /
                100;
            }

            let total = miMixin.methods.currencyFormat(
              parseFloat(totalServicios) +
                parseFloat(totalImpuesto) +
                parseFloat(totalImpuestosIGV),
            );

            OpcionesSelecciondas.push({
              nro_propuesta: opcionCosto.nro_propuesta,
              date_end: opcionCosto.date_end,
              tiempo_transito: opcionCosto.tiempo_transito,
              importante: importante,
              impuesto: imp,
              datosFlete: isFlete == true ? datosFlete : [],
              datosOrigen: isOrigen == true ? datosOrigen : [],
              datosLocales: isLocal == true ? datosLocales : [],
              datosAduanas: isAduana == true ? datosAduanas : [],
              datosAlmacenes: isAlmacen == true ? datosAlmacenes : [],
              datosGastosTerceros:
                isGastosTercero == true ? datosGastosTerceros : [],
              totalImpuestosIGV:
                miMixin.methods.currencyFormat(totalImpuestosIGV),
              totalImpuesto: miMixin.methods.currencyFormat(
                parseFloat(totalImpuesto).toFixed(2),
              ),
              total: total,
              totalFlete:
                isFlete == true
                  ? miMixin.methods.currencyFormat(totalFlete)
                  : miMixin.methods.currencyFormat(0),
              totalOrigen:
                isOrigen == true
                  ? miMixin.methods.currencyFormat(totalOrigen)
                  : miMixin.methods.currencyFormat(0),
              totalLocales:
                isLocal == true
                  ? miMixin.methods.currencyFormat(totalLocales)
                  : miMixin.methods.currencyFormat(0),
              totalAduanas:
                isAduana == true
                  ? miMixin.methods.currencyFormat(totalAduanas)
                  : miMixin.methods.currencyFormat(0),
              totalAlmacenes:
                isAlmacen == true
                  ? miMixin.methods.currencyFormat(totalAlmacenes)
                  : miMixin.methods.currencyFormat(0),
              totalGastosTercero:
                isGastosTercero == true
                  ? miMixin.methods.currencyFormat(totalGastosTercero)
                  : miMixin.methods.currencyFormat(0),
              conceptos: conceptos,
              totalServicios: miMixin.methods.currencyFormat(totalServicios),
              listServices: state.listServices,
              listNotasQuote: opcionCosto.listNotasQuote,
            });
          }, 10);
        });

      /* FLETE - LOCAL - ADUANA - ALMACEN - SERVICIOS SIEMPRE VENTAFLAG == 0*/

      /* IMPUESTOS */

      // ----------------------------------------------------------------

      /* GENERAR */

      let data = {
        TipoCostos: TipoCostos,
        isImport: state.listModality.some(
          (v) => v.id == state.datosPrincipales.idsentido && v.code == "I",
        ),
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        code: "########",
        business_name: state.datosEmpresa[0].business_name
          ? state.datosEmpresa[0].business_name
          : "",
        address: state.datosEmpresa[0].address,
        iso: state.datosEmpresa[0].iso_pais,
        iso_pais: state.datosEmpresa[0].iso_pais,
        pais: state.datosEmpresa[0].pais,
        document: state.datosEmpresa[0].document,
        phone: state.datosEmpresa[0].phone,
        tipo: tipo,
        cliente: state.datosPrincipales.nombre,
        slogancliente: state.datosPrincipales.slogan
          ? state.datosPrincipales.slogan
          : "",
        fechafin: state.datosPrincipales.fecha_fin,
        tiempoTransito: state.datosPrincipales.tiempo_transito,
        origen:
          state.listPortBegin.filter(
            (v) => v.id_port == state.datosPrincipales.idorigen,
          ).length > 0
            ? state.listPortBegin.filter(
                (v) => v.id_port == state.datosPrincipales.idorigen,
              )[0].name
            : "",
        destino:
          state.listPortEnd.filter(
            (v) => v.id_port == state.datosPrincipales.iddestino,
          ).length > 0
            ? state.listPortEnd.filter(
                (v) => v.id_port == state.datosPrincipales.iddestino,
              )[0].name
            : "",

        flete: flete,
        almacen: almacen,
        aduana: aduana,
        local: locales,
        // totalImpuesto: miMixin.methods.currencyFormat(
        //   parseFloat(totalImpuesto).toFixed(2)
        // ),
        incluye: incluye,
        noincluye: noincluye,
        importante: importante,
        contenedor: contenedor,
        conceptos: conceptos,
        numerobultos: state.datosPrincipales.numerobultos,
        peso: state.datosPrincipales.peso,
        volumen: state.datosPrincipales.volumen,
        sentido: state.listModality.filter(
          (v) => v.id == state.datosPrincipales.idsentido,
        )[0].name,
        embarque: state.listShipment.filter(
          (v) =>
            v.id ==
            (state.datosPrincipales.idtipocarga.id
              ? state.datosPrincipales.idtipocarga.id
              : state.datosPrincipales.idtipocarga),
        )[0].embarque,
        icoterm: state.listIncoterms.filter(
          (v) => v.id == state.datosPrincipales.idincoterms,
        )[0].name,

        OpcionesSelecciondas: OpcionesSelecciondas,
      };
      setTimeout(() => {
        resolve(data);
      }, 1000);
    });
  },
  validarCosto() {
    let val = true;
    let cost = state.listCostos.filter((v) => v.esopcionflag == 1);
    cost.forEach((element) => {
      let res = actions.validateCost({ costo: element });
      if (res == false) {
        val = false;
        element.error = "El costo que tiene un valor 0.00.";
      } else {
        element.error = "";
      }
    });
    return val;
  },
  validateCost({ costo }) {
    let service = state.listServices.filter((v) => v.status == 1);
    let multiplocadores = state.listMultiplicador.filter((v) => {
      return actions.comienzaNoConCaracter(v.text, "%");
    });
    let idMultiplicador = multiplocadores.map((v) => v.id);
    let idServices = service.map((v) => v.id_groupservices);
    if (
      !(
        idMultiplicador.includes(costo.id_multiplicador) &&
        idServices.includes(costo.id_groupservices) &&
        costo.costounitario == 0
      )
    ) {
      return true;
    } else {
      return false;
    }
  },
  async aprobarCotizacion({ dispatch }, dataParaAprobar) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "aprobar_cotizacion",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: dataParaAprobar,
    };
    await axios(config).then(async (res) => {
      let data = res.data;
      const name =
        data.data[0].code_master + " - " + state.datosPrincipales.nombre;
      let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
        .id_branch;
      let id_branchs = ["1", "2", 1, 2];
      if (
        dataParaAprobar.nuevoexpediente == true &&
        id_branchs.includes(id_branch)
      ) {
        await dispatch("guardarCarpetaHouse", {
          nroMaster: name,
          id: data.data[0].id_master,
          idSelectedFile: state.selectedFile.map((v) => v.id),
        });
      }
      Swal.fire({
        icon: data.estadoflag == true ? "success" : "error",
        title: "Aviso",
        text: res.data.mensaje,
        timerProgressBar: true,
        allowOutsideClick: false,
        confirmButtonText: "Ir al control de gastos",
        // cancelButtonText: "Enviar Correos",
        denyButtonText: "Cerrar",
        // showCancelButton: true,
        showConfirmButton: true,
        showDenyButton: true,
        confirmButtonColor: "#004D40",
        denyButtonColor: "#DD2C00",
      }).then((res) => {
        if (res.isConfirmed) {
          router.push({
            name: "editControlGasto",
            params: {
              id: data.data[0].id_master,
              id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
                .id_branch,
            },
          });
        }
        if (res.isDenied) {
          window.location.reload();
        }
      });
    });
  },
  comienzaNoConCaracter(nombre, caracter) {
    return nombre.charAt(0).toUpperCase() !== caracter.toUpperCase();
  },
  comienzaConCaracter(nombre, caracter) {
    return nombre.charAt(0).toUpperCase() === caracter.toUpperCase();
  },
  generaInstructivo({ dispatch }) {
    // -------------------------------------------------------
    state.listServiciosInstructivo = [];

    state.listServices.forEach((element) => {
      state.listServiciosInstructivo.push({
        name: element.service,
        status: element.status == true ? "SI" : "NO",
      });
    });

    state.vendedor = state.listEjecutivo.filter(
      (v) => v.id_entitie == state.datosPrincipales.id_pricing,
    )[0].name;
    // console.log(state.opcionCostos)
    GenerarIngresosInstrictivo(state.tiporeporte);
    GenerarCostosInstrictivo(state.tiporeporte);
    GenerarImpInstructivo();
  },
  async generaInstructivoparaguardata({ dispatch }) {
    state.listIngresosInstructivoAprobar = [];

    let isImport = state.listModality.some(
      (v) => v.id == state.datosPrincipales.idsentido && v.code == "I",
    );
    let totalFleteVentas = 0;
    let igvIngresos = 0;
    let totalImpuestosIGV = 0;
    let montoIngresos = 0;
    let totalIngresos = 0;
    let igvCostos = 0;
    let montoCostos = 0;
    let totalCostos = 0;
    let sentido = state.listInstructivo[0].sentido;
    state.vendedor = state.listEjecutivo.filter(
      (v) => v.id_entitie == state.datosPrincipales.id_pricing,
    )[0].name;

    const opcionesSeleccionadas = state.opcionCostos.filter(
      (v) => !!v.selected,
    );

    for (const opcion of opcionesSeleccionadas) {
      let igvIngresos = 0;
      let totalImpuestosIGV = 0;
      let montoIngresos = 0;
      let totalIngresos = 0;
      let igvCostos = 0;
      let montoCostos = 0;
      let totalCostos = 0;
      let dataIngresos = [];
      let dataCostos = [];
      totalFleteVentas = await calcularTotalFleteVentaPorOpcion(
        opcion.listCostos,
      );
      opcion.listCostos
        .filter((v) => v.esventaflag == 1 && v.status == 1)
        .forEach((element) => {
          let orden = 1;
          let name = "";

          // ------------------------------------

          let montoDetails = 0;
          let codePorcentaje = [5, 13, 14];
          if (
            state.listMultiplicador.some(
              (v) => v.id == element.id_multiplicador,
            )
              ? state.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    !codePorcentaje.includes(v.code),
                )
              : false
          ) {
            montoDetails +=
              (state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].valor
                : 0) *
              element.costounitario *
              miMixin.methods.calcularFac(
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "N",
                state.datosPrincipales.volumen,
                state.datosPrincipales.peso,
                state.datosPrincipales.containers,
                state.datosPrincipales.amount,
              );
          } else {
            montoDetails += miMixin.methods.calcularValor(
              state.datosPrincipales.amount,
              totalFleteVentas,
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code
                : "",
              state.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }

          // Creando el agrupamiento
          if (element.esfleteflag == 1 && isImport) {
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "FL")[0].name
                : "";
            orden = 1;
          }
          if (element.esorigenflag == 1) {
            if (!isImport) {
              totalImpuestosIGV += parseFloat(montoDetails);
            }
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "OR")[0].name
                : "";
            orden = 2;
          }
          if (element.eslocalflag == 1) {
            //
            totalImpuestosIGV += parseFloat(montoDetails);
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "LO")[0].name
                : "";
            orden = 3;
          }
          if (element.esaduanaflag == 1) {
            totalImpuestosIGV += parseFloat(montoDetails);
            orden = 4;
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "AD")[0].name
                : "";
          }
          if (element.esfleteflag == 1 && !isImport) {
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "FL")[0].name
                : "";
            orden = 5;
          }
          if (element.esalmacenflag == 1) {
            if (isImport) {
              totalImpuestosIGV += parseFloat(montoDetails);
            }
            orden = 6;
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "AL")[0].name
                : "";
          }
          dataIngresos.push({
            descripcion: name,
            service: element.nameservice,
            valor: montoDetails,
            orden: orden,
            igv: 0,
            total: montoDetails,
          });

          igvIngresos += parseFloat(0);
          montoIngresos += parseFloat(montoDetails);
          totalIngresos += parseFloat(montoDetails);
        });

      opcion.listCostos
        .filter((v) => v.esopcionflag == 1 && v.status == 1)
        .forEach((element) => {
          let orden = 1;
          let name = "";
          // Creando el agrupamiento
          if (element.esfleteflag == 1 && isImport) {
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "FL")[0].name
                : "";
            orden = 1;
          }
          if (element.esorigenflag == 1) {
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "OR")[0].name
                : "";
            orden = 2;
          }
          if (element.eslocalflag == 1) {
            // totalImpuestosIGV += montoDetails;
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "LO")[0].name
                : "";
            orden = 3;
          }
          if (element.esaduanaflag == 1) {
            // totalImpuestosIGV += montoDetails;
            orden = 4;
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "AD")[0].name
                : "";
          }
          if (element.esfleteflag == 1 && !isImport) {
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "FL")[0].name
                : "";
            orden = 5;
          }
          if (element.esalmacenflag == 1) {
            // totalImpuestosIGV += montoDetails;
            orden = 6;
            name =
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "AL")[0].name
                : "";
          }
          // ------------------------------------

          let montoDetails = 0;
          if (
            state.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            ).length > 0
              ? state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              : false
          ) {
            montoDetails +=
              (state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].valor
                : 0) *
              element.costounitario *
              miMixin.methods.calcularFac(
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "N",
                state.datosPrincipales.volumen,
                state.datosPrincipales.peso,
                state.datosPrincipales.containers,
                state.datosPrincipales.amount,
              );
          } else {
            montoDetails += miMixin.methods.calcularValor(
              state.datosPrincipales.amount,
              totalFleteVentas,
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code
                : "",
              state.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
          const proveedorEncontrado = modules.state.provedores.find(
            (v) => v.id == element.id_proveedor,
          );
          dataCostos.push({
            proveedor: proveedorEncontrado ? proveedorEncontrado.namelong : "",
            service: element.nameservice,
            valor: montoDetails,
            orden: orden,
            igv: 0,
            total: montoDetails,
            id: proveedorEncontrado ? proveedorEncontrado.id : null,
          });
          igvCostos += 0;
          montoCostos += parseFloat(montoDetails);
          totalCostos += parseFloat(montoDetails);
        });

      dataIngresos = dataIngresos.sort((a, b) => {
        if (a.orden < b.orden) return -1;
        if (a.orden > b.orden) return 1;
      });
      // ------------------------------------------------ dataIngresos
      const resultIngresos = [];
      let currentProviderIngresos = null;
      let subvalorIngresos = 0;
      let subtotalIngresos = 0;
      let subigvIngresos = 0;

      for (const item of dataIngresos) {
        if (currentProviderIngresos === null) {
          currentProviderIngresos = item.descripcion;
          subvalorIngresos += item.valor;
          subtotalIngresos += item.total;
          subigvIngresos += 0;
        } else if (currentProviderIngresos === item.descripcion) {
          subvalorIngresos += item.valor;
          subtotalIngresos += item.total;
          subigvIngresos += 0;
        } else {
          // Agregar la fila de subtotal
          resultIngresos.push({
            descripcion: "SubTotal",
            service: "",
            valor: subvalorIngresos,
            igv: 0,
            total: subtotalIngresos,
          });

          // Reiniciar para el nuevo proveedor
          currentProviderIngresos = item.descripcion;
          subvalorIngresos = item.valor;
          subtotalIngresos = item.total;
          subigvIngresos = 0;
        }

        // Agregar el elemento actual
        resultIngresos.push(item);
      }
      resultIngresos.push({
        descripcion: "SubTotal",
        service: "",
        valor: subvalorIngresos,
        igv: 0,
        total: subtotalIngresos,
      });
      dataIngresos = resultIngresos;

      // ------------------------------------------------
      dataCostos = dataCostos.sort((a, b) => {
        if (a.proveedor < b.proveedor) return -1;
        if (a.proveedor > b.proveedor) return 1;
      });
      //---------------------------------------------------

      const result = [];
      let id = null;
      let currentProvider = null;
      let subtotal = 0;
      let valor = 0;
      let igv = 0;
      for (const item of dataCostos) {
        if (currentProvider === null) {
          id = item.id;
          currentProvider = item.proveedor;
          valor += item.valor;
          subtotal += item.total;
          igv += 0;
        } else if (currentProvider === item.proveedor) {
          id = item.id;
          valor += item.valor;
          subtotal += item.total;
          igv += 0;
        } else {
          // Agregar la fila de subtotal
          result.push({
            id: "",
            proveedor: "SubTotal",
            service: "",
            valor: valor,
            orden: 1,
            igv: 0,
            total: subtotal,
          });

          // Reiniciar para el nuevo proveedor

          currentProvider = item.proveedor;
          valor = item.valor;
          subtotal = item.total;
          igv = 0;
        }

        // Agregar el elemento actual
        result.push(item);
      }
      result.push({
        id: "",
        proveedor: "SubTotal",
        service: "",
        valor: valor,
        orden: 1,
        igv: "",
        total: subtotal,
      });
      dataCostos = result;
      //---------------------------------------------------
      let iso = JSON.parse(sessionStorage.getItem("iso_pais"));
      // console.log('totalImpuestosIGV',totalImpuestosIGV);
      dataIngresos.push({
        descripcion: `TOTAL`,
        valor: parseFloat(montoIngresos).toFixed(2),
        service: `Total sin ${
          enterprise.state.impuesto.nombre_impuesto
        } ${miMixin.methods.currencyFormat(
          parseFloat(totalIngresos).toFixed(2),
        )}     |      ${
          enterprise.state.impuesto.nombre_impuesto
        }: ${miMixin.methods.currencyFormat(
          parseFloat(
            (totalImpuestosIGV * enterprise.state.impuesto.impuesto) / 100,
          ).toFixed(2),
        )} `,
        igv: parseFloat(igvIngresos).toFixed(2),
        total:
          iso == 9589
            ? parseFloat(totalIngresos) +
              parseFloat(
                (totalImpuestosIGV * enterprise.state.impuesto.impuesto) / 100,
              )
            : parseFloat(totalIngresos),
      });
      dataCostos.push({
        proveedor: "TOTAL",
        valor: parseFloat(montoCostos).toFixed(2),
        igv: parseFloat(igvCostos).toFixed(2),
        total: parseFloat(montoCostos).toFixed(2),
      });
      //
      state.listIngresosInstructivoAprobar.push({
        nro_propuesta: opcion.nro_propuesta,
        dataIngresos: dataIngresos,
        nro_propuesta: opcion.nro_propuesta,
        dataCostos: dataCostos,
        totalIngresos: totalIngresos,
        totalCostos: totalCostos,
        dataVentas: dataIngresos,
      });
      // state.listCostosInstructivoAprobar.push({
      // });
      // state.totalIngresosAprobar.push({
      //   nro_propuesta: opcion.nro_propuesta,
      // });
      // state.totalCostosAprobar.push({
      //   nro_propuesta: opcion.nro_propuesta,
      // });
    }

    //
  },
  async imprimirInstructivoQuote({}, nro_propuesta) {
    let listIngresosInstructivo = state.listIngresosInstructivo.filter(
      (v) => v.nro_propuesta == nro_propuesta,
    )[0].opcion;
    let listCostosInstructivo = state.listCostosInstructivo.filter(
      (v) => v.nro_propuesta == nro_propuesta,
    )[0].opcion;
    let listImpuestosInstructivo = state.listImpuestosInstructivo.filter(
      (v) => v.nro_propuesta == nro_propuesta,
    )[0].opcion;
    let tipoimportacionaduana = state.datosPrincipales.id_percepcionaduana
      ? masterusuario.state.lstPercepcionAduana.length > 0
        ? masterusuario.state.lstPercepcionAduana.filter(
            (v) => v.id == state.datosPrincipales.id_percepcionaduana,
          )[0].descripcion
        : ""
      : "";
    let notas = state.listInstructivo[0].notas;

    let data = {
      nro_propuesta: nro_propuesta,
      tipoimportacionaduana: tipoimportacionaduana,
      containers: state.datosPrincipales.containers,
      numerobultos: state.datosPrincipales.numerobultos,
      peso: state.datosPrincipales.peso,
      volumen: state.datosPrincipales.volumen,
      totalIngresos: miMixin.methods.currencyFormat(
        parseFloat(state.totalIngresos).toFixed(2),
      ),
      totalCostos: miMixin.methods.currencyFormat(
        parseFloat(state.totalCostos).toFixed(2),
      ),
      profit: miMixin.methods.currencyFormat(
        parseFloat(state.totalIngresos).toFixed(2) -
          parseFloat(state.totalCostos).toFixed(2),
      ),
      sucursal: JSON.parse(sessionStorage.getItem("dataBranch"))[0].trade_name,
      status: state.listQuoteStatus.filter(
        (v) => v.id == state.datosPrincipales.id_status,
      )[0].name,
      code_house: state.listInstructivo[0].code_house
        ? state.listInstructivo[0].code_house
        : "",
      code_master: state.listInstructivo[0].code_master
        ? state.listInstructivo[0].code_master
        : "",
      notas: notas,
      expediente: state.listInstructivo[0].expediente,
      sentido: state.listInstructivo[0].sentido,
      carga: state.listInstructivo[0].carga,
      incoterms: state.listInstructivo[0].incoterms,
      nombre: state.datosPrincipales.nombre,
      direccion: state.listInstructivo[0].direccion,
      telefono: state.datosPrincipales.telefono,
      vendedor: state.vendedor,
      proveedor: state.listInstructivo[0].proveedor,
      origen: state.listInstructivo[0].origen,
      destino: state.listInstructivo[0].destino,
      fiscal: state.listInstructivo[0].fiscal,
      ruc: state.listInstructivo[0].ruc,
      listServiciosInstructivo: state.listServiciosInstructivo,
      listIngresosInstructivo: listIngresosInstructivo,
      listCostosInstructivo: listCostosInstructivo,
      listImpuestosInstructivo: listImpuestosInstructivo,
      aprobadoflag: state.aprobadoflag,
      url_logo: JSON.parse(sessionStorage.getItem("dataUser"))[0].path,
    };
    let headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    Swal.fire({
      icon: "info",
      title: "Generando  PDF",
      text: "El PDF se descargará automaticamente",
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: null,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((res) => {
      if (res.dismiss) {
        clearInterval(timerInterval);
      }
    });

    await axios
      .post(process.env.VUE_APP_URL_MAIN + "quote_instructivo", data, headers)
      .then((response) => {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });

        window.open(
          `${process.env.VUE_APP_URL_MAIN}${response.data.path}`,
          // "",
          "_blank",
        );
      })
      .catch((e) =>
        Swal.fire({
          icon: "error",
          title: "Ocurrió un error",
          text: e,
          showConfirmButton: true,
        }),
      );
  },
  async GuardaCostosFinalesQuote({ dispatch }) {
    await dispatch("generaInstructivoparaguardata");
    let listServiciosInstructivo = [];
    state.listServices.forEach((element) => {
      listServiciosInstructivo.push({
        name: element.service,
        status: element.status == true ? "SI" : "NO",
      });
    });
    // Validación defensiva: evitar errores cuando no se pudo generar la data
    if (
      !state.listIngresosInstructivoAprobar ||
      !state.listIngresosInstructivoAprobar.length ||
      !state.listIngresosInstructivoAprobar[0]
    ) {
      Swal.fire({
        icon: "error",
        title: "Ocurrió un error",
        text: "No se pudieron calcular los ingresos y costos del instructivo. Verifique que existan opciones seleccionadas y costos configurados.",
        showConfirmButton: true,
      });
      return;
    }
    let listIngresosInstructivo = [
      ...state.listIngresosInstructivoAprobar[0].dataIngresos,
    ];

    let listCostosInstructivo = [
      ...state.listIngresosInstructivoAprobar[0].dataCostos,
    ];

    let data = {
      id: state.id,
      expediente: state.listInstructivo[0].expediente,
      sentido: state.listInstructivo[0].sentido,
      carga: state.listInstructivo[0].carga,
      incoterms: state.listInstructivo[0].incoterms,
      nombre: state.datosPrincipales.nombre,
      direccion: state.listInstructivo[0].direccion,
      telefono: state.datosPrincipales.telefono,
      vendedor: state.vendedor,
      proveedor: state.listInstructivo[0].proveedor,
      origen: state.listInstructivo[0].origen,
      destino: state.listInstructivo[0].destino,
      fiscal: state.listInstructivo[0].fiscal,
      ruc: state.listInstructivo[0].ruc,
      listServiciosInstructivo: listServiciosInstructivo,
      listIngresosInstructivo: listIngresosInstructivo,
      listCostosInstructivo: listCostosInstructivo,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };

    let headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };

    await axios
      .post(
        process.env.VUE_APP_URL_MAIN + "insert_monto_finales_quote",
        data,
        headers,
      )
      .then((response) => {
        let res = response.data;
      })
      .catch((e) =>
        Swal.fire({
          icon: "error",
          title: "Ocurrió un error",
          text: e,
          showConfirmButton: true,
        }),
      );
  },

  async setNoteQuote({}, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "quote_note_insert",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let res = response.data;
        Swal.fire({
          icon: res.estadoflag == true ? "info" : "error",
          title: "Aviso",
          text: res.mensaje,
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async GetArchivos({ commit }, folderUrl) {
    
    let config = {
      method: "get",
      url: `${process.env.VUE_APP_URL_MAIN}listado_files`,
      params: {
        folderUrl: folderUrl,
      },
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag) {
        // sessionStorage.setItem("auth-token", data.token);

        commit("LISTADO_FILES_DRIVE", data.data);
      }
    });
  },
};

function GenerarIngresosInstrictivo(tipo) {
  let iso = JSON.parse(sessionStorage.getItem("iso_pais"));
  let isImport = state.listModality.some(
    (v) => v.id == state.datosPrincipales.idsentido && v.code == "I",
  );
  state.opcionCostos
    .filter((v) => !!v.selected)
    .forEach(async (opcion) => {
      let totalFleteVentas = 0;
      let isFlete = opcion.listCostos.some(
        (v) => v.esfleteflag == 1 && v.status == true,
      );
      let isOrigen = opcion.listCostos.some(
        (v) => v.esorigenflag == 1 && v.status == true,
      );
      let isLocal = opcion.listCostos.some(
        (v) => v.eslocalflag == 1 && v.status == true,
      );
      let isAduana = opcion.listCostos.some(
        (v) => v.esaduanaflag == 1 && v.status == true,
      );
      let isAlmacen = opcion.listCostos.some(
        (v) => v.esalmacenflag == 1 && v.status == true,
      );
      let isGastosTercero = opcion.listCostos.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true,
      );
      totalFleteVentas = await calcularTotalFleteVentaPorOpcion(
        opcion.listCostos,
      );
      /** AGRUPADO */
      let conceptos = [];
      /** !AGRUPADO */
      let datosFlete = [];
      let datosOrigen = [];
      let datosLocales = [];
      let datosAduanas = [];
      let datosAlmacenes = [];
      let datosGastosTerceros = [];
      // SON LOS COSTOS
      let totalFlete = 0;
      let totalOrigen = 0;
      let totalLocales = 0;
      let totalAduanas = 0;
      let totalAlmacenes = 0;
      let totalGastosTercero = 0;
      if (tipo == "AGRUPADO") {
        // state.listCostos
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (element.esfleteflag == 1) {
              datosFlete.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : 0
              ) {
                totalFlete +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalFlete += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esorigenflag == 1) {
              datosOrigen.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : 0
              ) {
                totalOrigen +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalOrigen += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.eslocalflag == 1) {
              datosLocales.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                totalLocales +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalLocales += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esaduanaflag == 1) {
              datosAduanas.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                totalAduanas +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalAduanas += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esalmacenflag == 1) {
              datosAlmacenes.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                totalAlmacenes +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalAlmacenes += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esgastostercerosflag == 1) {
              datosGastosTerceros.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                totalGastosTercero +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalGastosTercero += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          });
        if (isFlete == true) {
          opcion.listCostos
            .filter(
              (v) => v.status == 1 && v.esorigenflag == 1 && v.esventaflag == 1,
            )
            .forEach((element) => {
              if (conceptos.filter((v) => v.name == element.nameservice)) {
                conceptos.push({
                  name: element.nameservice,
                });
              }
            });
        }

        if (isLocal == true) {
          opcion.listCostos
            .filter(
              (v) => v.status == 1 && v.eslocalflag == 1 && v.esventaflag == 1,
            )
            .forEach((element) => {
              if (conceptos.filter((v) => v.name == element.nameservice)) {
                conceptos.push({
                  name: element.nameservice,
                });
              }
            });
        }
        if (isAduana == true) {
          opcion.listCostos
            .filter(
              (v) => v.status == 1 && v.esaduanaflag == 1 && v.esventaflag == 1,
            )
            .forEach((element) => {
              if (conceptos.filter((v) => v.name == element.nameservice)) {
                conceptos.push({
                  name: element.nameservice,
                });
              }
            });
        }
        if (isAlmacen == true) {
          opcion.listCostos
            .filter(
              (v) =>
                v.status == 1 && v.esalmacenflag == 1 && v.esventaflag == 1,
            )
            .forEach((element) => {
              if (conceptos.filter((v) => v.name == element.nameservice)) {
                conceptos.push({
                  name: element.nameservice,
                });
              }
            });
        }
        if (isGastosTercero == true) {
          opcion.listCostos
            .filter(
              (v) =>
                v.status == 1 &&
                v.esgastostercerosflag == 1 &&
                v.esventaflag == 1,
            )
            .forEach((element) => {
              if (conceptos.filter((v) => v.name == element.nameservice)) {
                conceptos.push({
                  name: element.nameservice,
                });
              }
            });
        }
      }
      if (tipo == "DETALLE") {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (element.esfleteflag == 1) {
              if (
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                datosFlete.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor *
                      element.costounitario *
                      miMixin.methods.calcularFac(
                        state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "N",
                        state.datosPrincipales.volumen,
                        state.datosPrincipales.peso,
                        state.datosPrincipales.containers,
                        state.datosPrincipales.amount,
                      ),
                  ),
                });
                totalFlete +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                datosFlete.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    miMixin.methods.calcularValor(
                      state.datosPrincipales.amount,
                      totalFleteVentas,
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "",
                      state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13 || v.code == 5),
                      )
                        ? state.listMultiplicador.some(
                            (v) =>
                              v.id == element.id_multiplicador &&
                              (v.code == 14 || v.code == 13),
                          )
                          ? element.cif
                          : element.seguro
                        : 0,
                    ),
                  ),
                });
                totalFlete += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esorigenflag == 1) {
              if (
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                datosOrigen.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].valor *
                      element.costounitario *
                      miMixin.methods.calcularFac(
                        state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "N",
                        state.datosPrincipales.volumen,
                        state.datosPrincipales.peso,
                        state.datosPrincipales.containers,
                        state.datosPrincipales.amount,
                      ),
                  ),
                });
                totalOrigen +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                datosOrigen.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    miMixin.methods.calcularValor(
                      state.datosPrincipales.amount,
                      totalFleteVentas,
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "",
                      state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13 || v.code == 5),
                      )
                        ? state.listMultiplicador.some(
                            (v) =>
                              v.id == element.id_multiplicador &&
                              (v.code == 14 || v.code == 13),
                          )
                          ? element.cif
                          : element.seguro
                        : 0,
                    ),
                  ),
                });
                totalOrigen += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }

            if (element.eslocalflag == 1) {
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                datosLocales.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    (state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].valor
                      : 0) *
                      element.costounitario *
                      miMixin.methods.calcularFac(
                        state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "N",
                        state.datosPrincipales.volumen,
                        state.datosPrincipales.peso,
                        state.datosPrincipales.containers,
                        state.datosPrincipales.amount,
                      ),
                  ),
                });
                totalLocales +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                datosLocales.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    miMixin.methods.calcularValor(
                      state.datosPrincipales.amount,
                      totalFleteVentas,
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "",
                      state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13 || v.code == 5),
                      )
                        ? state.listMultiplicador.some(
                            (v) =>
                              v.id == element.id_multiplicador &&
                              (v.code == 14 || v.code == 13),
                          )
                          ? element.cif
                          : element.seguro
                        : 0,
                    ),
                  ),
                });
                totalLocales += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }

            if (element.esaduanaflag == 1) {
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                datosAduanas.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    (state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].valor
                      : 0) *
                      element.costounitario *
                      miMixin.methods.calcularFac(
                        state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "N",
                        state.datosPrincipales.volumen,
                        state.datosPrincipales.peso,
                        state.datosPrincipales.containers,
                        state.datosPrincipales.amount,
                      ),
                  ),
                });
                totalAduanas +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                datosAduanas.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    miMixin.methods.calcularValor(
                      state.datosPrincipales.amount,
                      totalFleteVentas,
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "",
                      state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13 || v.code == 5),
                      )
                        ? state.listMultiplicador.some(
                            (v) =>
                              v.id == element.id_multiplicador &&
                              (v.code == 14 || v.code == 13),
                          )
                          ? element.cif
                          : element.seguro
                        : 0,
                    ),
                  ),
                });
                totalAduanas += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }

            if (element.esalmacenflag == 1) {
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                datosAlmacenes.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    (state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].valor
                      : 0) *
                      element.costounitario *
                      miMixin.methods.calcularFac(
                        state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "N",
                        state.datosPrincipales.volumen,
                        state.datosPrincipales.peso,
                        state.datosPrincipales.containers,
                        state.datosPrincipales.amount,
                      ),
                  ),
                });
                totalAlmacenes +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                datosAlmacenes.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    miMixin.methods.calcularValor(
                      state.datosPrincipales.amount,
                      totalFleteVentas,
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "",
                      state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13 || v.code == 5),
                      )
                        ? state.listMultiplicador.some(
                            (v) =>
                              v.id == element.id_multiplicador &&
                              (v.code == 14 || v.code == 13),
                          )
                          ? element.cif
                          : element.seguro
                        : 0,
                    ),
                  ),
                });
                totalAlmacenes += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esgastostercerosflag == 1) {
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                datosGastosTerceros.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    (state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].valor
                      : 0) *
                      element.costounitario *
                      miMixin.methods.calcularFac(
                        state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        ).length > 0
                          ? state.listMultiplicador.filter(
                              (v) => v.id == element.id_multiplicador,
                            )[0].code
                          : "N",
                        state.datosPrincipales.volumen,
                        state.datosPrincipales.peso,
                        state.datosPrincipales.containers,
                        state.datosPrincipales.amount,
                      ),
                  ),
                });
                totalGastosTercero +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                datosGastosTerceros.push({
                  name: element.nameservice,
                  valor: miMixin.methods.currencyFormat(
                    miMixin.methods.calcularValor(
                      state.datosPrincipales.amount,
                      totalFleteVentas,
                      state.listMultiplicador.some(
                        (v) => v.id == element.id_multiplicador,
                      )
                        ? state.listMultiplicador.filter(
                            (v) => v.id == element.id_multiplicador,
                          )[0].code
                        : "",
                      state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13 || v.code == 5),
                      )
                        ? state.listMultiplicador.some(
                            (v) =>
                              v.id == element.id_multiplicador &&
                              (v.code == 14 || v.code == 13),
                          )
                          ? element.cif
                          : element.seguro
                        : 0,
                    ),
                  ),
                });
                totalGastosTercero += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          });
      }
      if (tipo == "TOTAL") {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (element.esfleteflag == 1) {
              datosFlete.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                totalFlete +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalFlete += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esorigenflag == 1) {
              datosOrigen.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                totalOrigen +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalOrigen += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }

            if (element.eslocalflag == 1) {
              datosLocales.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                totalLocales +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalLocales += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }

            if (element.esaduanaflag == 1) {
              datosAduanas.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 5 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 13 &&
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code != 14
                  : false
              ) {
                totalAduanas +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalAduanas += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }

            if (element.esalmacenflag == 1) {
              datosAlmacenes.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                totalAlmacenes +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalAlmacenes += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
            if (element.esgastostercerosflag == 1) {
              datosGastosTerceros.push({
                name: element.nameservice,
                valor: "",
              });
              if (
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              ) {
                totalGastosTercero +=
                  (state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  ).length > 0
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].valor
                    : 0) *
                  element.costounitario *
                  miMixin.methods.calcularFac(
                    state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    ).length > 0
                      ? state.listMultiplicador.filter(
                          (v) => v.id == element.id_multiplicador,
                        )[0].code
                      : "N",
                    state.datosPrincipales.volumen,
                    state.datosPrincipales.peso,
                    state.datosPrincipales.containers,
                    state.datosPrincipales.amount,
                  );
              } else {
                totalGastosTercero += miMixin.methods.calcularValor(
                  state.datosPrincipales.amount,
                  totalFleteVentas,
                  state.listMultiplicador.some(
                    (v) => v.id == element.id_multiplicador,
                  )
                    ? state.listMultiplicador.filter(
                        (v) => v.id == element.id_multiplicador,
                      )[0].code
                    : "",
                  state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13 || v.code == 5),
                  )
                    ? state.listMultiplicador.some(
                        (v) =>
                          v.id == element.id_multiplicador &&
                          (v.code == 14 || v.code == 13),
                      )
                      ? element.cif
                      : element.seguro
                    : 0,
                );
              }
            }
          });
      }
      let DatosFinalesIngresos = [];
      if (tipo == "AGRUPADO") {
        DatosFinalesIngresos.push({
          descripcion: "CONCEPTOS DE INGRESOS",
          service: "",
          igv: "",
          total: "",
        });
      }
      if (datosFlete.length > 0 && isImport) {
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion:
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "FL")[0].name
                : "",
            service: "",
            igv: "",
            total: "",
          });
        }
        datosFlete.forEach((element) => {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: element.name,
            igv: "",
            total: element.valor,
          });
        });
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: "SubTotal",
            igv: "",
            total: miMixin.methods.currencyFormat(
              parseFloat(totalFlete).toFixed(2),
            ),
          });
        }
      }
      if (datosOrigen.length > 0) {
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion:
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "OR")[0].name
                : "",
            service: "",
            igv: "",
            total: "",
          });
        }
        datosOrigen.forEach((element) => {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: element.name,
            igv: "",
            total: element.valor,
          });
        });
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: "SubTotal",
            igv: "",
            total: miMixin.methods.currencyFormat(
              parseFloat(totalOrigen).toFixed(2),
            ),
          });
        }
      }
      // ------------------------------------------------
      if (datosLocales.length > 0) {
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion:
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "LO")[0].name
                : "",
            service: "",
            total: "",
          });
        }
        datosLocales.forEach((element) => {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: element.name,
            total: element.valor,
          });
        });
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: "SubTotal",
            total: miMixin.methods.currencyFormat(
              parseFloat(totalLocales).toFixed(2),
            ),
          });
        }
      }
      // ------------------------------------------------
      if (datosAduanas.length > 0) {
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion:
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "AD")[0].name
                : "",
            service: "",
            total: "",
          });
        }
        datosAduanas.forEach((element) => {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: element.name,
            total: element.valor,
          });
        });
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: "SubTotal",
            total: miMixin.methods.currencyFormat(
              parseFloat(totalAduanas).toFixed(2),
            ),
          });
        }
      }
      // ------------------------------------------------
      if (datosFlete.length > 0 && !isImport) {
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion:
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "FL")[0].name
                : "",
            service: "",
            igv: "",
            total: "",
          });
        }
        datosFlete.forEach((element) => {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: element.name,
            igv: "",
            total: element.valor,
          });
        });
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: "SubTotal",
            igv: "",
            total: miMixin.methods.currencyFormat(
              parseFloat(totalFlete).toFixed(2),
            ),
          });
        }
      }
      if (datosAlmacenes.length > 0) {
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion:
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "AL")[0].name
                : "",
            service: "",
            total: "",
          });
        }
        datosAlmacenes.forEach((element) => {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: element.name,
            total: element.valor,
          });
        });
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: "SubTotal",
            total: miMixin.methods.currencyFormat(
              parseFloat(totalAlmacenes).toFixed(2),
            ),
          });
        }
      }
      if (datosGastosTerceros.length > 0) {
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion:
              state.listTipoCostos.length > 0
                ? state.listTipoCostos.filter((v) => v.codigo == "GT")[0].name
                : "",
            service: "",
            total: "",
          });
        }
        datosGastosTerceros.forEach((element) => {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: element.name,
            total: element.valor,
          });
        });
        if (tipo != "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "",
            service: "SubTotal",
            total: miMixin.methods.currencyFormat(
              parseFloat(totalAlmacenes).toFixed(2),
            ),
          });
        }
      }
      let totalSinIGV =
        parseFloat(totalFlete) +
        parseFloat(totalOrigen) +
        parseFloat(totalLocales) +
        parseFloat(totalAduanas) +
        parseFloat(totalGastosTercero) +
        parseFloat(totalAlmacenes);

      let igv = 0;

      if (!!isImport) {
        igv =
          ((parseFloat(isLocal == true ? totalLocales : 0) +
            parseFloat(isAduana == true ? totalAduanas : 0) +
            parseFloat(isGastosTercero == true ? totalGastosTercero : 0) +
            parseFloat(isAlmacen == true ? totalAlmacenes : 0)) *
            enterprise.state.impuesto.impuesto) /
          100;
      } else {
        igv =
          ((parseFloat(isOrigen == true ? totalOrigen : 0) +
            parseFloat(isLocal == true ? totalLocales : 0) +
            parseFloat(isGastosTercero == true ? totalGastosTercero : 0) +
            parseFloat(isAduana == true ? totalAduanas : 0)) *
            enterprise.state.impuesto.impuesto) /
          100;
      }

      DatosFinalesIngresos.push({
        descripcion: "TOTAL",
        service: `TOTAL SIN ${
          enterprise.state.impuesto.nombre_impuesto
        }: ${miMixin.methods.currencyFormat(totalSinIGV)}`,
        igv: `${
          enterprise.state.impuesto.nombre_impuesto
        } ${miMixin.methods.currencyFormat(parseFloat(igv))}`,
        total: miMixin.methods.currencyFormat(
          parseFloat(totalSinIGV) + parseFloat(igv),
        ),
      });

      state.listIngresosInstructivo.push({
        totalIngresos: parseFloat(totalSinIGV),
        opcion: DatosFinalesIngresos,
        nro_propuesta: opcion.nro_propuesta,
      });
      // state.totalIngresos = parseFloat(totalSinIGV);
      // state.listIngresosInstructivo.push(DatosFinalesIngresos);
    });
}

async function GenerarCostosInstrictivo(tipo) {
  state.opcionCostos
    .filter((v) => !!v.selected)
    .forEach(async (opcion) => {
      let dataCostos = [];
      let totalFleteVentas = await calcularTotalFleteVentaPorOpcion(
        opcion.listCostos,
      );
      opcion.listCostos
        .filter((v) => v.esopcionflag == 1 && v.status == 1)
        .forEach((element) => {
          // ------------------------------------

          let montoDetails = 0;
          if (
            state.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            ).length > 0
              ? state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 5 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 13 &&
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code != 14
              : false
          ) {
            montoDetails +=
              (state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].valor
                : 0) *
              element.costounitario *
              miMixin.methods.calcularFac(
                state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? state.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "N",
                state.datosPrincipales.volumen,
                state.datosPrincipales.peso,
                state.datosPrincipales.containers,
                state.datosPrincipales.amount,
              );
          } else {
            montoDetails += miMixin.methods.calcularValor(
              state.datosPrincipales.amount,
              totalFleteVentas,
              state.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador,
              )
                ? state.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0].code
                : "",
              state.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? state.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
          dataCostos.push({
            proveedor: modules.state.provedores.filter(
              (v) => v.id == element.id_proveedor,
            )[0].namelong,
            service: element.nameservice,
            valor: montoDetails,
          });
        });
      let total = 0;
      let DatosFinalesCostos = [];
      const proveedoresUnicos = new Set(
        dataCostos.map((item) => item.proveedor),
      );

      // Convertimos el Set a un array
      const proveedores = Array.from(proveedoresUnicos);

      proveedores.forEach((proveedor) => {
        let totalPorProveedor = 0;
        DatosFinalesCostos.push({
          proveedor: proveedor,
          service: "",
          igv: "",
          total: "",
        });
        dataCostos
          .filter((v) => v.proveedor == proveedor)
          .forEach((costo) => {
            total += costo.valor;
            totalPorProveedor += costo.valor;
            DatosFinalesCostos.push({
              proveedor: "",
              service: costo.service,
              total: miMixin.methods.currencyFormat(costo.valor),
            });
          });
        DatosFinalesCostos.push({
          proveedor: "",
          service: "SubTotal",
          igv: "",
          total: miMixin.methods.currencyFormat(totalPorProveedor),
        });
      });
      DatosFinalesCostos.push({
        proveedor: "TOTAL",
        service: "",
        igv: "",
        total: miMixin.methods.currencyFormat(total),
      });

      state.totalCostos = total;
      // state.listCostosInstructivo = DatosFinalesCostos;
      state.listCostosInstructivo.push({
        totalCostos: total,
        opcion: DatosFinalesCostos,
        nro_propuesta: opcion.nro_propuesta,
      });
    });
}

function GenerarImpInstructivo() {
  let totalFleteVentas = 0;
  let impuestoflag = state.listServices.some(
    (v) => v.code_service == 15 && v.status == 1,
  );
  if (impuestoflag) {
    let totalImpuesto = 0;
    let codeCalc = ["05", "06", "07", "08", "09", "10", "11", "12"];
    state.opcionCostos
      .filter((v) => !!v.selected)
      .forEach(async (opcion) => {
        let impuestos = [];
        await opcion.listImpuestos
          .filter((v) => codeCalc.includes(v.codigo))
          .forEach(async (element) => {
            totalFleteVentas = await calcularTotalFleteVentaPorOpcion(
              opcion.listCostos,
            );
            impuestos.push({
              type: element.codigo,
              name: element.descripcion,
              percentage: element.codigo01 ? `${element.codigo01} %` : "0 %",
              valor: miMixin.methods.currencyFormat(
                miMixin.methods.calcularImpuestos({
                  impuestos: opcion.listImpuestos,
                  item: element,
                  totalFlete: totalFleteVentas,
                  datosPrincipales: state.datosPrincipales,
                }),
              ),
            });

            totalImpuesto += parseFloat(
              miMixin.methods.calcularImpuestos({
                impuestos: opcion.listImpuestos,
                item: element,
                totalFlete: totalFleteVentas,
                datosPrincipales: state.datosPrincipales,
              }),
            );
          });

        impuestos.push({
          type: "",
          name: "TOTAL",
          percentage: "",
          valor: miMixin.methods.currencyFormat(totalImpuesto),
        });
        totalImpuesto = 0;
        state.listImpuestosInstructivo.push({
          nro_propuesta: opcion.nro_propuesta,
          opcion: impuestos,
        });
      });
  }
  // console.log(state.listImpuestosInstructivo);
}
async function calcularTotalFleteVentaPorOpcion(data) {
  let totalFlete = 0;
  data
    .filter((v) => v.esfleteflag == 1 && v.status == 1 && v.esventaflag == 1)
    .forEach(async (element) => {
      if (isNotPorcentaje(element, element.id_multiplicador)) {
        totalFlete +=
          (state.listMultiplicador.filter(
            (v) => v.id == element.id_multiplicador,
          ).length > 0
            ? state.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              )[0].valor
            : 0) *
          element.costounitario *
          miMixin.methods.calcularFac(
            state.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            ).length > 0
              ? state.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].code
              : "N",
            state.datosPrincipales.volumen,
            state.datosPrincipales.peso,
            state.datosPrincipales.containers,
            state.datosPrincipales.amount,
          );
      }
    });
  return totalFlete;
}

function isNotPorcentaje(element, id_multiplicador) {
  let code = [5, 13, 14];

  let mul = state.listMultiplicador.some(
    (v) => v.id == id_multiplicador && code.includes(v.code),
  );

  return !mul;
}

export function getNombreCotizacion(listNotasQuote) {
  // COTIZACION  Servicio *Maritimo*  Salida Semanal. *CLIENTE No 10060*

  let shipment = state.listShipment.find(
    (v) => v.id == state.datosPrincipales.idtipocarga,
  );

  let Servicio = "";

  switch (shipment.code) {
    case "Aéreo":
      Servicio = "Aéreo";
      break;
    case "LCL":
      Servicio = "Maritimo Consolidado Individual";
      break;
    case "FCL":
      Servicio = "Maritimo Contenedor Completo";
      break;

    default:
      break;
  }
  let nota = state.opcionCostos[0].listNotasQuote[0].descripcion;
  state.nombre_cotizacion = `COTIZACION ${nota} ${state.datosPrincipales.nombre}`;
  return name;
}

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
