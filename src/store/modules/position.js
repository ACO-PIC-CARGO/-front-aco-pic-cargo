import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  tipo: "filter",
  drawer: false,
  lstPosition: [],
  lstUsuarioNoAsignado: [],
  filtros: {
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    estado: true,
  },
  model: {
    id: "",
    code: "",
    name: "",
    description: "",
    estado: "",
    modules_position: [],
    button_position: [],
    user_position: [],
  },
};
let mutations = {
  SET_LIST_POSITION(state, data) {
    state.lstPosition = data;
  },
  SET_MODEL(state, data) {
    // console.log(data[0]);
    state.model = data[0];
  },
  SET_USUARIO_NO_ASIGNADO(state, data) {
    // console.log(data[0]);
    state.lstUsuarioNoAsignado = data;
  },
};
let actions = {
  async cargarPosition({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_posicion?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
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
            commit("SET_LIST_POSITION", data.data);
          } else {
            commit("SET_LIST_POSITION", []);
            Swal.fire({
              icon: data.status == "401" ? "error" : "info",
              text: data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && data.estado == "401") {
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
  async GetListPosition({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_posicion?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&code=${state.filtros.code ? state.filtros.code : ""}&name=${
          state.filtros.name ? state.filtros.name : ""
        }&description=${
          state.filtros.description ? state.filtros.description : ""
        }&estado=${state.filtros.estado == "null" ? "" : state.filtros.estado}`,

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
            commit("SET_LIST_POSITION", data.data);
          } else {
            commit("SET_LIST_POSITION", []);
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
  async verPosition({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `ver_posicion?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id=${state.model.id}`,

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
            commit("SET_MODEL", data.data);
          } else {
            commit("SET_MODEL", []);
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
  async cargarUsuarioNoAsignadoPosicion({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_usuario_no_asignado_posicion?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id=${state.model.id}`,

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
            commit("SET_USUARIO_NO_ASIGNADO", data.data);
          } else {
            commit("SET_USUARIO_NO_ASIGNADO", []);
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
  async setPosition({ commit }) {
    let data = {
      id: state.model.id,
      user_position: state.model.user_position,
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `insertar_actualizar_posicion`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
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
  async ActualizarEstadoPosition({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `cambiar_estado_posicion`,
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
