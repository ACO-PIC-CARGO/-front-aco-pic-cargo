import http from "@/plugins/axios";
import Swal from "sweetalert2";
import router from "@/router";

const state = {
  list: [],
  response: [],
  record: {},
  loading: false,
  deudaAProveedor: [],
};

const mutations = {
  SET_LOADING(state, data) {
    state.loading = data;
  },
  SET_LIST_BANK(state, data) {
    state.list = data;
  },
  SET_BANK(state, data) {
    state.record = data;
  },
  SET_LIST_BANK_CARGAR(state, data) {
    state.list = data;
  },
  SET_DEUDA_A_PROVEEDOR(state, data) {
    state.deudaAProveedor = data;
  },
};
const actions = {
  async fetchDataBank({ commit, dispatch }, data) {
    commit("SET_LOADING", false);
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_bank?` +
        `id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }` +
        `&code=${encodeURIComponent(data.code)}` +
        `&name=${encodeURIComponent(data.name)}` +
        `&acronym=${encodeURIComponent(data.acronym)}` +
        `&description=${encodeURIComponent(data.description)}` +
        `&status=${data.status}`,
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
    };
    await http(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        let list = data.estadoflag ? data.data : [];
        commit("SET_LIST_BANK", list);
        commit("SET_LOADING", true);
        if (!data.estadoflag) {
          if (data.status == "401") {
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
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async insertBank({ commit, dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertar_bank",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await http(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          let data = {
            name: "",
            code: "",
            acronym: "",
            description: "",
            status: 1,
          };
          dispatch("fetchDataBank", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async readBank({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_bank?id=${id}`,
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
    };

    await http(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_BANK", data.data[0]);
        } else {
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
  async updateBank({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "actualizar_bank",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await http(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          let data = {
            name: "",
            code: "",
            acronym: "",
            description: "",
            position: "",
            status: 1,
          };
          dispatch("fetchDataBank", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },

  async getBanksListCargar({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getBanksList/",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await http(config)
      .then(function (response) {
        let data = response.data;
        if (!!data.estadoflag) {
          commit("SET_LIST_BANK_CARGAR", response.data.data);
        } else {
          commit("SET_LIST_BANK_CARGAR", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async guardarCuentaDetalle({ dispatch }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "insertar_cuenta",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };
    await http(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          let data = {
            name: "",
            code: "",
            acronym: "",
            description: "",
            status: 1,
          };
          dispatch("fetchDataBank", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async eliminarCuentaDetalle({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "eliminar_cuenta",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };
    await http(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then((result) => {
          let data = {
            name: "",
            code: "",
            acronym: "",
            description: "",
            status: 1,
          };
          dispatch("fetchDataBank", data);
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async verPagoRealizado({ commit }, nro_operacion) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `ver_pago?nro_operacion=${nro_operacion}&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await http(config)
      .then(function (response) {
        let data = response.data;
        if (data.estadoflag) {
          commit("SET_BANK", data.data[0]);
        } else {
          Swal.fire({
            icon: "warning",
            text: data.mensaje,
          }).then((response) => {
            if (response.isConfirmed) {
              router.go(-1);
            }
          });
          commit("SET_BANK", {});
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async anularPagoRealizado({ commit }, id) {
    let res = null;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `anular_pago`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: {
        id: id,
      },
    };
    await http(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
  async actualizarPagoRealizado({ commit }, data) {
    let res = null;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_pago`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: { lstPago: data },
    };
    await http(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
  async verCobroRealizado({ commit }, nro_operacion) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `ver_cobro?nro_operacion=${nro_operacion}&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await http(config)
      .then(function (response) {
        let data = response.data;
        if (data.estadoflag) {
          commit("SET_BANK", data.data[0]);
        } else {
          Swal.fire({
            icon: "warning",
            text: data.mensaje,
          }).then((response) => {
            if (response.isConfirmed) {
              router.go(-1);
            }
          });
          commit("SET_BANK", {});
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async anularCobroRealizado({ commit }, data) {
    let res = null;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `anular_cobro`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await http(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
  async actualizarPagoRealizado({ commit }, data) {
    let res = null;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_cobro`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: { lstPago: data },
    };
    await http(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
  async validateNroOperacion({}, data) {
    let res = null;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `validate_nro_operacion_cobro`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      params: data,
    };
    await http(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
  async verVacturas({}, data) {
    let res = null;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_facturas`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      params: data,
    };
    await http(config)
      .then(function (response) {
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },

  async getDeudaAProveedorPorSucursal({ commit }, id_proveedor) {
    let res = null;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `deuda_a_proveedor_por_sucursal`,
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      params: {
        id_proveedor: id_proveedor,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
    };
    await http(config)
      .then(function (response) {
        res = response.data;
        commit(
          "SET_DEUDA_A_PROVEEDOR",
          res.data.map((item, index) => {
            return {
              ...item,
              id: index + 1,
              nuevoflag: false,
              parcialflag: false,
              montoparcial: 0,
              saldo: 0,
              tipocambio: parseFloat(
                (item.saldo_pendiente_local ? item.saldo_pendiente_local : 1) /
                  (item.saldo_pendiente ? item.saldo_pendiente : 1),
              ).toFixed(4),
            };
          }),
        );
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
  mutations,
  actions,
};
