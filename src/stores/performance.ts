import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroPerformance, FormPerformance, Performance } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const usePerformanceStore = defineStore("performance", () => {
  const list = ref<Performance[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Performance>>({});
  const loading = ref(false);

  async function fetchDataPerformance(data: FiltroPerformance): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Performance[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_performance?` +
        `id_branch=${sessionBranchId()}` +
        `&code=${encodeURIComponent(String(data.code))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
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

  async function insertPerformance(data: FormPerformance): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_performance",
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
          fetchDataPerformance({ code: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readPerformance(id: Performance["id"]): Promise<void> {
    await axios<ApiResponse<Performance[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_performance?id=${id}`,
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

  async function updatePerformance(data: FormPerformance): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_performance",
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
          fetchDataPerformance({ code: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return { list, response, record, loading, fetchDataPerformance, insertPerformance, readPerformance, updatePerformance };
});
