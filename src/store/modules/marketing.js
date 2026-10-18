import axios from "@/api/axios-config";
import Swal from "sweetalert2";
import router from "@/router";
import moment from "moment";

const state = {
  list: [],
  response: [],
  record: {},
  last_position: {},
  loading: false,
};

const mutations = {
  SET_LOADING(state, data) {
    state.loading = data;
  },
  SET_LIST_MARKETING(state, data) {
    state.list = data;
  },
  SET_MARKETING(state, data) {
    state.record = data;
  },
  SET_POSITION_MARKETING(state, data) {
    state.last_position = data;
  },
};
const actions = {
  async fetchDataMarketing({ commit }, data) {
    commit("SET_LOADING", false);

    var config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listar_marketing`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        let list = data.estadoflag ? data.data : [];

        commit("SET_LIST_MARKETING", list);
        commit("SET_LOADING", true);
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async insertMarketing({ commit, dispatch }, data) {
    var config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_marketing",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        let model = { name: "", description: "", position: "", status: 1 };

        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          dispatch("fetchDataMarketing", model);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async readMarketing({ commit }, id) {
    var config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_marketing?id=${id}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        if (data.estadoflag) {
          commit("SET_MARKETING", data.data[0]);
        } else {
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async updateMarketing({ dispatch }, data) {
    var config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_marketing",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        let model = { name: "", description: "", position: "", status: 1 };
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          dispatch("fetchDataMarketing", model);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async lastPositionMarketing({ commit }) {
    var config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `ultima_posicion_marketing?` +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        if (data.estadoflag) {
          commit("SET_POSITION_MARKETING", data.data[0]);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async ExportMarketing({ commit },data) {
    var config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `exportar_list_marketing`,
      params: data,
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Reporte Listado Marketing ${moment().format(
            "DD_MM_YYYY_h_mm_ss",
          )} .xlsx`,
        );
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.error(error);
      });
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
