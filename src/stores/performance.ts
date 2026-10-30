import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroPerformance, FormPerformance, Performance } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";
import { sessionBranchId } from "@/utils/sesion";

type PerformanceRow = Performance & { editableflag?: boolean };

export const usePerformanceStore = defineStore("performance", () => {
  const list = ref<Performance[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Performance>>({});
  const loading = ref(false);
  const editable = ref(false);

  async function fetchDataPerformance(data: FiltroPerformance): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<PerformanceRow[]>>({
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
        if (data.estadoflag) editable.value = Boolean(data.data[0]!.editableflag);
        loading.value = true;

        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function savePerformance(method: "post" | "put", endpoint: string, data: FormPerformance): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + endpoint,
      headers: { "Content-Type": "application/json" },
      data: data,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
      showCancelButton: false,
      confirmButtonText: "Ok",
    });
    fetchDataPerformance({ code: "", description: "", status: 1 });
    return response.estadoflag;
  }

  const insertPerformance = (data: FormPerformance) => savePerformance("post", "insertar_performance", data);
  const updatePerformance = (data: FormPerformance) => savePerformance("put", "actualizar_performance", data);

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

  return { list, response, record, loading, editable, fetchDataPerformance, insertPerformance, readPerformance, updatePerformance };
});
