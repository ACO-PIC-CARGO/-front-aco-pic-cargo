import axios from '@/api/axios-config';
import Swal from "sweetalert2";
// import funciones from "./../../mixins/funciones";
const state = {
  listTotalCotizacion: [],
  listUser: [],
  cboStatus: [],
  datos: null,
  datosresumen: null,
  listTotalCotizacion: [],
  lstTipoCosto: [],
  lstServicio: [],
  lstMultiplicador: [],
  lstCostos: [],
  lstFlete: [],
  lstProfit: [],
  lstFleteGrupal: [],
  lstDepartamentos: [],
  lstDistritos: [],
  lstTransporte: [],
  opcionCalculadora: 1,
  opciones: [],
  config: [],
};
const mutations = {
  setOpcion(state, opcion) {
    console.log(opcion);
    state.opcionCalculadora = opcion;
  },
  SET_LST_COSTOS_DEPARTAMENTOS(state, data) {
    state.lstDepartamentos = data;
  },
  SET_CONFIGURACION(state, data) {
    state.config = data;
  },
  SET_FLETE_GRUPAL(state, data) {
    state.lstFleteGrupal = data;
  },
  SET_LST_COSTOS_DISTRITOS(state, data) {
    state.lstDistritos = data;
  },
  SET_LST_COSTOS_TRANSPORTE(state, data) {
    state.lstTransporte = data;
  },
  SET_LST_COSTOS_TOTALES(state, data) {
    state.lstFlete = data;
  },
  SET_LST_PROFIT(state, data) {
    state.lstProfit = data;
  },
  SET_TOTAL_COTIZACION(state, data) {
    state.listTotalCotizacion = data;
  },
  SET_SUCURSAL(state, data) {
    state.listSucursal = data;
  },
  setnavieraCalc(state, data) {
    state.navieraCalc = data;
  },
  setcontendedorCalc(state, data) {
    state.contendedorCalc = data;
  },
  SET_LIST_USER(state, data) {
    state.listUser = data;
  },
  SET_CBO_STATUS(state, data) {
    state.cboStatus = data;
  },
  SET_DATOS(state, data) {
    state.datos = data;
  },
  SET_DATOS_RESUMEN(state, data) {
    state.datosresumen = data;
  },
  SET_LST_TIPO_COSTO(state, data) {
    state.lstTipoCosto = data;
  },
  SET_LST_SERV(state, data) {
    state.lstServicio = data;
  },
  SET_LST_MULTIPLICADOR(state, data) {
    state.lstMultiplicador = data;
  },
  SET_LST_COSTOS(state, data) {
    state.lstCostos = data;
  },
  SET_LST_OPCIONES(state, data) {
    console.log(data);
    state.opciones = data;
  },
};

