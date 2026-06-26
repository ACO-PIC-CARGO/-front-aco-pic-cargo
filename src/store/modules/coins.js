import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";

const state = {
  list: [],
  response: [],
  record: {},
  itemsCoinsList: [],
  loading: false,
};

const mutations = {
  SET_LOADING(state, data) {
    state.loading = data;
  },
  SET_LIST_COINS(state, data) {
    state.list = data;
  },
  SET_COINS(state, data) {
    state.record = data;
  },
  SET_LIST_COINS_CARGAR(state, data) {
    state.itemsCoinsList = data;
  },
};
const actions = {
  async fetchDataCoins({ commit }, data) {
    commit("SET_LOADING", false);
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_coins?` +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }` +
        `&code=${encodeURIComponent(data.code)}` +
        `&symbol=${encodeURIComponent(data.symbol)}` +
        `&acronym=${encodeURIComponent(data.acronym)}` +
        `&name=${encodeURIComponent(data.name)}` +
        `&description=${encodeURIComponent(data.description)}` +
        `&status=${data.status}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
   await axios(config)
      .then((response) => {
        let data = response.data;
        let list = data.estadoflag ? data.data : [];
        sessionStorage.setItem("auth-token", data.token);
        commit("SET_LIST_COINS", list);
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
        console.log("Error al obtener los datos:", error);
      });
  },
  async insertCoins({ commit, dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertar_coins",
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
            symbol: "",
            acronym: "",
            name: "",
            description: "",
            status: 1,
          };
          dispatch("fetchDataCoins", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async readCoins({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_coins?id=${id}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };

   await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_COINS", data.data[0]);
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
  async updateCoins({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_coins",
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
            symbol: "",
            acronym: "",
            name: "",
            description: "",
            status: 1,
          };
          dispatch("fetchDataCoins", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async getCoinsListCargar({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `getCoinsList?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        if (data.estadoflag == true) {
          commit("SET_LIST_COINS_CARGAR", response.data.data);
        } else {
          commit("SET_LIST_COINS_CARGAR", []);
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
