import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FilaConsolidacion } from "@/types/operaciones";
import { showRejectedResponse } from "@/utils/rejectedResponse";

export const useConsolidacionStore = defineStore("consolidacion", () => {
  const lstConsolidacion = ref<FilaConsolidacion[]>([]);

  async function generarConsolidacion(data: unknown): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "generar_consolidacion",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaConsolidacion[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        lstConsolidacion.value = response.data.data;
        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return { lstConsolidacion, generarConsolidacion };
});
