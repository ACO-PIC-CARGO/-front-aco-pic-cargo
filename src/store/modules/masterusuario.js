import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import miMixin from "../../components/mixins/funciones";
import moment from "moment";
import router from "@/router";

const state = {
  tipo: "filter",
  drawer: false,
  lstCanales: [],
  lstTipoProveedor: [],
  lstPercepcionAduana: [],
  lstTipoTransaccion: [],
  lstTipoTelefono: [],
  lstImpuesto: [],
  lstNotasQuote: [],
  lstTipoPersona: [],
  lstImpRenta: [],
  filtros: {
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    escomunflag: false,
  },
  model: {
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    id_branch: "",
    escomunflag: "",
  },
};
const mutations = {
  SET_CARGAR_CANALES(state, data) {
    state.lstCanales = data;
  },
  SET_CARGAR_TIPO_PROVEEDOR(state, data) {
    state.lstTipoProveedor = data;
  },
  SET_CARGAR_PERCEPCION_ADUANA(state, data) {
    state.lstPercepcionAduana = data;
  },
  SET_CARGAR_TIPO_TRANSACCION(state, data) {
    state.lstTipoTransaccion = data;
  },
  SET_CARGAR_TIPO_TELEFONO(state, data) {
    state.lstTipoTelefono = data;
  },
  SET_CARGAR_TIPO_PERSONA(state, data) {
    state.lstTipoPersona = data;
  },
  SET_LISTAR_IMPUESTOS(state, data) {
    state.lstImpuesto = data;
  },
  SET_LISTAR_NOTAS_COSTO(state, data) {
    state.lstNotasQuote = data;
  },
  SET_CARGAR_IMPUESTO_RENTA(state, data) {
    state.lstImpRenta = data;
  },
};
const actions = {
  async ActualizarMasterDetalle({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_master_detalle`,
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
  async GetListImpuestos({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_master_detalle_impuesto?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_master=${state.filtros.id_master}&valorcodigo=${
          state.filtros.valorcodigo == "" || state.filtros.valorcodigo == null
            ? ""
            : state.filtros.valorcodigo
        }&codigo01=${
          state.filtros.codigo01 == "" || state.filtros.codigo01 == null
            ? ""
            : state.filtros.codigo01
        }&codigo02=${state.filtros.codigo02}&description=${
          state.filtros.description == "" || state.filtros.description == null
            ? ""
            : state.filtros.description
        }&status=${state.filtros.status}&escomunflag=${
          state.filtros.escomunflag
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
            commit("SET_LISTAR_IMPUESTOS", data.data);
          } else {
            commit("SET_LISTAR_IMPUESTOS", []);
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
  async GetListNotasCotizacion({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_master_detalle_notas_cotizacion?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_master=${state.filtros.id_master}&valorcodigo=${
          state.filtros.valorcodigo == "" || state.filtros.valorcodigo == null
            ? ""
            : state.filtros.valorcodigo
        }&codigo01=${state.filtros.codigo01}&codigo02=${
          state.filtros.codigo02 == "" || state.filtros.codigo02 == null
            ? ""
            : state.filtros.codigo02
        }&description=${
          state.filtros.description == "" || state.filtros.description == null
            ? ""
            : state.filtros.description
        }&status=${
          state.filtros.status == null ? "" : state.filtros.status
        }&escomunflag=${state.filtros.escomunflag}`,

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
            commit("SET_LISTAR_NOTAS_COSTO", data.data);
          } else {
            commit("SET_LISTAR_NOTAS_COSTO", []);
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
  async GetListTipoTelefono({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_master_detalle_tipotelefono?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_master=${state.filtros.id_master}&valorcodigo=${
          state.filtros.valorcodigo == "" || state.filtros.valorcodigo == null
            ? ""
            : state.filtros.valorcodigo
        }&codigo01=${
          state.filtros.codigo01 == "" || state.filtros.codigo01 == null
            ? ""
            : state.filtros.codigo01
        }&codigo02=${state.filtros.codigo02}&description=${
          state.filtros.description == "" || state.filtros.description == null
            ? ""
            : state.filtros.description
        }&status=${state.filtros.status}&escomunflag=${
          state.filtros.escomunflag
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
            commit("SET_CARGAR_TIPO_TELEFONO", data.data);
          } else {
            commit("SET_CARGAR_TIPO_TELEFONO", []);
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
  async cargarMasterDetalleCanal({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_canal?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    
    axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_CARGAR_CANALES", response.data.data);
        } else {
          commit("SET_CARGAR_CANALES", []);
        }
      });
  },
  async cargarMasterDetalleTipoProveedor({ commit }) {
    var headers = {
     

      "Content-Type": "application/json",
    };

    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_tipo_proveedor?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.estadoflag == true) {
        commit("SET_CARGAR_TIPO_PROVEEDOR", response.data.data);
      } else {
        // Swal.fire({
        //   icon: "error",
        //   text: data.mensaje,
        // });
        commit("SET_CARGAR_TIPO_PROVEEDOR", []);
      }
    });
  },
  async cargarMasterDetallePercepcionAduana({ commit }) {
    var headers = {
     

      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_percepcion_aduana?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.estadoflag == true) {
        commit("SET_CARGAR_PERCEPCION_ADUANA", response.data.data);
      } else {
        commit("SET_CARGAR_PERCEPCION_ADUANA", []);
      }
    });
  },
  async cargarMasterDetalleTipoTransaccion({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_tipo_percepcion?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.estadoflag == true) {
        commit("SET_CARGAR_TIPO_TRANSACCION", response.data.data);
      } else {
        commit("SET_CARGAR_TIPO_TRANSACCION", []);
      }
    });
  },
  async cargarTipoTelefono({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_tipo_telefono?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.estadoflag == true) {
        commit("SET_CARGAR_TIPO_TELEFONO", response.data.data);
      } else {
        commit("SET_CARGAR_TIPO_TELEFONO", []);
      }
    });
  },
  async RegistrarMasterDetalleTipoTelefono({ commit }) {
    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN + `insertar_master_detalle_tipotelefono`,
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
  async RegistrarMasterDetalleNotasCotizacion({ commit }) {
    var config = {
      method: "post",
      url:
        process.env.VUE_APP_URL_MAIN +
        `insertar_master_detalle_notas_cotizacion`,
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
  async cargarTipoPersona({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_tipo_persona?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_CARGAR_TIPO_PERSONA", response.data.data);
        } else {
          commit("SET_CARGAR_TIPO_PERSONA", []);
        }
      });
  },
  async cargarImpuestoRenta({ commit }) {
    var headers = {
     
      "Content-Type": "application/json",
    };

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_master_detalle_impuesto_renta?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: headers,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_CARGAR_IMPUESTO_RENTA", response.data.data);
        } else {
          commit("SET_CARGAR_IMPUESTO_RENTA", []);
        }
      });
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
