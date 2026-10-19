import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { SucursalListado } from "@/types/seguridad";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { useCityStore } from "@/stores/city";

export const useBranchStore = defineStore("branch", () => {
  const lstBranch = ref<SucursalListado[]>([]);

  async function ListadoSucursal(): Promise<void> {
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}listar_sucursal`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<SucursalListado[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstBranch.value = data.data;
          } else {
            useCityStore().lstCity = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function inactivarSucursal(id: number): Promise<void> {
    const config = {
      method: "put",
      url: `${import.meta.env.VITE_URL_MAIN}inactivar_sucursal`,
      data: {
        id: id,
      },
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          showRejectedResponse(data);
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  return { lstBranch, ListadoSucursal, inactivarSucursal };
});
