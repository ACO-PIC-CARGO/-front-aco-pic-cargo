import axios from "axios";
import Swal from "sweetalert2";
const state = {
  lstCostos: [],
  lstMultiplicador: [],
};
const mutations = {
  SET_COSTOS(state, data) {
    state.lstCostos = data;
  },
  SET_MULTPLICADOR(state, data) {
    state.lstMultiplicador = data;
  },
};
const actions = {
  async getCargarCostos({ commit }, data) {
    let vm = this;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "costo_pricing",
      params: data,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_COSTOS", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getMultiplicadorConfigCosto({ commit }, id_shipment) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var data = {
      id_shipment: id_shipment,
      containers: [],
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    //
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "cargar_multiplicador_config_costo",
      params: data,
      headers: headers,
    };
    await axios(config)
      .then(function (response) {
        let res = response.data;
        if (res.estadoflag) {
          commit("SET_MULTPLICADOR", res.data);
        } else {
          commit("SET_MULTPLICADOR", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async setGuardarCostos({}, data) {
    let vm = this;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "costo_pricing_actualizar",
      data: data,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let res = response.data;
        Swal.fire({
          icon: !!res.estadoflag ? "success" : "error",
          text: res.mensaje,
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
};

export default { namespaced: true, state, mutations, actions };
