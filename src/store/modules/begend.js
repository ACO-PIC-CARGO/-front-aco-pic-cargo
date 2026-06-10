import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
let state = {
  tipo: "filter",
  drawer: false,
  lstBegend: [],
  filtros: {
    id: "",
    position: "",
    code: "",
    name: "",
    description: "",
    color: "",
    status: "1",
  },
  model: {
    id: "",
    position: "",
    code: "",
    name: "",
    description: "",
    color: "",
    status: "1",
  },
};
let mutations = {
  SET_LIST_BEGEND(state, data) {
    state.lstBegend = data;
  },
};
let actions = {
  async GetListBegend({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_begend?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&status=${state.filtros.status ? state.filtros.status : ""}&position=${
          state.filtros.position ? state.filtros.position : ""
        }&code=${state.filtros.code ? state.filtros.code : ""}&name=${
          state.filtros.name ? state.filtros.name : ""
        }&description=${
          state.filtros.description ? state.filtros.description : ""
        }&color=${state.filtros.color ? state.filtros.color : ""}`,

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
            commit("SET_LIST_BEGEND", data.data);
          } else {
            commit("SET_LIST_BEGEND", []);
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
  async getValidatePositionBegend() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_begend?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&position=${state.model.position}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
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

  async setBegend({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_begend`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
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
  async getValidatePositionActualizarBegend() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_actualizar_begend?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id=${state.model.id}&position=${state.model.position}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
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
  async ActualizarBegend({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_begend`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
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
