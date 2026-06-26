import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";

const state = {
  listStatusHouse: [],
  orden: {},
};

const mutations = {
  SET_LIST_STATUS_HOUSE(state, data) {
    data.map((item) => {
      item.verComentarios = false;
    });
    state.listStatusHouse = data;
  },
  SET_ORDEN_STATUS_HOUSE(state, data) {
    state.orden = data;
  },
};
const actions = {
  async getListStatusHouse({ commit }, data = {}) {
    data.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser")
    )[0].id_branch;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `listar_status_house`,
      params: data,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        // sessionStorage.setItem("auth-token", data.token);

        let list = data.estadoflag ? data.data : [];
        commit("SET_LIST_STATUS_HOUSE", list);

        if (!data.estadoflag)
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
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async getObtenerOrdenStatusHouse({ commit }, data) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `obtener_orden_status_house`,
      params: data,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        let list = data.estadoflag ? data.data : [];
        commit("SET_ORDEN_STATUS_HOUSE", list[0]);
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async GuardarStatusHouse({ dispatch, commit }, data) {
    data.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser")
    )[0].id_branch;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `guardar_orden_statuscomentarios`,
      data: data,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        dispatch("getListStatusHouse", {});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async GuardarStatus({ dispatch, commit }, data) {
    // data.id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `guardar_orden_status`,
      data: { lstStatus: data },
      headers: {
        "Content-Type": "application/json",
       
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        dispatch("getListStatusHouse", {});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async EliminarStatus({ dispatch, commit }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `eliminar_status`,
      data: data,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        dispatch("getListStatusHouse", {});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async EliminarComentario({ dispatch, commit }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `eliminar_comentario`,
      data: data,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        dispatch("getListStatusHouse", {});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
};

export default {
  namespaced: true, // Asegúrate de incluir esto
  state,
  mutations,
  actions,
};
