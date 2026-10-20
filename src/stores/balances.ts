import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { BalanceMovimiento, FlujoPrePostMovimiento } from "@/types/balances";
import type {
  ArbolBalance,
  ComparativoBalance,
  FiltroComparativo,
  FiltroDetalleGanancia,
  FiltroDetalleGastos,
  FiltroFlujoOperacionMes,
  FiltroFlujoPrePostMes,
  FiltroMesAnio,
  FlujoOperacionMes,
  RespuestaBalance,
  TipoBalance,
} from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";
// import funciones from "./../../mixins/funciones";

export const useBalancesStore = defineStore("balances", () => {
  const listaGanancia = ref<BalanceMovimiento[]>([]);
  const resumenGanancia = ref<BalanceMovimiento[]>([]);
  const listaGastos = ref<BalanceMovimiento[]>([]);
  const resumenGastos = ref<BalanceMovimiento[]>([]);
  const resumenTipoGasto = ref<BalanceMovimiento[]>([]);
  const resumenTipoIngreso = ref<BalanceMovimiento[]>([]);
  const arbolGastos = ref<ArbolBalance[]>([]);
  const arbolIngreso = ref<ArbolBalance[]>([]);
  const tipoingreso = ref<TipoBalance[]>([]);
  const tiposubingreso = ref<TipoBalance[]>([]);
  const tipogastos = ref<TipoBalance[]>([]);
  const tiposubgastos = ref<TipoBalance[]>([]);
  const listaGananciaFiltro = ref<BalanceMovimiento[]>([]);
  const listaGastosFiltro = ref<BalanceMovimiento[]>([]);
  const comparativo = ref<ComparativoBalance[]>([]);
  const flujoprepostmes = ref<FlujoPrePostMovimiento[]>([]);
  const lstFlujoOperacionesMes = ref<FlujoOperacionMes[]>([]);

  async function getFlujoPrePostMes(data: FiltroFlujoPrePostMes): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `flujo_gasto_pre_post_mes?id_branch=${sessionBranchId()}&month=${data.month}&year=${data.year}&ingresosflag=${
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
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<FlujoPrePostMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          flujoprepostmes.value = data.data;
        } else {
          flujoprepostmes.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getComparativo(data: FiltroComparativo): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `generar_comparativo?id_branch=${sessionBranchId()}&month=${data.month}&year=${data.year}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<ComparativoBalance[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          comparativo.value = data.data;
        } else {
          comparativo.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getCargarTipoIngreso(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_tipo_ingreso?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<TipoBalance[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          tipoingreso.value = data.data;
        } else {
          tipoingreso.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getCargarTipoSubIngreso(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_tipo_subingreso?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<TipoBalance[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          tiposubingreso.value = data.data;
        } else {
          tiposubingreso.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getCargarTipoGastos(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_tipo_gastos?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<TipoBalance[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          tipogastos.value = data.data;
        } else {
          tipogastos.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getCargarTipoSubGastos(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_tipo_subgastos?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<TipoBalance[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          tiposubgastos.value = data.data;
        } else {
          tiposubgastos.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getListBalanaceGanancia(data: FiltroDetalleGanancia): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `detalle_ganancia?year=${data.year}&month=${data.month}&tipoingreso=${data.tipoingreso}&tiposubingreso=${data.tiposubingreso}&nro_expediente=${data.nro_expediente}&monto=${data.monto}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          listaGanancia.value = data.data;
        } else {
          listaGanancia.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getListBalanaceGananciaFiltro(data: FiltroDetalleGanancia): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `detalle_ganancia?year=${data.year}&month=${data.month}&tipoingreso=${data.tipoingreso}&tiposubingreso=${data.tiposubingreso}&nro_expediente=${data.nro_expediente}&monto=${data.monto}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          listaGananciaFiltro.value = data.data;
        } else {
          listaGananciaFiltro.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getResumenBalanaceGanancia(data: FiltroMesAnio): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `resumen_ganancia?year=${data.year}&month=${data.month}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          resumenGanancia.value = data.data;
        } else {
          resumenGanancia.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getListBalanaceGastos(data: FiltroDetalleGastos): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `detalle_gastos?year=${data.year}&month=${data.month}&tipogastos=${data.tipogastos}&tiposubgastos=${data.tiposubgastos}&proveedor=${data.proveedor}&monto=${data.monto}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          listaGastos.value = data.data;
        } else {
          listaGastos.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getListBalanaceGastosFiltro(data: FiltroDetalleGastos): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `detalle_gastos?year=${data.year}&month=${data.month}&tipogastos=${data.tipogastos}&tiposubgastos=${data.tiposubgastos}&proveedor=${data.proveedor}&monto=${data.monto}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          listaGastosFiltro.value = data.data;
        } else {
          listaGastosFiltro.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getResumenBalanaceGastos(data: FiltroMesAnio): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `resumen_gastos?year=${data.year}&month=${data.month}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          resumenGastos.value = data.data;
        } else {
          resumenGastos.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getResumenGastosxTipoGasto(data: FiltroMesAnio): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `resumen_gastos_tipogasto?year=${data.year}&month=${data.month}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          resumenTipoGasto.value = data.data;
        } else {
          resumenTipoGasto.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function resumenIngresoTipoIngreso(data: FiltroMesAnio): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `resumen_ingreso_tipo?year=${data.year}&month=${data.month}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<BalanceMovimiento[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          resumenTipoIngreso.value = data.data;
        } else {
          resumenTipoIngreso.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getArbolGastos(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `arbol_gastos?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<ArbolBalance[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          arbolGastos.value = data.data;
        } else {
          arbolGastos.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getArbolIngresos(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `arbol_ingresos?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<ArbolBalance[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          arbolIngreso.value = data.data;
        } else {
          arbolIngreso.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function exportarBalanceGanancia(data: FiltroMesAnio): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `excel_reporte?year=${data.year}&month=${data.month}`,
      responseType: "blob" as const,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<BlobPart>(config)
      .then(function (response) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getListFlujoOperacionMes(data: FiltroFlujoOperacionMes): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `flujo_dinero_por_mes?id_branch=${sessionBranchId()}&cantidadmes=${data.cantidadmes}&id_proveedor=${
          data.id_proveedor ? data.id_proveedor : ""
        }&id_cliente=${data.id_cliente ? data.id_cliente : ""}&nro_expediente=${
          data.nro_expediente ? data.nro_expediente : ""
        }`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaBalance<FlujoOperacionMes[]>>(config)
      .then(function (response) {
        const data = response.data;

        if (data.estado == true) {
          lstFlujoOperacionesMes.value = data.data;
        } else {
          lstFlujoOperacionesMes.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    listaGanancia,
    resumenGanancia,
    listaGastos,
    resumenGastos,
    resumenTipoGasto,
    resumenTipoIngreso,
    arbolGastos,
    arbolIngreso,
    tipoingreso,
    tiposubingreso,
    tipogastos,
    tiposubgastos,
    listaGananciaFiltro,
    listaGastosFiltro,
    comparativo,
    flujoprepostmes,
    lstFlujoOperacionesMes,
    getFlujoPrePostMes,
    getComparativo,
    getCargarTipoIngreso,
    getCargarTipoSubIngreso,
    getCargarTipoGastos,
    getCargarTipoSubGastos,
    getListBalanaceGanancia,
    getListBalanaceGananciaFiltro,
    getResumenBalanaceGanancia,
    getListBalanaceGastos,
    getListBalanaceGastosFiltro,
    getResumenBalanaceGastos,
    getResumenGastosxTipoGasto,
    resumenIngresoTipoIngreso,
    getArbolGastos,
    getArbolIngresos,
    exportarBalanceGanancia,
    getListFlujoOperacionMes,
  };
});
