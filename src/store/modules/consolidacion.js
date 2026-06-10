import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
const state = {
  lstConsolidacion: [],
};
const mutations = {
  SET_CONSOLIDACION(state, data) {
    state.lstConsolidacion = data;
  },
};
const actions = {
  async generarConsolidacion({ commit }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "generar_consolidacion",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        commit("SET_CONSOLIDACION", response.data.data);
        if (!data.estadoflag) {
          Swal.fire({
              icon: data.status == "401" ? "error" : "info",
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
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
