import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  tipo: "filter",
  drawer: false,
  lstState: [],
  StateFilter: {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  },
  StateModel: {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  },
};
let mutations = {
  SET_LIST_STATE(state, data) {
    state.lstState = data;
  },
};
let actions = {
  async GetListState({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_state?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&name=${state.StateFilter.name}&description=${
          state.StateFilter.description ? state.StateFilter.description : ""
        }&id_pais=${
          state.StateFilter.id_pais ? state.StateFilter.id_pais : ""
        }&status=${state.StateFilter.status}&code=${
          state.StateFilter.code ? state.StateFilter.code : ""
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
            commit("SET_LIST_STATE", data.data);
          } else {
            commit("SET_LIST_STATE", []);
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
  async setState({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_state`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.StateModel,
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
  async ActualizarState({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_state`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.StateModel,
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
