import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import type { ApiResponse } from "@/types/api";
import type { FiltroProveedorPricing, ProveedorPricing } from "@/types/entidades";
import { sessionBranchId } from "@/utils/sesion";

export const useProveedorStore = defineStore("proveedor", () => {
  const lstProveedores = ref<ProveedorPricing[]>([]);

  async function obtenerProveedorPricing(data: FiltroProveedorPricing): Promise<void> {
    data.id_branch = sessionBranchId();
    await axios<ApiResponse<ProveedorPricing[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_proveedor_pricing`,
      headers: { "Content-Type": "application/json" },
      params: data,
    })
      .then((response) => {
        const data = response.data;
        if (data.estadoflag) {
          lstProveedores.value = data.data;
        } else {
          lstProveedores.value = [];
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

  return { lstProveedores, obtenerProveedorPricing };
});
