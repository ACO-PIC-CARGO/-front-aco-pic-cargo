import axios from "axios";
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  tipo: "filter",
  drawer: false,
  lstPort: [],
  PortFilter: {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  },
  PortModel: {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  },
};
let mutations = {
  SET_LIST_PORT(state, data) {
    state.lstPort = data;
  },
};
let actions = {
  async GetListPort({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_puerto?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&name=${state.PortFilter.name}&description=${
          state.PortFilter.description
        }&id_pais=${state.PortFilter.id_pais}&status=${
          state.PortFilter.status
        }&id_transporte=${state.PortFilter.id_transporte}&code=${
          state.PortFilter.code
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);

          if (data.estadoflag == true) {
            commit("SET_LIST_PORT", data.data);
          } else {
            commit("SET_LIST_PORT", []);
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
  async setPuerto({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_puerto`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: state.PortModel,
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
  async ActualizarPuerto({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_puerto`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: state.PortModel,
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
  async verPuerto({ commit }, params) {
    let res = null;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_puerto`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      params: params,
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          res = data.data[0];
          
        })
        .catch(function (error) {
          console.error(error);
        });
      console.log(res);
      return res;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
