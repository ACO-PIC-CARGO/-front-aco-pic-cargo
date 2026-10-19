import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import store from "@/store";
import type { ApiResponse } from "@/types/api";
import type { FiltroMultiplicador, TipoCarga } from "@/types/catalogos";
import type { Multiplicador } from "@/types/cotizacion";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useMultiplicadorStore = defineStore("multiplicador", () => {
  const list = ref<Multiplicador[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Multiplicador>({});
  const shipments = ref<TipoCarga[]>([]);
  const loading = ref(false);

  async function fetchDataCargarShipment(): Promise<void> {
    await axios<ApiResponse<TipoCarga[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_shipment?` + `id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          shipments.value = data.data;
          // While multiplicador was a Vuex module this commit also ran pricing's and aduana's SET_LIST_SHIPMENT.
          store.commit("SET_LIST_SHIPMENT", data.data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function fetchDataMultiplicador(data: FiltroMultiplicador): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Multiplicador[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_multiplicador?` +
        `id_branch=${sessionBranchId()}` +
        `&code=${encodeURIComponent(String(data.code))}` +
        `&name=${encodeURIComponent(String(data.name))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
        `&id_shipment=${data.id_shipment}` +
        `&status=${data.status}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          list.value = data.data;
          loading.value = true;
        } else {
          list.value = [];
          loading.value = true;
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readMultiplicador(id: Multiplicador["id"]): Promise<void> {
    await axios<ApiResponse<Multiplicador[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_multiplicador?id=${id}`,
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

  async function updateMultiplicador(data: Multiplicador): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_multiplicador",
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
          fetchDataMultiplicador({ code: "", name: "", description: "", id_shipment: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function nuevoMultiplicador(data: Multiplicador): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "nuevo_multiplicador",
      headers: { "Content-Type": "application/json" },
      data: {
        ...data,
        id_branch: sessionBranchId(),
      },
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
          fetchDataMultiplicador({ code: "", name: "", description: "", id_shipment: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return {
    list,
    response,
    record,
    shipments,
    loading,
    fetchDataCargarShipment,
    fetchDataMultiplicador,
    readMultiplicador,
    updateMultiplicador,
    nuevoMultiplicador,
  };
});
