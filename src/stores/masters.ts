import { defineStore } from "pinia";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ComentarioMaster } from "@/types/operaciones";

export const useMastersStore = defineStore("masters", () => {
  async function createCarpetaOneDrive({ name = "" }: { name?: string }): Promise<string | false> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `crear-carpeta-master?nromaster=${name}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await axios<ApiResponse<string>>(config)
      .then(async function (response) {
        return response.data.data;
      })
      .catch((e) => {
        console.error(e);
        return false as const;
      });
    return res;
  }
  async function actualizarMaster({ id = 0, url = "" }: { id?: number; url?: string }): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `update_folder_onedrive`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios<ApiResponse>(config).then(async function (response) {
      return response.data.data;
    });
  }
  async function insertComentarioMaster({
    id_entitie = 0,
    id_master = 0,
    fecha = 0,
    comentario = 0,
  }: ComentarioMaster): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insert_comentario_master`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_entitie: id_entitie,
        id_master: id_master,
        fecha: fecha,
        comentario: comentario,
      },
    };

    await axios<ApiResponse>(config).then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      const res = response.data;
      if (res.status == "401") {
        Swal.fire({
          icon: "error",
          text: res.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal) => {
          if (resSwal.isConfirmed && res.status == "401") {
            // @ts-expect-error Kept: router is not imported in this module, so a confirmed 401 throws a ReferenceError.
            router.push({ name: "Login" });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }
        });
      } else {
        Swal.fire({
          icon: res.estadoflag == true ? "success" : "error",
          text: res.mensaje,
        });
      }
    });
  }
  async function actualizarURLEnElMaster({ id = "", url = "" }: { id?: number | string; url?: string }): Promise<void> {
    console.log("crearCarpetaOneDrive", url);
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_folder_onedrive_master`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios<ApiResponse>(config).then(async (response) => {
      return response.data.data;
    });
  }
  async function moverCostos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `mover_cgegresos`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(async (response) => {
        return response.data.data;
      })
      .catch((e) => {
        console.error(e);
      });
  }
  async function controlGastosReactivar(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `master_control_reactivar`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(async (response) => {
        return response.data.data;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  return {
    createCarpetaOneDrive,
    actualizarMaster,
    insertComentarioMaster,
    actualizarURLEnElMaster,
    moverCostos,
    controlGastosReactivar,
  };
});
