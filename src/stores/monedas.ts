import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Moneda } from "@/types/catalogos";

export const useMonedasStore = defineStore("monedas", () => {
  const moneda = ref<Moneda[] | null>(null);

  async function CargarMoneda(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_moneda`,
      headers: headers,
    };
    const valores = await axios<ApiResponse<Moneda[]>>(config);
    if (valores.data.estadoflag) {
      moneda.value = valores.data.data;
    } else {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
    }
  }

  return { moneda, CargarMoneda };
});
