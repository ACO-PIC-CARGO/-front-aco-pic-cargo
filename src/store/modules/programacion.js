import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
const state = {
  listado: [],
  listProgramacion: [],
  listProgramacionxProveedor: [],
};
const mutations = {
  SET_LIST(state, data) {
    state.listado = data;
  },
  SET_LIST_PROGRAMACION(state, data) {
    state.listProgramacion = data;
  },
  SET_LIST_PROGRAMACION_X_PROVEEDOR(state, data) {
    state.listProgramacionxProveedor = data;
  },
};

const actions = {
  async ListProgrammedPayment({ commit }) {
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "ListProgrammedPaymentDetails/" +
        JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,

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
        if (!!data.estadoflag) {
          commit("SET_LIST", data.data);
        } else {
          commit("SET_LIST", []);
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
  async GetTotalCotizacion({ commit }) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "cargar_programacion?id_branch=" +
        JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      headers: headers,
    };

    await axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      commit("SET_LIST_PROGRAMACION", response.data.data);
    });
  },
  async getListProgramacion({ commit }, data) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `pagos_programados_por_proveedor?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_proveedor=${data.id_proveedor}&id_programend=${data.id}&id_coins=${
          data.id_coins
        }`,
      headers: headers,
    };

    await axios(config).then((response) => {
      let data = response.data.data;
      sessionStorage.setItem("auth-token", response.data.token);
      data.forEach((element) => {
        element.tipocambio = element.tipocambio ? element.tipocambio : 1;
      });
      commit("SET_LIST_PROGRAMACION_X_PROVEEDOR", data);
    });
  },
  async setPagoProgramado({ dispatch }, data) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `registrar_pagos_programado`,
      headers: headers,
      data: data,
    };

    await axios(config).then((response) => {
      let data = response.data.data[0];
      Swal.fire({
        icon: "info",
        titleText: "Aviso",
        text: data.mensaje,
      }).then((result) => {
        if (result.isConfirmed) {
          dispatch("ListProgrammedPayment");
        }
      });
    });
  },
  async eliminarProgramacion({ dispatch }, data) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `eliminar_programacion`,
      headers: headers,
      data: data,
    };

    await axios(config).then((response) => {
      let data = response.data.data[0];
      Swal.fire({
        icon: "info",
        titleText: "Aviso",
        text: data.mensaje,
      }).then((result) => {
        if (result.isConfirmed) {
          dispatch("ListProgrammedPayment");
        }
      });
    });
  },
  async eliminarProgramacionDetalle(__, data) {
    var headers = {
      "auth-token": sessionStorage.getItem("auth-token"),
      "Content-Type": "application/json",
    };
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `eliminar_programacion_detalle`,
      headers: headers,
      data: data,
    };

    await axios(config).then((response) => {
      let data = response.data.data[0];
      Swal.fire({
        icon: "info",
        titleText: "Aviso",
        text: data.mensaje,
      }).then((result) => {});
    });
  },
};
export default {
  namespace: true,
  state,
  mutations,
  actions,
};
