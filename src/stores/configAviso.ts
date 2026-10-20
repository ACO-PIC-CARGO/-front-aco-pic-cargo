import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ConfigAviso } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";

export const useConfigAvisoStore = defineStore("configAviso", () => {
  const configAviso = ref<ConfigAviso>({});

  async function obtenerConfigAviso(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "get_ver_configaviso",
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ConfigAviso[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          console.log(data.data[0]);
          configAviso.value = data.data[0]!;
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function actualizarConfigAviso(data: ConfigAviso): Promise<void> {
    const config = {
      method: "PUT",
      url: import.meta.env.VITE_URL_MAIN + "actualizarConfigAviso",
      data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
          });
          // console.log(data.data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return { configAviso, obtenerConfigAviso, actualizarConfigAviso };
});
