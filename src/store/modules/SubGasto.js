import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  tipo: "filter",
  drawer: false,
  lstSubGasto: [],
  filtros: {
    id: "",
    id_gasto: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: "null",
    mostrarflag: "null",
  },
  model: {
    id: "",
    id_gasto: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: true,
    mostrarflag: true,
  },
};
let mutations = {
  SET_LIST_SUBSUBGASTO(state, data) {
    state.lstSubGasto = data;
  },
};
let actions = {
  async GetListSubGasto({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_subgasto?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_gasto=${
          state.filtros.id_gasto ? state.filtros.id_gasto : ""
        }&code=${state.filtros.code ? state.filtros.code : ""}&description=${
          state.filtros.description ? state.filtros.description : ""
        }&status=${
          state.filtros.status == "null" ? "" : state.filtros.status
        }&calculoflag=${
          state.filtros.calculoflag == "null" ? "" : state.filtros.calculoflag
        }&mostrarflag=${
          state.filtros.mostrarflag == "null" ? "" : state.filtros.mostrarflag
        }`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);

          if (data.estadoflag == true) {
            commit("SET_LIST_SUBSUBGASTO", data.data);
          } else {
            commit("SET_LIST_SUBSUBGASTO", []);
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
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  },
  async getValidateCodeSubGasto() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_code_subgasto?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&code=${state.model.code}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async setSubGasto({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_subgasto`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.model,
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  },
  async ActualizarSubGasto({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_subgasto`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.model,
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
