import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import type { ApiResponse } from "@/types/api";
import type { FiltroProyeccion, Proyeccion, ProyeccionListado } from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";

const SPREADSHEET_TYPE = "spreadsheetml";

async function sendAndNotify<Row = unknown>(method: string, path: string, data: Record<string, unknown>) {
  const answer = await request<Row>({ method, url: import.meta.env.VITE_URL_MAIN + path, data });
  Swal.fire({ icon: answer.estadoflag ? "success" : "error", text: answer.mensaje });
  return answer;
}

async function showRefusedDownload(body: unknown): Promise<void> {
  let mensaje = CONNECTION_ERROR_MESSAGE;
  try {
    if (body instanceof Blob) mensaje = JSON.parse(await body.text()).mensaje || mensaje;
  } catch {
    // not a JSON answer: keep the connection message
  }
  Swal.fire({ icon: "error", text: mensaje });
}

export const useProyeccionesStore = defineStore("proyecciones", () => {
  const listProyeccion = ref<ProyeccionListado[]>([]);
  const proyeccion = ref<Proyeccion>({});
  const proyeccionaprobada = ref<string>("");

  async function setProyeccion(data: Record<string, unknown>): Promise<void> {
    const answer = await sendAndNotify("post", "insertar_proyeccion", data);
    if (answer.estadoflag) router.go(-1);
  }
  async function getProyeccion(data: FiltroProyeccion): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `list_proyeccion?id_branch=${sessionBranchId()}&id_month=${data.id_month ?? ""}&id_year=${data.id_year ?? ""}&correlativo=${
          data.correlativo ?? ""
        }&total_proyectado_ext=${data.total_proyectado_ext ?? ""}&estado=${
          data.estado ?? ""
        }&aprobadoflag=${data.aprobadoflag ?? ""}`,

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
    const answer = await sendAndNotify("put", "update_proyeccion", data);
    if (answer.estadoflag) router.go(-1);
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
  async function copiarProyeccion(data: Record<string, unknown>): Promise<boolean> {
    return (await sendAndNotify("put", "copiar_proyeccion", data)).estadoflag;
  }
  async function aprobarProyeccion(data: Record<string, unknown>): Promise<boolean> {
    return (await sendAndNotify("put", "aprobar_proyeccion", data)).estadoflag;
  }
  async function eliminarProyeccion(data: Record<string, unknown>): Promise<boolean> {
    return (await sendAndNotify("put", "eliminar_proyeccion", data)).estadoflag;
  }
  async function primeraProyeccion(data: Record<string, unknown>): Promise<boolean> {
    const answer = await sendAndNotify<{ id: number }>("post", "generar_primerar_proyeccion", data);
    if (answer.estadoflag) {
      router.push({
        name: "editarProyeccion",
        params: { id: answer.data[0]!.id },
      });
    }
    return answer.estadoflag;
  }
  async function exportarVerProyeccion(id: number | string): Promise<void> {
    try {
      const { data } = await axios<Blob>({
        method: "get",
        url: import.meta.env.VITE_URL_MAIN + `excel_proyeccion?id=${id}`,
        responseType: "blob",
      });
      if (!data.type.includes(SPREADSHEET_TYPE)) {
        await showRefusedDownload(data);
        return;
      }
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Proyeccion-${Date.now()}.xlsx`);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      await showRefusedDownload((error as { response?: { data?: unknown } }).response?.data);
    }
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
