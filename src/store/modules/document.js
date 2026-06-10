import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";

const state = {
  list: [],
  response: [],
  record: {},
  loading: false,
};

const mutations = {
  SET_LOADING(state, data) {
    state.loading = data;
  },
  SET_LIST_DOCUMENT(state, data) {
    state.list = data;
  },
  SET_DOCUMENT(state, data) {
    state.record = data;
  },
  ADD_DOCUMENT(state, data) {
    state.response = data;
  },
};
const actions = {
  async fetchDataDocument({ commit }, data) {
    commit("SET_LOADING", false);
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_documents?` +
        `code=${encodeURIComponent(data.code)}` +
        `&name=${encodeURIComponent(data.name)}` +
        `&description=${encodeURIComponent(data.description)}` +
        `&status=${data.status}` +
        `&id_branch=${
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
        let list = data.estadoflag ? data.data : [];
        commit("SET_LIST_DOCUMENT", list);
        commit("SET_LOADING", true);

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
        console.error("Error al obtener los datos:", error);
      });
  },
  async insertDocument({ commit, dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertar_documents",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          let data = { name: "", description: "", code: "", status: 1 };
          dispatch("fetchDataDocument", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async readDocument({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_documents?id=${id}`,
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_DOCUMENT", data.data[0]);
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
  async updateDocument({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_documents",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
            showCancelButton: false,
            confirmButtonText: "Ok",
          }).then((result) => {
            let data = { name: "", description: "", code: "", status: 1 };
            dispatch("fetchDataDocument", data);
          });
        }
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
