import { defineStore } from "pinia";
import { ref } from "vue";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroMarketing, FormMarketing, Marketing, UltimaPosicionMarketing } from "@/types/catalogos";
import { request } from "@/utils/request";
import { sessionBranchId } from "@/utils/sesion";

export const useMarketingStore = defineStore("marketing", () => {
  const list = ref<Marketing[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Marketing>>({});
  const last_position = ref<UltimaPosicionMarketing>({});
  const loading = ref(false);

  function setListMarketing(data: Marketing[]) {
    list.value = data;
  }

  async function fetchDataMarketing(data: FiltroMarketing): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Marketing[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listar_marketing`,
      params: data,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        setListMarketing(data.estadoflag ? data.data : []);
        loading.value = true;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function saveMarketing(method: "post" | "put", path: string, data: FormMarketing): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: { "Content-Type": "application/json" },
      data: data,
    });
    await Swal.fire({ icon: response.estadoflag ? "success" : "error", text: response.mensaje });
    return response.estadoflag;
  }

  const insertMarketing = (data: FormMarketing) => saveMarketing("post", "insertar_marketing", data);
  const updateMarketing = (data: FormMarketing) => saveMarketing("put", "actualizar_marketing", data);

  async function readMarketing(id: Marketing["id"]): Promise<void> {
    await axios<ApiResponse<Marketing[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_marketing?id=${id}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
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

  async function lastPositionMarketing(): Promise<void> {
    await axios<ApiResponse<UltimaPosicionMarketing[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ultima_posicion_marketing?` + `id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        if (data.estadoflag) {
          last_position.value = data.data[0]!;
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function ExportMarketing(filter: FiltroMarketing): Promise<void> {
    try {
      const { data } = await axios<Blob>({
        method: "get",
        url: import.meta.env.VITE_URL_MAIN + `exportar_list_marketing`,
        params: { ...filter, status: filter.status == "null" ? null : filter.status },
        responseType: "blob",
        headers: { "Content-Type": "application/json" },
      });
      if (data.type.includes("json")) {
        const answer = JSON.parse(await data.text()) as ApiResponse;
        Swal.fire({ icon: "info", text: answer.mensaje });
        return;
      }
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte Listado Marketing ${moment().format("DD_MM_YYYY_h_mm_ss")} .xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch {
      Swal.fire({ icon: "error", text: "No pudimos generar el Excel. Revisa tu conexión e intenta de nuevo." });
    }
  }

  return {
    list,
    response,
    record,
    last_position,
    loading,
    fetchDataMarketing,
    insertMarketing,
    readMarketing,
    updateMarketing,
    lastPositionMarketing,
    ExportMarketing,
  };
});
