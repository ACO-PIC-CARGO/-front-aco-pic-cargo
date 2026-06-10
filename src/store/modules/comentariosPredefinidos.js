import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
import moment from "moment";

const state = {
  list: [],
  loading: false,
  record: {},
  maxCode: 0
};

const mutations = {
  SET_LOADING(state, data) {
    state.loading = data;
  },
  SET_LIST_COMENTARIOS_PREDEFINIDOS(state, data) {
    state.list = data;
  },
  SET_MAX_CODE(state, data) {
    state.maxCode = data;
  },
};

const actions = {
  async fetchListadoComentariosPredefinidos({ commit }, data = { status: 1 }) {
    commit("SET_LOADING", true);

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + "listarComentariosPredefinidos?" +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&code=${
          data.code ? data.code : ""
        }&comentario=${
          data.comentario ? data.comentario : ""
        }&status=${
          data.status === 0 || data.status === 1 ? data.status : ""
        }`,
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
       //  console.log(data)

        let list = data.estadoflag ? data.data : [];
        commit("SET_LIST_COMENTARIOS_PREDEFINIDOS", list);
        commit("SET_LOADING", false);

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
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async fetchMaxCodeListadoComentariosPredefinidos({ commit }, data = {}) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + "consultarMaxCodeComentariosPredefinidos?" +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);

        if (data.estadoflag) 
        {
          commit("SET_MAX_CODE", data.data[0].code || 0);
        }        
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async insertComentarioPredefinido({ commit, dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertarComentarioPredefinido",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await axios(config)
      .then((response) => {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token);

        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });

        dispatch("fetchListadoComentariosPredefinidos");
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async updateComentarioPredefinido({ commit, dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizarComentarioPredefinido",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await axios(config)
      .then((response) => {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token);

        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });

        dispatch("fetchListadoComentariosPredefinidos");
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async deleteComentarioPredefinido({ dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "eliminarComentarioPredefinido",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await axios(config)
      .then((response) => {
        console.log(response);
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);

        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });

        dispatch("fetchListadoComentariosPredefinidos");
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async exportToExcelListadoComentarioPredefinidos() {
    let headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer",
    };
    let data    = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    };

    await axios
      .post(
        process.env.VUE_APP_URL_MAIN + "exportarListadoComentariosPredefinidos", 
        data, 
        headers
      )
      .then((response) => {
        const { data }  = response;        
        const url       = window.URL.createObjectURL(new Blob([data]));
        const link      = document.createElement("a");
        link.href       = url;
        link.setAttribute(
          "download",
          `LISTADO DE COMENTARIOS PREDEFINIDOS DE ESTADO DEL EMBARQUE ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        // this.previewFlag = false;
        // this.generandoFlag = false;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
