import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  tipo: "filter",
  drawer: false,
  lstItemServices: [],
  filtros: {
    id: "",
    id_groupservices: "",
    code: "",
    name: "",
    description: "",
    id_branch: "",
    status: 1,
  },
  model: {
    id: "",
    id_groupservices: "",
    code: "",
    name: "",
    description: "",
    id_branch: "",
    status: "",
  },
};
let mutations = {
  SET_LIST_ITEM_SERVICES(state, data) {
    state.lstItemServices = data;
  },
};
let actions = {
  async GetListItemServices({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_itemservices?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_groupservices=${
          state.filtros.id_groupservices ? state.filtros.id_groupservices : ""
        }&code=${state.filtros.code ? state.filtros.code : ""}&name=${
          state.filtros.name ? state.filtros.name : ""
        }&description=${
          state.filtros.description ? state.filtros.description : ""
        }&status=${state.filtros.status == "null" ? "" : state.filtros.status}`,

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
            commit("SET_LIST_ITEM_SERVICES", data.data);
          } else {
            commit("SET_LIST_ITEM_SERVICES", []);
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
  async setItemServices({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_itemservices`,
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
  async ActualizarItemServices({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_itemservices`,
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
