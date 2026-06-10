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
  SET_LIST_INGRESO(state, data) {
    state.list = data;
  },
  SET_INGRESO(state, data) {
    state.record = data;
  },
};
const actions = {
  async cargarIngreso({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_ingreso?id_branch=${
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
        if (data.estadoflag) {
          commit("SET_LIST_INGRESO", data.data);
        } else {
          commit("SET_LIST_INGRESO", []);
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
  async fetchDataIngreso({ commit }, data) {
    commit("SET_LOADING", false);
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_ingreso?` +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }` +
        `&code=${encodeURIComponent(data.code)}` +
        `&description=${encodeURIComponent(data.description)}` +
        `&calculoflag=${data.calculoflag}` +
        `&status=${data.status}`,
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
          commit("SET_LIST_INGRESO", data.data);
          commit("SET_LOADING", true);
        } else {
          commit("SET_LIST_INGRESO", []);
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
  async insertIngreso({ commit, dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertar_ingreso",
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
          let data = {
            code: "",
            description: "",
            calculoflag: "",
            status: true,
          };
          dispatch("fetchDataIngreso", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async readIngreso({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_ingreso?id=${id}`,
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
          commit("SET_INGRESO", data.data[0]);
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
  async updateIngreso({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_ingreso",
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
          let data = {
            code: "",
            description: "",
            calculoflag: "",
            status: true,
          };
          dispatch("fetchDataIngreso", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async ActualizarCXC({}, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_cxc",
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
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async ActualizarCXP({}, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_cxp",
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