const actions = {
  async GetTotalCotizacion({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "get_total_cotizacion",
      headers: headers,
      data: {
        iso_pais: JSON.parse(sessionStorage.getItem("iso_pais")),
      },
    };

    await axios(config).then((response) => {
      commit("SET_TOTAL_COTIZACION", response.data.data);
    });
  },
  async CargarPuertoPorTipoPorPais(__, data) {
    var vm = this;
    vm.state.overlay = true;
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `CargarPuertoXPaisXTipo/${data.id_pais}/${data.tipo}`,
      headers: headers,
    };
    let valores = await axios(config);
    if (!valores.data.estadoflag) {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
      return [];
    }
    vm.state.overlay = false;
    return valores.data.data;
  },
  async CargarnavieraCalc({ commit }) {
    var vm = this;
    vm.state.overlay = true;
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `cargar_navieras`,
      headers: headers,
    };
    let valores = await axios(config);
    if (valores.data.estadoflag) {
      commit("setnavieraCalc", valores.data.data);
    } else {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
    }
    vm.state.overlay = false;
  },
  async CargarcontendedorCalc({ commit }) {
    var vm = this;
    vm.state.overlay = true;
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `cargar_contenedores`,
      headers: headers,
    };
    let valores = await axios(config);
    if (valores.data.estadoflag) {
      commit("setcontendedorCalc", valores.data.data);
    } else {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
    }
    vm.state.overlay = false;
  },
  async CargarSucursal({ commit }) {
    let vm = this;
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `cargar_sucursal`,
      headers: headers,
    };
    await axios(config).then((response) => {
      let data = response.data;
      if (data.estadoflag) {
        commit("SET_SUCURSAL", data.data);
      }
    });
  },
  async getListUserCalc({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "listar_usuarios_calculadora",
      headers: headers,
      data: {
        iso_pais: JSON.parse(sessionStorage.getItem("iso_pais")),
      },
    };
    let response = await axios(config);

    commit("SET_LIST_USER", response.data.data);
  },
  async getCboStatus({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "cargue_status",
      headers: headers,
    };
    let response = await axios(config);

    commit("SET_CBO_STATUS", response.data.data);
  },
  async SetCall(__, data) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insert_call",
      headers: headers,
      data: data,
    };
    await axios(config).then((response) => {
      Swal.fire({
        icon: response.data.data[0].tipomensaje == "TMSGINF" ? "info" : "error",
        title: response.data.data[0].mensaje,
      });
    });
  },
  async ExportarListUser() {
    var headers = {
     
      "Content-Type": "blob",
    };

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "export_listar_usuarios_calculadora?id_pais=" +
        JSON.parse(sessionStorage.getItem("iso_pais")),
      headers: headers,
      responseType: "blob",
      data: {
        iso_pais: JSON.parse(sessionStorage.getItem("iso_pais")),
      },
    };
    await axios(config).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Listado Usuario Calculadora - ${Date.now()}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
    });
  },

  async GetCotFCL({ commit }, token) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "get_cot_fcl?token=" + token,
      headers: headers,
    };
    let response = await axios(config);

    commit("SET_DATOS", response.data.data);
  },
  async GetCotLCL({ commit }, token) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "get_cot_lcl?token=" + token,
      headers: headers,
    };
    let response = await axios(config);

    commit("SET_DATOS", response.data.data);
  },
  async GetCotAereo({ commit }, token) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "get_cot_aereo?token=" + token,
      headers: headers,
    };
    let response = await axios(config);

    commit("SET_DATOS", response.data.data);
  },

  async GetCotFCLResumen({ commit }, token) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "get_cot_fcl_resumen?token=" + token,
      headers: headers,
    };
    let response = await axios(config);

    commit("SET_DATOS_RESUMEN", response.data.data);
  },
  async GetCotLCLResumen({ commit }, token) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "get_cot_lcl_resumen?token=" + token,
      headers: headers,
    };
    let response = await axios(config);

    commit("SET_DATOS_RESUMEN", response.data.data);
  },
  async GetCotAereoResumen({ commit }, token) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + "get_cot_aereo_resumen?token=" + token,
      headers: headers,
    };
    let response = await axios(config);

    commit("SET_DATOS_RESUMEN", response.data.data);
  },

  async GetTipoCosto({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/tipo_costo",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    commit("SET_LST_TIPO_COSTO", response.data.data);
  },

  async GetCalcServicio({ commit }, _) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    let data = { id_pais: id_pais };
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/servicio",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    commit("SET_LST_SERV", response.data.data);
  },
  async GetCalcMultiplicador({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    data.id_branch = branch[0].id;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/multiplicador",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    commit("SET_LST_MULTIPLICADOR", response.data.data);
  },
  async PostCalcServicio({ dispatch }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "calc/servicio/guardar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      dispatch("GetCalcServicio");
    }
  },
  async PostCalcCosto({ dispatch }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    data.users = dataUser[0].users;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "calc/costos/insertar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      dispatch("GetCotCostos");
    }
  },
  async GetCotCostos({ commit }, _) {
    var headers = {
     
      "Content-Type": "application/json",
    };
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    let params = { id_pais: id_pais };
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/costos",
      headers: headers,
      params: params,
    };
    let response = await axios(config);
    let data = response.data.data;
    data = data.map((v) => {
      return { ...v, bloqueadoflag: true };
    });
    commit("SET_LST_COSTOS", data);
  },
  async GetCotValLCL({ commit }, data) {
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "calc/val_data_lcl",
      headers: headers,
      data: {
        data: data,
      },
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      res = response.data.data;
    }
    return res;
  },
  async postGuardarCostos({ commit, dispatch }, data) {
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    data.user = dataUser[0].users;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "calc/costos_calc",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      res = response.data.data;
      Swal.fire({
        icon: "success",
        title: "Registro Correcto",
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          window.location.reload();
        }
      });
    }
  },
  async getCostosList({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/costos_list",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      commit("SET_LST_COSTOS_TOTALES", response.data.data);
    }
  },
  async getProfitList({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/profit_list",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      commit("SET_LST_PROFIT", response.data.data);
    }
  },
  async postGuardarProfit({ dispatch }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    data.user = dataUser[0].users;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "calc/profit",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      res = response.data.data;
      Swal.fire({
        icon: "success",
        title: "Registro Correcto",
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          // window.location.reload();
        }
      });
    }
    return res;
  },
  async actualizarGuardarProfit({ dispatch }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    data.user = dataUser[0].users;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "calc/profit/actualizar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      res = response.data.data;
      Swal.fire({
        icon: "success",
        title: "Registro Correcto",
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          // window.location.reload();
        }
      });
    }
    return res;
  },
  async eliminarGuardarProfit({ dispatch }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    data.user = dataUser[0].users;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "calc/profit/anular",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      res = response.data.data;
      Swal.fire({
        icon: "success",
        title: "Registro Correcto",
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          // window.location.reload();
        }
      });
    }
    return res;
  },
  async ActualizarCosto({ dispatch }, data) {
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    data.user = dataUser[0].users;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "calc/costo/actualizar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      let res = response.data;
      Swal.fire({
        icon: "success",
        title: res.mensaje,
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          dispatch("GetCotCostos");
        }
      });
    }
  },
  async EliminarCosto({ dispatch }, data) {
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    data.user = dataUser[0].users;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "calc/costo/eliminar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      let res = response.data.data;
      Swal.fire({
        icon: "success",
        title: res.mensaje,
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          dispatch("GetCotCostos");
        }
      });
    }
  },
  async getTransporte({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/transporte",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      console.log(response.data);
      commit("SET_LST_COSTOS_TRANSPORTE", response.data.data);
    }
  },
  async getOpciones({ commit }) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;

    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/cargar/opciones",
      headers: headers,
      // params: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      console.log(response.data);
      commit("SET_LST_OPCIONES", response.data.data);
    }
  },
  async getDepartamentos({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/departamentos",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      commit("SET_LST_COSTOS_DEPARTAMENTOS", response.data.data);
    }
  },
  async getDistritos({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/distritos",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      commit("SET_LST_COSTOS_DISTRITOS", response.data.data);
    }
  },
  async getTransporteGuardar({ dispatch }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "calc/transporte/guardar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      let res = response.data;
      Swal.fire({
        icon: "success",
        title: res.mensaje,
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          dispatch("getTransporte", {});
        }
      });
    }
  },
  async getConfiguración({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    // let id_pais = branch[0].id_pais;
    // data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/cargar/config",
      headers: headers,
      data: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      let data = response.data.data;
      data = data.map((v) => {
        return { ...v, editarflag: false };
      });
      commit("SET_CONFIGURACION", data);
    }
  },
  async ActualizarConfig({ dispatch }, data) {
    let dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    data.user = dataUser[0].users;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "calc/config/actualizar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      let res = response.data;
      Swal.fire({
        icon: "success",
        title: res.mensaje,
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {
        if (res.isConfirmed) {
          dispatch("getConfiguración");
        }
      });
    }
  },
  async getFleteGrupal({ commit }, data) {
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    let res = [];
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "calc/flete/grupal",
      headers: headers,
      params: data,
    };
    let response = await axios(config);

    if (response.data.estadoflag) {
      commit("SET_FLETE_GRUPAL", response.data.data);
    }
  },
  async setFleteGrupal({ dispatch }, data) {
    console.log("data", data);
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "calc/flete/grupal/guardar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      let res = response.data;
      Swal.fire({
        icon: "success",
        title: res.mensaje,
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {});
    }
  },
  async updateFleteGrupal({ dispatch }, data) {
    console.log("data", data);
    let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
    let id_pais = branch[0].id_pais;
    data.id_pais = id_pais;
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "calc/flete/grupal/actualizar",
      headers: headers,
      data: data,
    };
    let response = await axios(config);
    if (response.data.estadoflag) {
      let res = response.data;
      Swal.fire({
        icon: "success",
        title: res.mensaje,
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      }).then((res) => {});
    }
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
