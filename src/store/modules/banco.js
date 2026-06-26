import axios from '@/api/axios-config';
// import Swal from "sweetalert2";
// import funciones from "./../../mixins/funciones";
const state = {
  cuentas: [],
  validacionBanco: null,
};
const mutations = {
  SET_CUENTAS(state, data) {
    state.cuentas = data;
  },
  SET_VALIDACION_BANCO(state, data) {
    state.validacionBanco = data;
  },
};
const actions = {
  async getListBanksDetailsCargar({ commit }) {
    let vm = this;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "getListBanksDetailsCargar",
      params: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
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
  async getValidaNroOp({ commit }, nro_operacion) {
    let res = null;
    let vm = this;
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "validar_nro_operacion?nro_operacion=" +
        nro_operacion,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_VALIDACION_BANCO", response.data);
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
