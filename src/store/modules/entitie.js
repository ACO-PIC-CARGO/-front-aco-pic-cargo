import axios from "axios";
import Swal from "sweetalert2";
import router from "@/router";
import moment from "moment";
import StatePrincipal from "./../index";
// import { isReadonly } from "vue";
// console.log(router )
const state = {
  dataEntitiePost: [],
  persona: [],
  statusEntitie: false,
  lstProveedor: [],
  lstPersona: [],
  lstEmails: [],
  lstDatosTarifas: [],
  itemsImportacion: [],
  itemsExportacion: [],
  titleVal: "",
  filtro: {
    correlativo: "",
    bussiness_name: "",
    id_document: "",
    id_pais: "",
    id_state: "",
    status: "1",
    id_tipoproveedor: "",
    names: "",
    surname: "",
    second_surname: "",
    nro_documento: "",
    nombrecompleto: "",
    producto: "",
  },
  proveedor: {
    correlativo: "",
    bussiness_name: "",
    id_role: 0,
    id_tipotransaccion: 56,
    id_tipodocumento: 0,
    id_pais: 0,
    id_ciudad: 0,
    dias_credito: 0,
    dias_sobreestadia: 0,
    dias_almacenaje: 0,
    direccion: "",
    notas: "",
    nro_documento: "",
    emailaddress: "",
    nombrecompleto: "",
    id_tipoproveedor: "",
    proveedorprincipalflag: false,
    convenioActual: {
      dias_credito: 0,
      fecha: "",
      email_soporte: "",
    },
    telefonoActual: {
      id_tipotelefono: "",
      telefono: "",
    },
    contactoActual: {
      nombre: "",
      id_tipotelefono: "",
      telefono: "",
    },
  },
  cliente: {
    correlativo: "",
    names: "",
    surname: "",
    second_surname: "",
    birthday: "",
    id_role: 0,
    id_tipotransaccion: 56,
    id_tipodocumento: 0,
    id_pais: 0,
    id_sex: 0,
    id_ciudad: 0,
    dias_credito: 0,
    dias_sobreestadia: 0,
    dias_almacenaje: 0,
    direccion: "",
    notas: "",
    nro_documento: "",
    emailaddress: "",
    convenioActual: {
      dias_credito: 0,
      fecha: "",
      email_soporte: "",
    },
    telefonoActual: {
      id_tipotelefono: "",
      telefono: "",
    },
    contactoActual: {
      nombre: "",
      id_tipotelefono: "",
      telefono: "",
    },
    nombrecompleto: "",
  },
  lstTelefonos: [],
  lstContactos: [],
  lstInformacionBancaria: [],
  lstConvenios: [],
  lstTarifas: [],
  informacionEntrega: {},
  lstShippers: [],
  id: null,
  filtrarProveedor: false,
  stepper: 1,
  isEdit: false,
  isReadonly: false,
  showBtnSaveFlag: false,
  disabledBtnSave: false,
  isStep1Valid: true,
  isStep2Valid: true,
  isStep3Valid: true,
  isStep4Valid: true,
  isStep5Valid: true,
  isStep6Valid: true,
  lstProveedores_x_nombre: [],
  lstProveedores_x_documento: [],
};

const getters = {};

const mutations = {
  _setEntitie(state, dataEntitie) {
    if (dataEntitie.status == 200) {
      state.statusEntitie = true;
    } else {
      state.statusEntitie = false;
    }
  },
  SET_PERSONA(state, data) {
    state.persona = data;
  },
  SET_LIST_PROVEEDOR(state, data) {
    state.lstProveedor = data;
  },
  SET_LIST_PERSONA(state, data) {
    state.lstPersona = data;
  },
  SET_LIST_PROVEEDORES_X_NOMBRE(state, data) {
    state.lstProveedores_x_nombre = data;
  },
  SET_LIST_PROVEEDORES_X_DOCUMENTO(state, data) {
    state.lstProveedores_x_documento = data;
  },
  SET_LIST_DATOS_TARIFAS(state, data) {
    state.lstDatosTarifas = data;
  },
};

