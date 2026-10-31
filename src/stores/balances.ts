import { defineStore } from "pinia";
import { ref } from "vue";
import type { Ref } from "vue";
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
import { hasFailed, request } from "@/utils/request";
// import funciones from "./../../mixins/funciones";

const JSON_HEADERS = { "Content-Type": "application/json" };
const EXPORT_ERROR_MESSAGE = "No pudimos generar el Excel. Revisa tu conexión e intenta de nuevo.";

const exportRefusal = async (error: unknown): Promise<string> => {
  const body = (error as { response?: { data?: unknown } }).response?.data;
  if (!(body instanceof Blob)) return EXPORT_ERROR_MESSAGE;
  try {
    return (JSON.parse(await body.text()) as { mensaje?: string }).mensaje || EXPORT_ERROR_MESSAGE;
  } catch {
    return EXPORT_ERROR_MESSAGE;
  }
};

async function loadStatement<Row>(path: string, target: Ref<Row[]>): Promise<void> {
  const response = await request<Row>({ method: "get", url: import.meta.env.VITE_URL_MAIN + path, headers: JSON_HEADERS });
  target.value = response.estadoflag ? response.data : [];
  if (hasFailed(response)) {
    Swal.fire({ icon: "error", text: response.mensaje });
  }
}

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
    await loadStatement(
      `flujo_gasto_pre_post_mes?month=${data.month}&year=${data.year}&ingresosflag=${
        data.ingresosflag ? data.ingresosflag : ""
      }&gastoflag=${data.gastoflag ? data.gastoflag : ""}&anteriorflag=${
        data.anteriorflag ? data.anteriorflag : ""
      }&posterioflag=${data.posterioflag ? data.posterioflag : ""}&expediente=${
        data.expediente ? data.expediente : ""
      }&id_persona=${data.id_persona ? data.id_persona : ""}&monto=${data.monto ? data.monto : ""}`,
      flujoprepostmes,
    );
  }
  async function getComparativo(data: FiltroComparativo): Promise<void> {
    await loadStatement(`generar_comparativo?month=${data.month}&year=${data.year}`, comparativo);
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
    await loadStatement(`detalle_ganancia?year=${data.year}&month=${data.month}&tipoingreso=${data.tipoingreso}&tiposubingreso=${data.tiposubingreso}&nro_expediente=${data.nro_expediente}&monto=${data.monto}`, listaGanancia);
  }
  async function getListBalanaceGananciaFiltro(data: FiltroDetalleGanancia): Promise<void> {
    await loadStatement(`detalle_ganancia?year=${data.year}&month=${data.month}&tipoingreso=${data.tipoingreso}&tiposubingreso=${data.tiposubingreso}&nro_expediente=${data.nro_expediente}&monto=${data.monto}`, listaGananciaFiltro);
  }
  async function getResumenBalanaceGanancia(data: FiltroMesAnio): Promise<void> {
    await loadStatement(`resumen_ganancia?year=${data.year}&month=${data.month}`, resumenGanancia);
  }
  async function getListBalanaceGastos(data: FiltroDetalleGastos): Promise<void> {
    await loadStatement(`detalle_gastos?year=${data.year}&month=${data.month}&tipogastos=${data.tipogastos}&tiposubgastos=${data.tiposubgastos}&proveedor=${data.proveedor}&monto=${data.monto}`, listaGastos);
  }
  async function getListBalanaceGastosFiltro(data: FiltroDetalleGastos): Promise<void> {
    await loadStatement(`detalle_gastos?year=${data.year}&month=${data.month}&tipogastos=${data.tipogastos}&tiposubgastos=${data.tiposubgastos}&proveedor=${data.proveedor}&monto=${data.monto}`, listaGastosFiltro);
  }
  async function getResumenBalanaceGastos(data: FiltroMesAnio): Promise<void> {
    await loadStatement(`resumen_gastos?year=${data.year}&month=${data.month}`, resumenGastos);
  }
  async function getResumenGastosxTipoGasto(data: FiltroMesAnio): Promise<void> {
    await loadStatement(`resumen_gastos_tipogasto?year=${data.year}&month=${data.month}`, resumenTipoGasto);
  }
  async function resumenIngresoTipoIngreso(data: FiltroMesAnio): Promise<void> {
    await loadStatement(`resumen_ingreso_tipo?year=${data.year}&month=${data.month}`, resumenTipoIngreso);
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
      headers: JSON_HEADERS,
    };
    try {
      const response = await axios<BlobPart>(config);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      Swal.fire({ icon: "error", text: await exportRefusal(error) });
    }
  }
  async function getListFlujoOperacionMes(data: FiltroFlujoOperacionMes): Promise<void> {
    await loadStatement(
      `flujo_dinero_por_mes?cantidadmes=${data.cantidadmes}&id_proveedor=${
        data.id_proveedor ? data.id_proveedor : ""
      }&id_cliente=${data.id_cliente ? data.id_cliente : ""}&nro_expediente=${
        data.nro_expediente ? data.nro_expediente : ""
      }`,
      lstFlujoOperacionesMes,
    );
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
