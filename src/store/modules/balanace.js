import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
// import funciones from "./../../mixins/funciones";

const state = {
  listaGanancia: [],
  resumenGanancia: [],
  listaGastos: [],
  resumenGastos: [],
  resumenTipoGasto: [],
  resumenTipoIngreso: [],
  arbolGastos: [],
  arbolIngreso: [],
  tipoingreso: [],
  tiposubingreso: [],
  tipogastos: [],
  tiposubgastos: [],
  listaGananciaFiltro: [],
  listaGastosFiltro: [],
  comparativo: [],
  flujoprepostmes: [],
  lstFlujoOperacionesMes: [],
};
const mutations = {
  set_comparativo(state, data) {
    state.comparativo = data;
  },
  set_flujoprepostmes(state, data) {
    state.flujoprepostmes = data;
  },
  set_tipo_ingreso(state, data) {
    state.tipoingreso = data;
  },
  set_tipo_subingreso(state, data) {
    state.tiposubingreso = data;
  },
  set_tipo_gastos(state, data) {
    state.tipogastos = data;
  },
  set_tipo_subgastos(state, data) {
    state.tiposubgastos = data;
  },
  SET_GANANCIA(state, data) {
    state.listaGanancia = data;
  },
  SET_RESUMEN_GANANCIA_BALANCE(state, data) {
    state.resumenGanancia = data;
  },
  SET_BALANCE_GASTOS(state, data) {
    state.listaGastos = data;
  },
  SET_RESUMEN_GASTOS_BALANCE(state, data) {
    state.resumenGastos = data;
  },
  SET_RESUMEN_GASTOS_TIPOGASTO(state, data) {
    state.resumenTipoGasto = data;
  },
  SET_RESUMEN_GASTOS_TIPOINGRESO(state, data) {
    state.resumenTipoIngreso = data;
  },
  SET_ARBOL_GASTOS(state, data) {
    state.arbolGastos = data;
  },
  SET_ARBOL_INGRESO(state, data) {
    state.arbolIngreso = data;
  },
  SET_GANANCIA_FILTRO(state, data) {
    state.listaGananciaFiltro = data;
  },
  SET_BALANCE_GASTOS_FILTRO(state, data) {
    state.listaGastosFiltro = data;
  },
  SET_FLUJO_OPERACIONES_MES(state, data) {
    state.lstFlujoOperacionesMes = data;
  },
};

const actions = {
  async getFlujoPrePostMes({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `flujo_gasto_pre_post_mes?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&month=${data.month}&year=${data.year}&ingresosflag=${
          data.ingresosflag ? data.ingresosflag : ""
        }&gastoflag=${data.gastoflag ? data.gastoflag : ""}&anteriorflag=${
          data.anteriorflag ? data.anteriorflag : ""
        }&posterioflag=${data.posterioflag ? data.posterioflag : ""}&mes=${
          data.mes ? data.mes : ""
        }&anio=${data.anio ? data.anio : ""}&expediente=${
          data.expediente ? data.expediente : ""
        }&id_persona=${data.id_persona ? data.id_persona : ""}&monto=${
          data.monto ? data.monto : ""
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("set_flujoprepostmes", data.data);
        } else {
          commit("set_flujoprepostmes", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getComparativo({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `generar_comparativo?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&month=${data.month}&year=${data.year}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("set_comparativo", data.data);
        } else {
          commit("set_comparativo", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getCargarTipoIngreso({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_tipo_ingreso?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("set_tipo_ingreso", data.data);
        } else {
          commit("set_tipo_ingreso", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getCargarTipoSubIngreso({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_tipo_subingreso?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("set_tipo_subingreso", data.data);
        } else {
          commit("set_tipo_subingreso", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getCargarTipoGastos({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_tipo_gastos?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("set_tipo_gastos", data.data);
        } else {
          commit("set_tipo_gastos", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getCargarTipoSubGastos({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_tipo_subgastos?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("set_tipo_subgastos", data.data);
        } else {
          commit("set_tipo_subgastos", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async getListBalanaceGanancia({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `detalle_ganancia?year=${data.year}&month=${data.month}&tipoingreso=${data.tipoingreso}&tiposubingreso=${data.tiposubingreso}&nro_expediente=${data.nro_expediente}&monto=${data.monto}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_GANANCIA", data.data);
        } else {
          commit("SET_GANANCIA", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getListBalanaceGananciaFiltro({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `detalle_ganancia?year=${data.year}&month=${data.month}&tipoingreso=${data.tipoingreso}&tiposubingreso=${data.tiposubingreso}&nro_expediente=${data.nro_expediente}&monto=${data.monto}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_GANANCIA_FILTRO", data.data);
        } else {
          commit("SET_GANANCIA_FILTRO", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getResumenBalanaceGanancia({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `resumen_ganancia?year=${data.year}&month=${data.month}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_RESUMEN_GANANCIA_BALANCE", data.data);
        } else {
          commit("SET_RESUMEN_GANANCIA_BALANCE", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async getListBalanaceGastos({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `detalle_gastos?year=${data.year}&month=${data.month}&tipogastos=${data.tipogastos}&tiposubgastos=${data.tiposubgastos}&proveedor=${data.proveedor}&monto=${data.monto}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_BALANCE_GASTOS", data.data);
        } else {
          commit("SET_BALANCE_GASTOS", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getListBalanaceGastosFiltro({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `detalle_gastos?year=${data.year}&month=${data.month}&tipogastos=${data.tipogastos}&tiposubgastos=${data.tiposubgastos}&proveedor=${data.proveedor}&monto=${data.monto}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_BALANCE_GASTOS_FILTRO", data.data);
        } else {
          commit("SET_BALANCE_GASTOS_FILTRO", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getResumenBalanaceGastos({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `resumen_gastos?year=${data.year}&month=${data.month}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_RESUMEN_GASTOS_BALANCE", data.data);
        } else {
          commit("SET_RESUMEN_GASTOS_BALANCE", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getResumenGastosxTipoGasto({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `resumen_gastos_tipogasto?year=${data.year}&month=${data.month}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_RESUMEN_GASTOS_TIPOGASTO", data.data);
        } else {
          commit("SET_RESUMEN_GASTOS_TIPOGASTO", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async resumenIngresoTipoIngreso({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `resumen_ingreso_tipo?year=${data.year}&month=${data.month}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_RESUMEN_GASTOS_TIPOINGRESO", data.data);
        } else {
          commit("SET_RESUMEN_GASTOS_TIPOINGRESO", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getArbolGastos({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `arbol_gastos?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_ARBOL_GASTOS", data.data);
        } else {
          commit("SET_ARBOL_GASTOS", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getArbolIngresos({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `arbol_ingresos?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_ARBOL_INGRESO", data.data);
        } else {
          commit("SET_ARBOL_INGRESO", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async exportarBalanceGanancia(__, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `excel_reporte?year=${data.year}&month=${data.month}`,
      responseType: "blob",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getListFlujoOperacionMes({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `flujo_dinero_por_mes?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&cantidadmes=${data.cantidadmes}&id_proveedor=${
          data.id_proveedor ? data.id_proveedor : ""
        }&id_cliente=${data.id_cliente ? data.id_cliente : ""}&nro_expediente=${
          data.nro_expediente ? data.nro_expediente : ""
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        if (data.estado == true) {
          commit("SET_FLUJO_OPERACIONES_MES", data.data);
        } else {
          commit("SET_FLUJO_OPERACIONES_MES", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
        
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
