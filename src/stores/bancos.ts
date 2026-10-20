import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/api/http";
import store from "@/store";
import type { ApiResponse } from "@/types/api";
import type { CuentaBancariaPic } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";
// import Swal from "sweetalert2";
// import funciones from "./../../mixins/funciones";

export const useBancosStore = defineStore("bancos", () => {
  const cuentas = ref<CuentaBancariaPic[]>([]);
  const validacionBanco = ref<ApiResponse | null>(null);

  async function getListBanksDetailsCargar(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CuentaBancariaPic[]>>(config)
      .then(function (response) {
        store.state.cuentas_pic = response.data.data;
        cuentas.value = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getValidaNroOp(nro_operacion: string | number): Promise<ApiResponse | null> {
    let res: ApiResponse | null = null;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_nro_operacion?nro_operacion=" + nro_operacion,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        validacionBanco.value = response.data;
        res = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }

  return { cuentas, validacionBanco, getListBanksDetailsCargar, getValidaNroOp };
});
