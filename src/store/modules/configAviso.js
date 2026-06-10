import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  configAviso: {},
};
let mutations = {
  SET_CONFIG_AVISO(state, data) {
    state.configAviso = data;
  },
};

let actions = {
  async obtenerConfigAviso({ commit }) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "get_ver_configaviso",
      params: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        if (data.estadoflag) {
          console.log(data.data[0]);
          commit("SET_CONFIG_AVISO", data.data[0]);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async actualizarConfigAviso({ commit }, data) {
    var config = {
      method: "PUT",
      url: process.env.VUE_APP_URL_MAIN + "actualizarConfigAviso",
      data,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
          });
          // console.log(data.data);
        }
      })
      .catch(function (error) {
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