const actions = {
  async CargarPersona({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_persona?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: this.dataEntitiePost,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_PERSONA", data.data);
        } else {
          commit("SET_PERSONA", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async ListarPersonaTipoPersona({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_persona_tipo_persona?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: this.dataEntitiePost,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PERSONA", data.data);
        } else {
          commit("SET_LIST_PERSONA", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async guardarRolProveedor({ commit, dispatch }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_rol_proveedor`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id: state.lstPersona.map((persona) => {
          return persona.id;
        }),
        proveedorflag: state.lstPersona.map((persona) => {
          return persona.proveedorflag;
        }),
        clienteflag: state.lstPersona.map((persona) => {
          return persona.clienteflag;
        }),
        personalflag: state.lstPersona.map((persona) => {
          return persona.personalflag;
        }),
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          title: "Aviso",
          text: data.mensaje,
          allowOutsideClick: false,
          confirmButtonText: "Ok",
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getListProveedor({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listado_proveedor?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&correlativo=${
          state.filtro.correlativo ? state.filtro.correlativo : ""
        }&bussiness_name=${
          state.filtro.bussiness_name ? state.filtro.bussiness_name : ""
        }&id_document=${
          state.filtro.id_document ? state.filtro.id_document : ""
        }&nro_documento=${
          state.filtro.nro_documento ? state.filtro.nro_documento : ""
        }&id_tipoproveedor=${
          state.filtro.id_tipoproveedor ? state.filtro.id_tipoproveedor : ""
        }&producto=${
          state.filtro.producto ? state.filtro.producto : ""
        }&id_pais=${
          state.filtro.id_pais ? state.filtro.id_pais : ""
        }&id_state=${
          state.filtro.id_state ? state.filtro.id_state : ""
        }&status=${
          state.filtro.status == 1 || state.filtro.status == 0
            ? state.filtro.status
            : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: this.dataEntitiePost,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDOR", data.data);
        } else {
          commit("SET_LIST_PROVEEDOR", []);

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
        console.log(error);
      });
  },
  async getValidaRazonSocial({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_razon_social?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&razonsocial=${
          state.proveedor.bussiness_name ? state.proveedor.bussiness_name : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: this.dataEntitiePost,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDOR", data.data);
        } else {
          commit("SET_LIST_PROVEEDOR", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getValidaDocument({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_documento?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_tipodocumento=${state.proveedor.id_tipodocumento}&documento=${
          state.proveedor.nro_documento
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: this.dataEntitiePost,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDOR", data.data);
        } else {
          commit("SET_LIST_PROVEEDOR", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getVerProveedor({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `ver_proveedor?id=${router.currentRoute.params.id}`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };

    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (!!data.estadoflag) {
          let res = data.data[0];
          state.proveedor = res;

          state.proveedor.convenioActual = {
            dias_credito: 0,
            fecha: "",
            email_soporte: "",
          };
          state.proveedor.telefonoActual = {
            id_tipotelefono: "",
            telefono: "",
          };
          state.proveedor.contactoActual = {
            nombre: "",
            id_tipotelefono: "",
            telefono: "",
          };

          state.lstTelefonos = res.lsttelefonos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono.toString(),
            };
          });
          state.lstContactos = res.lstcontactos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono.toString(),
            };
          });
          state.lstConvenios = res.lstconvenios;
          state.lstTarifas = res.lsttarifas;
          state.lstInformacionBancaria = res.lstcuentas;
          state.lstEmails = res.lstemails;

          if (state.lstConvenios[0]) {
            state.proveedor.convenioActual = state.lstConvenios[0];
          }

          if (state.lstTelefonos[0]) {
            state.proveedor.telefonoActual = state.lstTelefonos[0];
          }

          if (state.lstContactos[0]) {
            state.proveedor.contactoActual = state.lstContactos[0];
          }
        } else {
          if (data.status == "401") {
            Swal.fire({
              icon: "error",
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
          } else {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: data.mensaje,
              allowOutsideClick: false,
              confirmButtonText: "Ir al listado",
            }).then((res) => {
              if (res.isConfirmed) {
                state.lstProveedor = [];
                router.push({
                  name: "listProveedor",
                });
              }
            });
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async guardarProveedor({ commit }) {
    let res = {};
    state.proveedor.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;
    state.proveedor.lstTelefonos = state.lstTelefonos;
    state.proveedor.lstContactos = state.lstContactos;
    state.proveedor.lstConvenios = state.lstConvenios;
    state.proveedor.lstTarifas = state.lstTarifas;
    state.proveedor.lstInformacionBancaria = state.lstInformacionBancaria;
    state.proveedor.lstEmails = state.lstEmails;
    state.proveedor.datosTarifa = [
      ...state.itemsImportacion,
      ...state.itemsExportacion,
    ];

    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `registrar_proveedor`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: state.proveedor,
    };

    await axios(config)
      .then(function (response) {
        let data = response.data;
        res = response.data;

        sessionStorage.setItem("auth-token", data.token);

        if (data.status == "401") {
          Swal.fire({
            icon: "error",
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
        } else {
          let quote = ["newQuote", "verQuote", "editQuote"];
          console.log(router.currentRoute.name);
          if (!quote.includes(router.currentRoute.name)) {
            Swal.fire({
              icon: !!data.estadoflag ? "success" : "error",
              title: "Aviso",
              text: data.mensaje,
              allowOutsideClick: false,
              confirmButtonText:
                StatePrincipal.state.modalEntitie == true
                  ? "Aceptar"
                  : "Ir al listado",
            }).then((res) => {
              if (res.isConfirmed) {
                if (StatePrincipal.state.modalEntitie == true) {
                  StatePrincipal.state.registroClienteFlag =
                    !StatePrincipal.state.registroClienteFlag;
                  StatePrincipal.state.entities.id = data.data[0].id_entitie;
                  StatePrincipal.state.modalEntitie = false;
                } else {
                  state.lstProveedor = [];
                  router.push({
                    name: "listProveedor",
                  });
                }
              }
            });
          } else {
            console.log(response);
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
  async actualizarProveedor({ commit }) {
    state.proveedor.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;
    state.proveedor.lstTelefonos = state.lstTelefonos;
    state.proveedor.lstContactos = state.lstContactos;
    state.proveedor.lstConvenios = state.lstConvenios;
    state.proveedor.lstTarifas = state.lstTarifas;
    state.proveedor.lstInformacionBancaria = state.lstInformacionBancaria;
    state.proveedor.lstEmails = state.lstEmails;

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_proveedor`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: state.proveedor,
    };

    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);

        if (data.status == "401") {
          Swal.fire({
            icon: "error",
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
        } else {
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            title: "Aviso",
            text: data.mensaje,
            allowOutsideClick: false,
            confirmButtonText: "Ir al listado",
          }).then((res) => {
            if (res.isConfirmed) {
              state.lstProveedor = [];
              router.push({
                name: "listProveedor",
              });
            }
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async eliminarPersona({ commit, dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `eliminar_proveedor`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          title: "Aviso",
          text: data.mensaje,
          allowOutsideClick: false,
          confirmButtonText: "Aceptar",
        });
      })
      .catch(function (error) {
        console.log(error);
      });
    dispatch("getListProveedor");
  },
  async telConctactoProveedor({ commit, dispatch }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + `tel_contacto_proveedor?id=${data.id}`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        let res = data.data[0];
        state.lstTelefono = res.lsttelefono.map((item) => {
          return {
            ...item,
            id_tipotelefono: item.id_tipotelefono
              ? item.id_tipotelefono.toString()
              : "",
          };
        });
        state.lstContactos = res.lstcontactos.map((item) => {
          return {
            ...item,
            id_tipotelefono: item.id_tipotelefono
              ? item.id_tipotelefono.toString()
              : "",
          };
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async exportListProveedor() {
    let headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer",
    };
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      correlativo: state.filtro.correlativo,
      bussiness_name: state.filtro.bussiness_name,
      id_document: state.filtro.id_document,
      id_pais: state.filtro.id_pais,
      id_state: state.filtro.id_state,
      status: state.filtro.status,
      id_tipoproveedor: state.filtro.id_tipoproveedor,
    };
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "El documento se descargará automaticamente",
      showConfirmButton: false,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
    await axios
      .post(
        process.env.VUE_APP_URL_MAIN + `export_list_proveedor`,
        data,
        headers,
      )
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        // let name = this.uuidv4();
        link.setAttribute(
          "download",
          `Listo Proveedor ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
      });
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "Documento Descargado",
      confirmButtonText: "Ok",
      showConfirmButton: true,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
  },
  async validarNombreProveedor({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_nombre_proveedor?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&nombre=${
          state.proveedor.nombrecompleto ? state.proveedor.nombrecompleto : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {},
    };

    await axios(config)
      .then(function (response) {
        let { data } = response;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDORES_X_NOMBRE", data.data);
        } else {
          commit("SET_LIST_PROVEEDORES_X_NOMBRE", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async validarDocumentoProveedor({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_documento_proveedor?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_tipodocumento=${
          state.proveedor.id_tipodocumento
            ? state.proveedor.id_tipodocumento
            : ""
        }&nro_documento=${
          state.proveedor.nro_documento ? state.proveedor.nro_documento : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {},
    };

    await axios(config)
      .then(function (response) {
        let { data } = response;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDORES_X_DOCUMENTO", data.data);
        } else {
          commit("SET_LIST_PROVEEDORES_X_DOCUMENTO", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  // CLIENTES
  async getListClientes({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listado_clientes?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&correlativo=${
          state.filtro.correlativo ? state.filtro.correlativo : ""
        }&nombrecompleto=${
          state.filtro.nombrecompleto ? state.filtro.nombrecompleto : ""
        }&id_document=${
          state.filtro.id_document ? state.filtro.id_document : ""
        }&nro_documento=${
          state.filtro.nro_documento ? state.filtro.nro_documento : ""
        }&id_pais=${
          state.filtro.id_pais ? state.filtro.id_pais : ""
        }&id_state=${
          state.filtro.id_state ? state.filtro.id_state : ""
        }&status=${
          state.filtro.status == 1 || state.filtro.status == 0
            ? state.filtro.status
            : ""
        }&id_tipoproveedor=${
          state.filtro.id_tipoproveedor ? state.filtro.id_tipoproveedor : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: this.dataEntitiePost,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDOR", data.data);
        } else {
          commit("SET_LIST_PROVEEDOR", []);

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
        console.log(error);
      });
  },
  async getValidaDocumentCliente({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_documento?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_tipodocumento=${state.cliente.id_tipodocumento}&documento=${
          state.cliente.nro_documento
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: this.dataEntitiePost,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDOR", data.data);
        } else {
          commit("SET_LIST_PROVEEDOR", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async guardarCliente({ commit }) {
    state.cliente.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;
    state.cliente.lstTelefonos = state.lstTelefonos;
    state.cliente.lstContactos = state.lstContactos;
    state.cliente.lstConvenios = state.lstConvenios;
    state.cliente.lstTarifas = state.lstTarifas;
    state.cliente.lstInformacionBancaria = state.lstInformacionBancaria;
    state.cliente.lstShippers = state.lstShippers;
    state.cliente.informacionEntrega = state.informacionEntrega;
    state.cliente.lstEmails = state.lstEmails;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `registrar_cliente`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: state.cliente,
    };

    await axios(config)
      .then(function (response) {
        // console.log(response)
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);

        if (data.status == "401") {
          Swal.fire({
            icon: "error",
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
        } else {
          let quote = ["newQuote", "verQuote", "editQuote"];
          console.log(router.currentRoute.name);

          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            title: "Aviso",
            text: data.mensaje,
            allowOutsideClick: false,
            confirmButtonText:
              StatePrincipal.state.modalEntitie == true
                ? "Aceptar"
                : "Ir al listado",
          }).then((res) => {
            if (res.isConfirmed) {
              if (StatePrincipal.state.modalEntitie == true) {
                console.log("ddddd", data.data[0]);
                StatePrincipal.state.registroClienteFlag =
                  !StatePrincipal.state.registroClienteFlag;
                StatePrincipal.state.entities.id = data.data[0].id_entitie;
                StatePrincipal.state.modalEntitie = false;
              } else {
                state.lstProveedor = [];
                router.push({
                  name: "listClientes",
                });
              }
            }
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async verCliente({ commit }, id = null) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `ver_cliente?id=${id ? id : router.currentRoute.params.id}`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (!!data.estadoflag) {
          let res = data.data[0];

          state.cliente = res;
          state.cliente.convenioActual = {
            dias_credito: 0,
            fecha: "",
            email_soporte: "",
          };
          state.cliente.telefonoActual = { id_tipotelefono: "", telefono: "" };
          state.cliente.contactoActual = {
            nombre: "",
            id_tipotelefono: "",
            telefono: "",
          };

          state.lstTelefonos = res.lsttelefonos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono.toString(),
            };
          });
          state.lstContactos = res.lstcontactos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono.toString(),
            };
          });
          state.lstConvenios = res.lstconvenios;
          state.lstTarifas = res.lsttarifas;
          state.lstInformacionBancaria = res.lstcuentas;
          state.lstShippers = res.lstshippers;
          state.lstEmails = res.lstemails;
          state.informacionEntrega = res.informacionentrega[0] || {
            status: true,
          };

          if (state.lstConvenios[0]) {
            state.cliente.convenioActual = state.lstConvenios[0];
          }

          if (state.lstTelefonos[0]) {
            state.cliente.telefonoActual = state.lstTelefonos[0];
          }

          if (state.lstContactos[0]) {
            state.cliente.contactoActual = state.lstContactos[0];
          }
        } else {
          if (response.data.status == "401") {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: data.mensaje,
              allowOutsideClick: false,
              confirmButtonText: "Ir al listado",
            }).then((res) => {
              if (res.isConfirmed) {
                state.lstProveedor = [];
                router.push({
                  name: "listProveedor",
                });
              }
            });
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async actualizarCliente({ commit }) {
    state.cliente.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;
    state.cliente.usuario = JSON.parse(sessionStorage.getItem("dataUser"))[0].usuario;
    state.cliente.lstTelefonos = state.lstTelefonos;
    state.cliente.lstContactos = state.lstContactos;
    state.cliente.lstConvenios = state.lstConvenios;
    state.cliente.lstTarifas = state.lstTarifas;
    state.cliente.lstInformacionBancaria = state.lstInformacionBancaria;
    state.cliente.lstShippers = state.lstShippers;
    state.cliente.informacionEntrega = state.informacionEntrega;
    state.cliente.lstEmails = state.lstEmails;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_cliente`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: state.cliente,
    };

    await axios(config)
      .then(function (response) {
        // console.log(response)
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);

        if (data.status == "401") {
          Swal.fire({
            icon: "error",
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
        } else {
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            title: "Aviso",
            text: data.mensaje,
            allowOutsideClick: false,
            // confirmButtonText: "Ir al listado",
          }).then((res) => {
            // if (res.isConfirmed) {
            //   state.lstProveedor = [];
            //   router.push({
            //     name: "listClientes",
            //   });
            // }
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async exportListClientes() {
    let headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer",
    };
    let data = {
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      correlativo: state.filtro.correlativo ? state.filtro.correlativo : "",
      names: state.filtro.names ? state.filtro.names : "",
      surname: state.filtro.surname ? state.filtro.surname : "",
      second_surname: state.filtro.second_surname
        ? state.filtro.second_surname
        : "",
      id_document: state.filtro.id_document ? state.filtro.id_document : "",
      id_pais: state.filtro.id_pais ? state.filtro.id_pais : "",
      id_state: state.filtro.id_state ? state.filtro.id_state : "",
      status:
        state.filtro.status == 1 || state.filtro.status == 0
          ? state.filtro.status
          : "",
      id_tipoproveedor: state.filtro.id_tipoproveedor
        ? state.filtro.id_tipoproveedor
        : "",
    };
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "El documento se descargará automaticamente",
      showConfirmButton: false,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
    await axios
      .post(process.env.VUE_APP_URL_MAIN + `export_list_cliente`, data, headers)
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        // let name = this.uuidv4();
        link.setAttribute(
          "download",
          `Listo Proveedor ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
      });
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "Documento Descargado",
      confirmButtonText: "Ok",
      showConfirmButton: true,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
  },
  async validarNombreCliente({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_nombre_cliente?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&nombre=${
          state.cliente.nombrecompleto ? state.cliente.nombrecompleto : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {},
    };

    await axios(config)
      .then(function (response) {
        let { data } = response;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDORES_X_NOMBRE", data.data);
        } else {
          commit("SET_LIST_PROVEEDORES_X_NOMBRE", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async validarDocumentoCliente({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validar_documento_cliente?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_tipodocumento=${
          state.cliente.id_tipodocumento ? state.cliente.id_tipodocumento : ""
        }&nro_documento=${
          state.cliente.nro_documento ? state.cliente.nro_documento : ""
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {},
    };

    await axios(config)
      .then(function (response) {
        let { data } = response;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_PROVEEDORES_X_DOCUMENTO", data.data);
        } else {
          commit("SET_LIST_PROVEEDORES_X_DOCUMENTO", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async cargarDatosTatifasEntite({ commit }, data) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `entitie/cargar_datos_tarifas`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      params: data,
    };

    await axios(config)
      .then(function (response) {
        let { data } = response;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag == true) {
          commit("SET_LIST_DATOS_TARIFAS", data.data[0].datos);
        } else {
          commit("SET_LIST_DATOS_TARIFAS", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async validarClienteTieneMovimientos({ commit }, data) {
    let res = {};
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `entities/validar_eliminar_cliente`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      params: data,
    };

    await axios(config)
      .then(function (response) {
        let { data } = response;
        res = data.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
};

export default {
  namespace: true,
  state,
  getters,
  actions,
  mutations,
};
