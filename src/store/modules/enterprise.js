import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
import user from "./user";
import security from "./security";
const state = {
  lstCuentas: [],
  list: [],
  response: [],
  record: {},
  loading: false,
  model: {
    id_logo: "",
    document: "",
    trade_name: "",
    business_name: "",
    phone: "",
    slogan: "",
    address: "",
    status: "1",
    id_pais: "",
    id_state: "",
    id_city: "",
    id_town: "",
    id_document: "",
    ic: "",
  },
  data: {
    trade_name: "",
    id_pais: "",
    names: "",
    surname: "",
    second_surname: "",
    email: "",
    phone: "",
    clave: "",
  },
  impuesto: {},
  step: 1,
  inicioFlag: true,
  datoEmpresaFlag: false,
  datoAdminFlag: false,
  datoProveedorFlag: false,
  datoClienteFlag: false,
  datoCostosFlag: false,
};

const mutations = {
  SET_LOADING(state, data) {
    state.loading = data;
  },
  SET_LIST_ENTERPRISE(state, data) {
    state.list = data;
  },
  SET_ENTERPRISE(state, data) {
    state.record = data;
  },
  SET_IMPUESTO_X_EMPRESA(state, data) {
    state.impuesto = data[0];
  },
  SET_CUENTAS_X_EMPRESA(state, data) {
    state.lstCuentas = data;
  },
};
const actions = {
  async fetchDataEnterprise({ commit }, data) {
    commit("SET_LOADING", false);
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_enterprise?` +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }` +
        `&document=${encodeURIComponent(data.document)}` +
        `&trade_name=${encodeURIComponent(data.trade_name)}` +
        `&business_name=${encodeURIComponent(data.business_name)}` +
        `&address=${encodeURIComponent(data.address)}` +
        `&status=${data.status}` +
        `&id_pais=${data.id_pais}` +
        `&id_state=${data.id_state}` +
        `&id_city=${data.id_city}` +
        `&id_town=${data.id_town}` +
        `&id_document=${data.id_document}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };

    axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        let list = data.estadoflag ? data.data : [];
        commit("SET_LIST_ENTERPRISE", list);
        commit("SET_LOADING", true);
        if (!data.estadoflag) {
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
  async insertEnterprise({ commit }) {
    let data = {
      user: user.state.model,
      enterprise: state.model,
    };
    console.log(user.state.model);
    console.log(state.model);
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertar_enterprise",
      headers: {
        "Content-Type": "application/json",
       
      },
      data: data,
    };

    axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("listado");
          }
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async readEnterprise({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_enterprise?id=${id}`,
      headers: {
        "Content-Type": "application/json",
       
      },
    };

    axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_ENTERPRISE", data.data[0]);
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
  async updateEnterprise({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_enterprise",
      headers: {
        "Content-Type": "application/json",
       
      },
      data: data,
    };

    axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          const currentRoute = router.currentRoute;
          if (currentRoute.name !== "listEnterprise") {
            router.push({ name: "listEnterprise" });
          } else {
            let data = {
              id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
                .id_branch,
              document: "",
              trade_name: "",
              business_name: "",
              address: "",
              status: "",
              id_pais: "",
              id_state: "",
              id_city: "",
              id_town: "",
              id_document: "",
              status: 1,
            };
            dispatch("fetchDataEnterprise", data);
          }
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async RegistroNuevaEmpresa({ commit, dispatch }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "registro_nueva_empresa",
      headers: {
        "Content-Type": "application/json",
       
      },
      data: state.data,
    };

    await axios(config)
      .then((response) => {
        sessionStorage.setItem(
          "security",
          response.data.data[0].data_users.id_secutiry
        );

        let dataUser = response.data.data[0].data_users; // es un array
        let dataBranch = response.data.data[0].data_branch;
        dataUser[0].id_user = dataUser[0].id;
        dataUser[0].id = dataUser[0].id_entitie;
        sessionStorage.setItem("dataUser", JSON.stringify(dataUser));
        sessionStorage.setItem("auth-token", response.data.token);
        sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
        localStorage.setItem("dataUser", JSON.stringify(dataUser));
        localStorage.setItem("auth-token", response.data.token);
        localStorage.setItem("dataBranch", JSON.stringify(dataBranch));

        // dispatch("security/", null, { root: true });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
    return true;
  },
  async enviarCorreoValidacion() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `enviar_codigo_validacion_email?email=${state.data.email}`,
      headers: {
        "Content-Type": "application/json",
       
      },
      data: state.data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async validarCodigoVerificacion({}, eliminar = false) {
    let res = [];
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_token_registro?email=${state.data.email}&codigo=${state.data.codigo}&eliminartoken=${eliminar}`,
      headers: {
        "Content-Type": "application/json",
       
      },
      data: state.data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        res = data;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
    return res;
  },
  async validarCorreoRegistro() {
    let res = null;
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_correo_registro?email=${state.data.email}`,
      headers: {
        "Content-Type": "application/json",
       
      },
      data: state.data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        res = data;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
    return res;
  },
  async obtenerImpuestoXEmpresa({ commit }, id_branch = null) {
    let branch = id_branch
      ? id_branch
      : JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "obtener_impuestos_branch?id_branch=" +
        branch,
      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_IMPUESTO_X_EMPRESA", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async listarCuentaEmpresa({ commit }, id_branch = null) {
    let branch = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "listado_cuentas_empresa?id_branch=" +
        branch,
      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        commit("SET_CUENTAS_X_EMPRESA", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async registrarCuentaEmpresa({ commit, dispatch }, data) {
    let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
    data.id_branch = id_branch;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "banco_registrar",
      headers: {
       
        "Content-Type": "application/json",
      },
      data,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
        dispatch("listarCuentaEmpresa");
      })
      .catch(function (error) {
        console.log(error);
      });
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
