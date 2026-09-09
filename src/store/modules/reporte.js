import axios from "@/api/axios-config";
import Swal from "sweetalert2";

const state = {
  listDetalle: [],
  totalMasterAgrupado: {},
  totalMasterPorMes: [],
};
const mutations = {
  SET_LIST_DETALLE(state, data) {
    state.listDetalle = data;
  },
  SET_TOTAL_MASTER_AGRUPADO(state, data) {
    console.log("data", data);
    state.totalMasterAgrupado = data;
  },
  SET_TOTAL_MASTER_POR_MES(state, data) {
    state.totalMasterPorMes = data;
  },
};
const actions = {
  async exportReporteFile(__, data) {
    data.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;
    Swal.fire({
      icon: "info",
      title: "Generando PDF...",
      text: "Por favor espere",
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "createdPDF",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    var vm = this;
    await axios(config)
      .then(function (response) {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });

        window.open(
          `${process.env.VUE_APP_URL_MAIN}REPORT_CONTROL_FILE.pdf`,
          // "",
          "_blank",
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  },
  async getListarBancosgastosDetalles({ commit }, data) {
    data.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `listar_banco_gasto_detalles`,
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios(config)
      .then(function (response) {
        if (response.data.estadoflag) {
          commit("SET_LIST_DETALLE", response.data.data);
        } else {
          commit("SET_LIST_DETALLE", []);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  },
  async getTotalesMasterAgrupado({ commit }, data) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `obtener_totales_master_general`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_TOTAL_MASTER_AGRUPADO", data.data[0]);
        } else {
          commit("SET_TOTAL_MASTER_AGRUPADO", []);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async printTotalesMasterPorMes({ commit }, data) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `imprimir_reporte_ganancia`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    Swal.fire({
      icon: "info",
      title: "Generando impresión",
      text: "Estamos preparando la impresión. Por favor, espera un momento.",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await axios(config)
      .then(function (response) {
        let data = response.data;
        window.open(process.env.VUE_APP_URL_MAIN + data.path, "_blank");
        Swal.close();
      })
      .catch(function (error) {
        console.error(error);
      });
  },
  async imprimirReporteGananciaDetallado({ commit }, data) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `imprimir_reporte_ganancia_detallado`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    Swal.fire({
      icon: "info",
      title: "Generando impresión",
      text: "Estamos preparando la impresión. Por favor, espera un momento.",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await axios(config)
      .then(function (response) {
        let data = response.data;
        window.open(process.env.VUE_APP_URL_MAIN + data.path, "_blank");
        Swal.close();
      })
      .catch(function (error) {
        console.error(error);
      });
  },
  async getTotalesMasterPorMes({ commit }, data) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `obtener_totales_master_por_mes`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_TOTAL_MASTER_POR_MES", data.data);
        } else {
          commit("SET_TOTAL_MASTER_POR_MES", []);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async getTotalesMasterGeneralAgrupado({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + `obtener_totales_master_genetal_general`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_TOTAL_MASTER_AGRUPADO", data.data[0]);
        } else {
          commit("SET_TOTAL_MASTER_AGRUPADO", []);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
  async getTotalesMasterGeneralPorMes({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + `obtener_totales_master_genetal_por_mes`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (data.estadoflag) {
          commit("SET_TOTAL_MASTER_POR_MES", data.data);
        } else {
          commit("SET_TOTAL_MASTER_POR_MES", []);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
