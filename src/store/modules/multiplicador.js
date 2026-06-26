import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";

const state = {
  list: [],
  response: [],
  record: {},
  shipments: [],
  loading: false,
};

const mutations = {
  SET_LOADING(state, data) {
    state.loading = data;
  },
  SET_LIST_SHIPMENT(state, data) {
    state.shipments = data;
  },
  SET_LIST_MULTIPLICADOR(state, data) {
    state.list = data;
  },
  SET_MULTIPLICADOR(state, data) {
    state.record = data;
  },
};
const actions = {
  async fetchDataCargarShipment({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_shipment?` +
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
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_LIST_SHIPMENT", data.data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async fetchDataMultiplicador({ commit }, data) {
    commit("SET_LOADING", false);
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_multiplicador?` +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }` +
        `&code=${encodeURIComponent(data.code)}` +
        `&name=${encodeURIComponent(data.name)}` +
        `&description=${encodeURIComponent(data.description)}` +
        `&id_shipment=${data.id_shipment}` +
        `&status=${data.status}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };
   await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_LIST_MULTIPLICADOR", data.data);
          commit("SET_LOADING", true);
        } else {
          commit("SET_LIST_MULTIPLICADOR", []);
          commit("SET_LOADING", true);
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
  async readMultiplicador({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_multiplicador?id=${id}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };

   await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_MULTIPLICADOR", data.data[0]);
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
  async updateMultiplicador({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_multiplicador",
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
            name: "",
            description: "",
            id_shipment: "",
            status: 1,
          };
          dispatch("fetchDataMultiplicador", data);
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
