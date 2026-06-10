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
  SET_LIST_PERFORMANCE(state, data) {
    state.list = data;
  },
  SET_PERFORMANCE(state, data) {
    state.record = data;
  },
};
const actions = {
  async fetchDataPerformance({ commit }, data) {
    commit("SET_LOADING", false);
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_performance?` +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }` +
        `&code=${encodeURIComponent(data.code)}` +
        `&description=${encodeURIComponent(data.description)}` +
        `&status=${data.status}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
   await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        let list = data.estadoflag ? data.data : [];
        commit("SET_LIST_PERFORMANCE", list);
        commit("SET_LOADING", true);

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
  async insertPerformance({ commit, dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertar_performance",
      headers: {
        "Content-Type": "application/json",
       
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
          let data = {
            code: "",
            description: "",
            status: 1,
          };
          dispatch("fetchDataPerformance", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async readPerformance({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_performance?id=${id}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };

   await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_PERFORMANCE", data.data[0]);
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
  async updatePerformance({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_performance",
      headers: {
        "Content-Type": "application/json",
       
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
          let data = {
            code: "",
            description: "",
            status: 1,
          };
          dispatch("fetchDataPerformance", data);
        });
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
