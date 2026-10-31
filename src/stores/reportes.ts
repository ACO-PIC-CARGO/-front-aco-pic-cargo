import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { BancoGastoDetalle, TotalMasterAgrupado, TotalMasterMes } from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";
import { downloadPdf } from "@/utils/pdfDownload";

export const useReportesStore = defineStore("reportes", () => {
  const listDetalle = ref<BancoGastoDetalle[]>([]);
  const totalMasterAgrupado = ref<TotalMasterAgrupado | never[]>({});
  const totalMasterPorMes = ref<TotalMasterMes[]>([]);

  function setTotalMasterAgrupado(data: TotalMasterAgrupado | never[]): void {
    console.log("data", data);
    totalMasterAgrupado.value = data;
  }

  async function exportReporteFile(filtros: Record<string, unknown>): Promise<void> {
    await downloadPdf(
      { method: "post", url: import.meta.env.VITE_URL_MAIN + "createdPDF", data: filtros },
      "REPORTE_CONTROL_FILE.pdf",
    );
  }
  async function getListarBancosgastosDetalles(data: Record<string, unknown>): Promise<void> {
    data.id_branch = sessionBranchId();

    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listar_banco_gasto_detalles`,
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios<ApiResponse<BancoGastoDetalle[]>>(config)
      .then(function (response) {
        if (response.data.estadoflag) {
          listDetalle.value = response.data.data;
        } else {
          listDetalle.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getTotalesMasterAgrupado(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `obtener_totales_master_general`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<TotalMasterAgrupado[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          setTotalMasterAgrupado(data.data[0]!);
        } else {
          setTotalMasterAgrupado([]);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }
  async function printTotalesMasterPorMes(periodo: Record<string, unknown>): Promise<void> {
    await downloadPdf(
      { method: "get", url: import.meta.env.VITE_URL_MAIN + "imprimir_reporte_ganancia", params: periodo },
      `REPORTE_GANANCIA_${periodo.year}.pdf`,
    );
  }
  async function imprimirReporteGananciaDetallado(periodo: Record<string, unknown>): Promise<void> {
    await downloadPdf(
      { method: "get", url: import.meta.env.VITE_URL_MAIN + "imprimir_reporte_ganancia_detallado", params: periodo },
      `REPORTE_GANANCIA_DETALLADO_${periodo.year}.pdf`,
    );
  }
  async function getTotalesMasterPorMes(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `obtener_totales_master_por_mes`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<TotalMasterMes[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          totalMasterPorMes.value = data.data;
        } else {
          totalMasterPorMes.value = [];
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }
  async function getTotalesMasterGeneralAgrupado(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `obtener_totales_master_genetal_general`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<TotalMasterAgrupado[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          setTotalMasterAgrupado(data.data[0]!);
        } else {
          setTotalMasterAgrupado([]);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }
  async function getTotalesMasterGeneralPorMes(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `obtener_totales_master_genetal_por_mes`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<TotalMasterMes[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          totalMasterPorMes.value = data.data;
        } else {
          totalMasterPorMes.value = [];
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return {
    listDetalle,
    totalMasterAgrupado,
    totalMasterPorMes,
    exportReporteFile,
    getListarBancosgastosDetalles,
    getTotalesMasterAgrupado,
    printTotalesMasterPorMes,
    imprimirReporteGananciaDetallado,
    getTotalesMasterPorMes,
    getTotalesMasterGeneralAgrupado,
    getTotalesMasterGeneralPorMes,
  };
});
