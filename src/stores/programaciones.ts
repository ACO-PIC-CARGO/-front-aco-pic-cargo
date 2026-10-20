import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { ApiResponse } from "@/types/api";
import type {
  FiltroProgramacionProveedor,
  ProgramacionListado,
  ProgramacionPagoProveedor,
} from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";

export const useProgramacionesStore = defineStore("programaciones", () => {
  const listado = ref<ProgramacionListado[]>([]);
  const listProgramacion = ref<unknown[]>([]);
  const listProgramacionxProveedor = ref<ProgramacionPagoProveedor[]>([]);

  async function ListProgrammedPayment(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "ListProgrammedPaymentDetails/" + sessionBranchId(),

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<ProgramacionListado[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          listado.value = data.data;
        } else {
          listado.value = [];
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
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function GetTotalCotizacion(): Promise<void> {
    const calculadorasTotal = useCalculadorasStore().GetTotalCotizacion();
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "cargar_programacion?id_branch=" + sessionBranchId(),
      headers: headers,
    };

    await axios<ApiResponse<unknown[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      listProgramacion.value = response.data.data;
    });
    await calculadorasTotal;
  }
  async function getListProgramacion(data: FiltroProgramacionProveedor): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `pagos_programados_por_proveedor?id_branch=${sessionBranchId()}&id_proveedor=${data.id_proveedor}&id_programend=${data.id}&id_coins=${
          data.id_coins
        }`,
      headers: headers,
    };

    await axios<ApiResponse<ProgramacionPagoProveedor[]>>(config).then((response) => {
      const data = response.data.data;
      sessionStorage.setItem("auth-token", response.data.token!);
      data.forEach((element) => {
        element.tipocambio = element.tipocambio ? element.tipocambio : 1;
      });
      listProgramacionxProveedor.value = data;
    });
  }
  async function setPagoProgramado(data: Record<string, unknown>): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `registrar_pagos_programado`,
      headers: headers,
      data: data,
    };

    await axios<ApiResponse<{ mensaje: string }[]>>(config).then((response) => {
      const data = response.data.data[0]!;
      Swal.fire({
        icon: "info",
        titleText: "Aviso",
        text: data.mensaje,
      }).then((result) => {
        if (result.isConfirmed) {
          ListProgrammedPayment();
        }
      });
    });
  }
  async function eliminarProgramacion(data: Record<string, unknown>): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `eliminar_programacion`,
      headers: headers,
      data: data,
    };

    await axios<ApiResponse<{ mensaje: string }[]>>(config).then((response) => {
      const data = response.data.data[0]!;
      Swal.fire({
        icon: "info",
        titleText: "Aviso",
        text: data.mensaje,
      }).then((result) => {
        if (result.isConfirmed) {
          ListProgrammedPayment();
        }
      });
    });
  }
  async function eliminarProgramacionDetalle(data: Record<string, unknown>): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `eliminar_programacion_detalle`,
      headers: headers,
      data: data,
    };

    await axios<ApiResponse<{ mensaje: string }[]>>(config).then((response) => {
      const data = response.data.data[0]!;
      Swal.fire({
        icon: "info",
        titleText: "Aviso",
        text: data.mensaje,
      }).then(() => {});
    });
  }

  return {
    listado,
    listProgramacion,
    listProgramacionxProveedor,
    ListProgrammedPayment,
    GetTotalCotizacion,
    getListProgramacion,
    setPagoProgramado,
    eliminarProgramacion,
    eliminarProgramacionDetalle,
  };
});
