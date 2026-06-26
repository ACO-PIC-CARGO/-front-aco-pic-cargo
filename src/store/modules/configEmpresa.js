import axios from '@/api/axios-config';
import Swal from "sweetalert2";
const state = {
  config: true,
  datoEmpresa: {
    id: "",
    id_document: "",
    document: "",
    trade_name: "",
    logo: "",
    id_pais: "",
    id_logo: "",
    address: "",
    tipoimpuesto: "",
    impuesto: 0,
    usarclientes: true,
    usaropadmin: true,
  },
  dataUsuario: {
    usuario: "",
    birthday: "",
    departamento: "",
    description: "",
    document: "",
    ic: "",
    id: "",
    id_branch: "",
    id_document: "",
    id_pais: "",
    id_sex: "",
    id_user: "",
    names: "",
    nombrecompleto: "",
    path: "",
    second_surname: "",
    surname: "",
    usuario: "",
    phone: "",
    email: "",
  },
  lstProveedor: [],
  lstClientes: [],
  lstCostos: [],
  lstMultiplicador: [],
  listTipoCostos: [],
  configEmpresa: {
    correlativopricing: null,
    correlativomaster: null,
    correlativocge: null,
  },
};
const mutations = {
  SET_LST_COSTOS(state, data) {
    state.lstCostos = data;
  },
  SET_MULTPLICADOR(state, data) {
    state.lstMultiplicador = data;
  },
  SET_TIPO_COSTOS(state, data) {
    state.listTipoCostos = data;
  },
};
const actions = {
  async actualizarDatoEmpresa() {
    let datoEmpresa = { ...state.datoEmpresa };
    datoEmpresa.TipoImp = state.datoEmpresa.tipoimpuesto;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_datos_empresa_config`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: datoEmpresa,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async actualizarDatoAdministrador() {
    var config = {
      method: "put",
      url:
        process.env.VUE_APP_URL_MAIN + `actualizar_datos_administrador_config`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.dataUsuario,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async actualizarDatoAdministrador() {
    var config = {
      method: "put",
      url:
        process.env.VUE_APP_URL_MAIN + `actualizar_datos_administrador_config`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.dataUsuario,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async actualizarDatoCMProveedor({}, subConjunto) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_datos_cm_proveedor`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        lstProveedor: subConjunto,
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        // Swal.fire({
        //   icon: !!data.estadoflag ? "success" : "error",
        //   text: data.mensaje,
        //   showCancelButton: false,
        //   confirmButtonText: "Ok",
        // });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async actualizarDatoCMCliente({}, subConjunto) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_datos_cm_cliente`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        lstClientes: subConjunto,
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        // Swal.fire({
        //   icon: !!data.estadoflag ? "success" : "error",
        //   text: data.mensaje,
        //   showCancelButton: false,
        //   confirmButtonText: "Ok",
        // });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async obtenerConfigCostos({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `obtener_config_costos?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_modality=${data.id_modality}&shipment=${data.shipment}`,
      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        commit("SET_LST_COSTOS", response.data.data);
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async getMultiplicadorConfig({ commit }, data) {
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_multiplicador_config?id_shipment=${
          data.id_shipment
        }&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
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
  async getTipoCostosConfig({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `tipo_costo_x_embarque?id_shipment=${data.id_shipment}&id_modality=${data.id_modality}`,
      headers: {
       
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
  async guardarCostos({ commit }, data) {
    data.id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
    const config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `guardar_costos_config`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data,
    };
    try {
      const response = await axios(config);
      const resData = response.data;
      return resData;
    } catch (error) {
      console.log("Error al guardar costos de configuración:", error);
      throw error;
    }
  },
  async OmitirConfiguracionCost({ commit }) {
    if (!JSON.parse(sessionStorage.getItem("dataUser"))) {
      return false;
    }
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `omitir_config_cost`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config).catch(function (error) {
      console.log(error);
    });
  },
  async finalizarConfiguracion({ commit }) {
    if (!JSON.parse(sessionStorage.getItem("dataUser"))) {
      return false;
    }
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `finalizar_config`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config).catch(function (error) {
      console.log(error);
    });
  },
  async GuardarConfiguracionEmpresa({ commit }) {
    let data = {
      ...state.configEmpresa,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `guardar_existe_datos_config`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config).catch(function (error) {
      console.log(error);
    });
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
