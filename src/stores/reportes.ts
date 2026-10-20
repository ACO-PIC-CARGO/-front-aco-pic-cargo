import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { BancoGastoDetalle, TotalMasterAgrupado, TotalMasterMes } from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";

export const useReportesStore = defineStore("reportes", () => {
  const listDetalle = ref<BancoGastoDetalle[]>([]);
  const totalMasterAgrupado = ref<TotalMasterAgrupado | never[]>({});
  const totalMasterPorMes = ref<TotalMasterMes[]>([]);

  function setTotalMasterAgrupado(data: TotalMasterAgrupado | never[]): void {
    console.log("data", data);
    totalMasterAgrupado.value = data;
  }

  async function exportReporteFile(data: Record<string, unknown>): Promise<void> {
    data.id_branch = sessionBranchId();
    Swal.fire({
      icon: "info",
      title: "Generando PDF...",
      text: "Por favor espere",
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "createdPDF",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function () {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });

        window.open(
          `${import.meta.env.VITE_URL_MAIN}REPORT_CONTROL_FILE.pdf`,
          // "",
          "_blank",
        );
      })
      .catch(function (error) {
        console.error(error);
      });
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
  async function printTotalesMasterPorMes(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `imprimir_reporte_ganancia`,
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

    await axios<{ path: string }>(config)
      .then(function (response) {
        const data = response.data;
        window.open(import.meta.env.VITE_URL_MAIN + data.path, "_blank");
        Swal.close();
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function imprimirReporteGananciaDetallado(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `imprimir_reporte_ganancia_detallado`,
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

    await axios<{ path: string }>(config)
      .then(function (response) {
        const data = response.data;
        window.open(import.meta.env.VITE_URL_MAIN + data.path, "_blank");
        Swal.close();
      })
      .catch(function (error) {
        console.error(error);
      });
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
