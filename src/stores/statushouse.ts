import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { EstadoHouse, OrdenEstadoHouse } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useStatushouseStore = defineStore("statushouse", () => {
  const listStatusHouse = ref<EstadoHouse[]>([]);
  const orden = ref<Partial<OrdenEstadoHouse> | undefined>({});

  function setListStatusHouse(data: EstadoHouse[]): void {
    data.map((item) => {
      item.verComentarios = false;
    });
    listStatusHouse.value = data;
  }

  async function getListStatusHouse(data: Record<string, unknown> = {}): Promise<void> {
    data.id_branch = sessionBranchId();
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listar_status_house`,
      params: data,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse<EstadoHouse[]>>(config)
      .then((response) => {
        const data = response.data;
        const list = data.estadoflag ? data.data : [];
        setListStatusHouse(list);
        if (!data.estadoflag) showRejectedResponse(data);
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function getObtenerOrdenStatusHouse(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `obtener_orden_status_house`,
      params: data,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse<OrdenEstadoHouse[]>>(config)
      .then((response) => {
        const data = response.data;
        const list = data.estadoflag ? data.data : [];
        orden.value = list[0];
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function GuardarStatusHouse(data: Record<string, unknown>): Promise<void> {
    data.id_branch = sessionBranchId();
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `guardar_orden_statuscomentarios`,
      data: data,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        getListStatusHouse({});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function GuardarStatus(data: EstadoHouse[]): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `guardar_orden_status`,
      data: { lstStatus: data },
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        getListStatusHouse({});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function EliminarStatus(data: Partial<EstadoHouse>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `eliminar_status`,
      data: data,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        getListStatusHouse({});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function EliminarComentario(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `eliminar_comentario`,
      data: data,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse>(config)
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        getListStatusHouse({});
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return {
    listStatusHouse,
    orden,
    getListStatusHouse,
    getObtenerOrdenStatusHouse,
    GuardarStatusHouse,
    GuardarStatus,
    EliminarStatus,
    EliminarComentario,
  };
});
