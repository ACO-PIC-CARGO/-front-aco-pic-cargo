import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
let state = {
  tipo: "filter",
  drawer: false,
  lstUsers: [],
  filtros: {
    users: "",
    nombrecompleto: "",
    id_document: "",
    document: "",
    phone: "",
    email: "",
    status: "1",
    
  },
  model: {
    id: "",
    id_entitie: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    users: "",
    id_document: "",
    document: "",
    id_sex: "",
    status: "1",
    departamento: "1",
    names: "",
    surname: "",
    second_surname: "",
    socialprincipal: "",
    socialsecundary: "",
    phone: "",
    address: "",
    birthday: "",
    email: "",cambiarClave: false,
    clave:"",
    confirmclave:""
  },
  sucursales: [],
  positions: [],
};
let mutations = {
  SET_LIST_USERS(state, data) {
    state.lstUsers = data;
  },
};
let actions = {
  async GetListUsers({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_usuarios?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&users=${
          state.filtros.users ? state.filtros.users : ""
        }&nombrecompleto=${
          state.filtros.nombrecompleto ? state.filtros.nombrecompleto : ""
        }&id_document=${
          state.filtros.id_document ? state.filtros.id_document : ""
        }&document=${
          state.filtros.document ? state.filtros.document : ""
        }&phone=${state.filtros.phone ? state.filtros.phone : ""}&email=${
          state.filtros.email ? state.filtros.email : ""
        }&status=${
          state.filtros.status === "null" ? "" : state.filtros.status
        }`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };

    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_USERS", data.data);
        } else {
          commit("SET_LIST_USERS", []);
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
  },
  async GetVerUsers({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `ver_usuario?&id_branch=${
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

          if (data.estadoflag == true) {
            state.model = data.data[0];
            state.positions = data.data[0].positions;
            state.sucursales = data.data[0].sucursales;
            sessionStorage.setItem("auth-token", data.token);
          } else {
            Swal.fire({
              icon: "warning",
              title: "Aviso",
              text: data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      let res = error.response;
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      }).then((resSwal) => {
        if (resSwal.isConfirmed && res.status == "401") {
          router.push({ name: "Login" });
          setTimeout(() => {
            window.location.reload();
          }, 10);
        }
      });
      throw error;
    }
  },

  async validateUserUsuario() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_user_usuarios?users=${state.model.users}`,

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
  async validateEmailUsuario() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_email_usuarios?email=${state.model.email}`,

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
  async validateDocumentUsuario() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_document_usuarios?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_document=${state.model.id_document}&document=${
          state.model.document
        }`,

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

  async setUsers({ commit }) {
    let datos = state.model;
    datos.id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
    datos.positions = state.positions;
    datos.sucursales = state.sucursales;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_usuario`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: datos,
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((res) => {
            if (res.isConfirmed) {
              router.push({ name: "listUser" });
            }
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  },
  async ActualizarUsers({ commit }) {
    let datos = state.model;
    datos.id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
    datos.positions = state.positions;
    datos.sucursales = state.sucursales;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_usuario`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: datos,
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((res) => {
            if (res.isConfirmed) {
              router.push({ name: "listUser" });
            }
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  },
  async cambiarEstadoUsers({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `cambiar_estado_usuario`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.model,
    };
    try {
      await axios(config).then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        });
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
