import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  tipo: "filter",
  drawer: false,
  lstTown: [],
  filtros: {
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  },
  model: {
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  },
};
let mutations = {
  SET_LIST_TOWN(state, data) {
    state.lstTown = data;
  },
};
let actions = {
  async GetListTown({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_town?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_pais=${
          state.filtros.id_pais ? state.filtros.id_pais : ""
        }&id_city=${
          state.filtros.id_city ? state.filtros.id_city : ""
        }&id_state=${
          state.filtros.id_state ? state.filtros.id_state : ""
        }&id_town=${state.filtros.id_town ? state.filtros.id_town : ""}&code=${
          state.filtros.code ? state.filtros.code : ""
        }&name=${state.filtros.name ? state.filtros.name : ""}&description=${
          state.filtros.description ? state.filtros.description : ""
        }&status=${state.filtros.status ? state.filtros.status : ""}`,

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
            commit("SET_LIST_TOWN", data.data);
          } else {
            commit("SET_LIST_TOWN", []);
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
  async setTown({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_town`,
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
  async ActualizarTown({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_town`,
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
