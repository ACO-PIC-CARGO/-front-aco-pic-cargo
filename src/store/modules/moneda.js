import axios from '@/api/axios-config';;
import Swal from "sweetalert2";

const state = {
  moneda: null,
};
const mutations = {
  setMoneda(state, data) {
    state.moneda = data;
  },
};
const actions = {
  async CargarMoneda({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `cargar_moneda`,
      headers: headers,
    };
    let valores = await axios(config);
    if (valores.data.estadoflag) {
      commit("setMoneda", valores.data.data);
    } else {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
    }
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
