import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import type { ApiResponse } from "@/types/api";
import type { FiltroProyeccion, Proyeccion, ProyeccionListado } from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";

export const useProyeccionesStore = defineStore("proyecciones", () => {
  const listProyeccion = ref<ProyeccionListado[]>([]);
  const proyeccion = ref<Proyeccion>({});
  const proyeccionaprobada = ref<string>("");

  async function setProyeccion(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_proyeccion`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
        if (data.estadoflag) {
          router.go(-1);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getProyeccion(data: FiltroProyeccion): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `list_proyeccion?id_branch=${sessionBranchId()}&id_month=${data.id_month}&id_year=${data.id_year}&correlativo=${
          data.correlativo
        }&total_proyectado_ext=${data.total_proyectado_ext}&estado=${
          data.estado
        }&aprobadoflag=${data.aprobadoflag}`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<ProyeccionListado[]>>(config)
      .then((response) => {
        const data = response.data;
        if (data.estadoflag) {
          listProyeccion.value = data.data;
        } else {
          listProyeccion.value = [];
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
  async function verProyeccion(id: number | string): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_proyeccion?id=${id}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<Proyeccion[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          proyeccion.value = data.data[0]!;
        } else {
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function updateProyeccion(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `update_proyeccion`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
        if (data.estadoflag) {
          router.go(-1);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function validateProyeccionAprobacion(data: Record<string, unknown>): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `validate_proyeccion_aprobacion?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }
  async function copiarProyeccion(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `copiar_proyeccion`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          html: data.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function aprobarProyeccion(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `aprobar_proyeccion`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function eliminarProyeccion(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `eliminar_proyeccion`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function primeraProyeccion(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `generar_primerar_proyeccion`,

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<{ id: number }[]>>(config)
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
        if (data.estadoflag) {
          router.push({
            name: "editarProyeccion",
            params: { id: data.data[0]!.id },
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function exportarVerProyeccion(id: number | string): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `excel_proyeccion?id=${id}`,
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
        link.setAttribute("download", `Proyeccion-${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getProyeccionAprobada(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `proyeccion_aprobada?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<{ proyeccion_mes_anio: string }[]>>(config)
      .then((response) => {
        const data = response.data;
        if (data.estadoflag) {
          proyeccionaprobada.value = data.data[0]!.proyeccion_mes_anio;
        } else {
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    listProyeccion,
    proyeccion,
    proyeccionaprobada,
    setProyeccion,
    getProyeccion,
    verProyeccion,
    updateProyeccion,
    validateProyeccionAprobacion,
    copiarProyeccion,
    aprobarProyeccion,
    eliminarProyeccion,
    primeraProyeccion,
    exportarVerProyeccion,
    getProyeccionAprobada,
  };
});
