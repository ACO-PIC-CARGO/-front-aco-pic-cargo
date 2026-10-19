import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Moneda } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export interface FiltroMonedas {
  code: string;
  symbol: string;
  acronym: string;
  name: string;
  description: string;
  status: number | string;
}

export const useCoinsStore = defineStore("coins", () => {
  const list = ref<Moneda[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Moneda>>({});
  const itemsCoinsList = ref<Moneda[]>([]);
  const loading = ref(false);

  async function fetchDataCoins(data: FiltroMonedas): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Moneda[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_coins?` +
        `id_branch=${sessionBranchId()}` +
        `&code=${encodeURIComponent(data.code)}` +
        `&symbol=${encodeURIComponent(data.symbol)}` +
        `&acronym=${encodeURIComponent(data.acronym)}` +
        `&name=${encodeURIComponent(data.name)}` +
        `&description=${encodeURIComponent(data.description)}` +
        `&status=${data.status}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        list.value = data.estadoflag ? data.data : [];
        loading.value = true;

        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function insertCoins(data: Partial<Moneda> & { id_branch?: number }): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_coins",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(() => {
          fetchDataCoins({ code: "", symbol: "", acronym: "", name: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readCoins(id: number): Promise<void> {
    await axios<ApiResponse<Moneda[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_coins?id=${id}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          record.value = data.data[0]!;
        } else {
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function updateCoins(data: Partial<Moneda>): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_coins",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(() => {
          fetchDataCoins({ code: "", symbol: "", acronym: "", name: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function getCoinsListCargar(): Promise<void> {
    await axios<ApiResponse<Moneda[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getCoinsList?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag == true) {
          itemsCoinsList.value = response.data.data;
        } else {
          itemsCoinsList.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return { list, response, record, itemsCoinsList, loading, fetchDataCoins, insertCoins, readCoins, updateCoins, getCoinsListCargar };
});
