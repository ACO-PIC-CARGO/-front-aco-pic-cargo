import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import moment from "moment";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ComentarioPredefinido } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export interface FiltroComentariosPredefinidos {
  code?: string | null;
  comentario?: string | null;
  status?: number | string;
}

export const useComentariosPredefinidosStore = defineStore("comentariosPredefinidos", () => {
  const list = ref<ComentarioPredefinido[]>([]);
  const loading = ref(false);
  const record = ref({});
  const maxCode = ref<string | number>(0);

  async function fetchListadoComentariosPredefinidos(data: FiltroComentariosPredefinidos = { status: 1 }): Promise<void> {
    loading.value = true;

    await axios<ApiResponse<ComentarioPredefinido[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        "listarComentariosPredefinidos?" +
        `id_branch=${sessionBranchId()}&code=${
          data.code ? data.code : ""
        }&comentario=${
          data.comentario ? data.comentario : ""
        }&status=${
          data.status === 0 || data.status === 1 ? data.status : ""
        }`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        //  console.log(data)

        list.value = data.estadoflag ? data.data : [];
        loading.value = false;

        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function fetchMaxCodeListadoComentariosPredefinidos(): Promise<void> {
    await axios<ApiResponse<{ code: string | null }[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "consultarMaxCodeComentariosPredefinidos?" + `id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        if (data.estadoflag) {
          maxCode.value = data.data[0]!.code || 0;
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function insertComentarioPredefinido(data: Partial<ComentarioPredefinido>): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertarComentarioPredefinido",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);

        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });

        fetchListadoComentariosPredefinidos();
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function updateComentarioPredefinido(data: Partial<ComentarioPredefinido>): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizarComentarioPredefinido",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);

        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });

        fetchListadoComentariosPredefinidos();
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function deleteComentarioPredefinido(data: Partial<ComentarioPredefinido>): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "eliminarComentarioPredefinido",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        console.log(response);
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });

        fetchListadoComentariosPredefinidos();
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function exportToExcelListadoComentarioPredefinidos(): Promise<void> {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer" as const,
    };
    const data = {
      id_branch: sessionBranchId(),
    };

    await axios
      .post<BlobPart>(
        import.meta.env.VITE_URL_MAIN + "exportarListadoComentariosPredefinidos",
        data,
        headers,
      )
      .then((response) => {
        const { data } = response;
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `LISTADO DE COMENTARIOS PREDEFINIDOS DE ESTADO DEL EMBARQUE ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        // this.previewFlag = false;
        // this.generandoFlag = false;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return {
    list,
    loading,
    record,
    maxCode,
    fetchListadoComentariosPredefinidos,
    fetchMaxCodeListadoComentariosPredefinidos,
    insertComentarioPredefinido,
    updateComentarioPredefinido,
    deleteComentarioPredefinido,
    exportToExcelListadoComentarioPredefinidos,
  };
});
