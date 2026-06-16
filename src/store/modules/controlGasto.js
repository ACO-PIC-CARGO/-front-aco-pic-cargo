import axios from "@/api/axios-config";
import Swal from "sweetalert2";
import moment from "moment";
import router from "@/router";
const state = {
  listControlGastos: [],
  master_houses: [],
  master_egresos: [],
  listCorrelativo: [],
  response: [],
  nombreCampania: "",
  listHouses: [],
};
const mutations = {
  SET_LIST_CONTROL_GASTOS(state, data) {
    state.listControlGastos = data;
  },
  SET_CARGA_CORRELATIVO(state, data) {
    state.listCorrelativo = data;
  },
  SET_RESPONSE(state, data) {
    state.response = data;
  },
  SET_NOMBRECAMBIANIA(state, data) {
    state.nombreCampania = data;
  },
  SET_LIST_CONTROL_GASTOS_HOUSE(state, data) {
    state.master_houses = data.lsthouses;
  },
  SET_LIST_CONTROL_GASTOS_MASTER(state, data) {
    state.master_egresos = data.lsthouses;
  },
};

const actions = {
  async getListControlGastos({ commit }, id) {
    const routeParams = router.currentRoute.params;
    // console.log(routeParams);
    var headers = {
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `control_gastos_list?id=${id}&id_branch=${routeParams.id_branch}`,
      headers: headers,
    };

    await axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.statusBol == true) {
        commit("SET_LIST_CONTROL_GASTOS", response.data.data);
      } else {
        commit("SET_LIST_CONTROL_GASTOS", []);
        Swal.fire({
          icon: "error",
          title: data.statusText,
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
    });
  },
  async getListControlGastosHouses({ commit }, id) {
    const routeParams = router.currentRoute.params;
    // console.log(routeParams);
    var headers = {
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `control_gastos_listhouses?id=${id}&id_branch=${routeParams.id_branch}`,
      headers: headers,
    };

    await axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.statusBol == true) {
        commit("SET_LIST_CONTROL_GASTOS_HOUSE", response.data.data);
      } else {
        commit("SET_LIST_CONTROL_GASTOS_HOUSE", []);
        Swal.fire({
          icon: "error",
          title: data.statusText,
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
    });
  },
  async getListControlGastosMaster({ commit }, id) {
    const routeParams = router.currentRoute.params;
    // console.log(routeParams);
    var headers = {
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `control_gastos_listmaster?id=${id}&id_branch=${routeParams.id_branch}`,
      headers: headers,
    };

    await axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.statusBol == true) {
        commit("SET_LIST_CONTROL_GASTOS_MASTER", response.data.data);
      } else {
        commit("SET_LIST_CONTROL_GASTOS_MASTER", []);
        Swal.fire({
          icon: "error",
          title: data.statusText,
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
    });
  },
  async cargarCorrelativo({ commit }) {
    var headers = {
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `cargar_correlativo`,
      headers: headers,
    };

    await axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.statusBol == true) {
        commit("SET_CARGA_CORRELATIVO", response.data.data);
      } else {
        commit("SET_CARGA_CORRELATIVO", []);
      }
    });
  },
  async listarCGECcorralativo({ commit }, id_proveedor) {
    var headers = {
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_cge_corralativo?id_proveedor=${id_proveedor}`,
      headers: headers,
    };

    await axios(config).then((response) => {
      let data = response.data;
      sessionStorage.setItem("auth-token", data.token);
      if (data.statusBol == true) {
        let i = 0;
        let data = response.data.data;
        data.forEach((element) => {
          element.index = i;
          i++;
        });
        commit("SET_CARGA_CORRELATIVO", data);
      } else {
        commit("SET_CARGA_CORRELATIVO", []);
      }
    });
  },
  async setControl({ dispatch }, house) {
    console.log("house", house);
    var data = {
      id_house: house.id_master,
      id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id,
      status: 1,
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "setControl",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);

        if (data.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: data.data[0].mensaje,
          });
          // dispatch("getListControlGastos", house.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: data.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async guardarIngresos({ dispatch }, data) {
    console.log("data", data);
    var data = data;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "setIngresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0].mensaje,
          });
          dispatch("getListControlGastosHouses", data.id_master);
        } else {
          Swal.fire({
            icon: "error",
            text: res.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async actualizarIngresos({ dispatch }, data) {
    var data = data;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "editIngreso/" + data.id,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0].mensaje,
          });
          dispatch("getListControlGastosHouses", data.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: res.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async copiarCGingresos({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "copiar_cgingresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0].mensaje,
          });
          dispatch("getListControlGastosHouses", data.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: res.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async copiarCGEgresos({ dispatch }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "copiar_cgegresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0].mensaje,
          });
          dispatch("getListControlGastosMaster", data.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: res.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getNombreCompania({ commit }, id_master) {
    var data = data;
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "obtener_nombre_camapania?id_master=" +
        id_master,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        if (res.estadoflag == true) {
          commit("SET_NOMBRECAMBIANIA", res.data[0].name);
        } else {
          commit("SET_NOMBRECAMBIANIA", "");
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    return state.nombreCampania;
  },
  async eliminarIngreso({ dispatch }, data) {
    console.log("data3", data);
    var data = data;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "delIngresos/" + data.id,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        if (!res.statusBol == true) {
          Swal.fire({
            icon: "error",
            text: res.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async CargaMasivaControlDeGastos({ commit }, data) {
    state.response = [];
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "carga_masiva_controldegasto",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        commit("SET_RESPONSE", res.data);
      })
      .catch(function (error) {
        console.log(error);
      });
    return state.response;
  },
  async DescargarConsolidadoCargaMasiva(_, id_mastercontrol) {
    state.response = [];

    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        "consolidado_carga_masiva?id_mastercontrol=" +
        id_mastercontrol,
      responseType: "blob",
      headers: {
        "Content-Type": "blob",
      },
    };

    await axios(config)
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        // let name = this.uuidv4();
        link.setAttribute(
          "download",
          `Consolidación Carga Masiva ${moment().format(
            "DD-MM-YYYY hh:mm:ss",
          )}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async guardarCuotasCgeTipoProveedor({ commit }, data) {
    state.response = [];
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "guardar_cuotas_cge_tipo_proveedor",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        let res = response.data;
        sessionStorage.setItem("auth-token", res.token);
        if (!!res.estadoflag) {
          Swal.fire({
            icon: "success",
            text: res.data[0].mensaje,
          });
        } else {
          Swal.fire({
            icon: "error",
            text: res.data[0].mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    return state.response;
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
