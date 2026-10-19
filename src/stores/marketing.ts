import { defineStore } from "pinia";
import { ref } from "vue";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import store from "@/store";
import type { ApiResponse } from "@/types/api";
import type { FiltroMarketing, FormMarketing, Marketing, UltimaPosicionMarketing } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

export const useMarketingStore = defineStore("marketing", () => {
  const list = ref<Marketing[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Marketing>>({});
  const last_position = ref<UltimaPosicionMarketing>({});
  const loading = ref(false);

  function setListMarketing(data: Marketing[]) {
    list.value = data;
    // While marketing was a Vuex module this commit also ran pricing's SET_LIST_MARKETING.
    store.commit("SET_LIST_MARKETING", data);
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

  async function insertMarketing(data: FormMarketing): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_marketing",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(() => {
          fetchDataMarketing({ name: "", description: "", position: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

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

  async function updateMarketing(data: FormMarketing): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_marketing",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        const data = response.data;
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        }).then(() => {
          fetchDataMarketing({ name: "", description: "", position: "", status: 1 });
        });
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

  async function ExportMarketing(data: FiltroMarketing): Promise<void> {
    await axios<Blob>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `exportar_list_marketing`,
      params: data,
      responseType: "blob",
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Reporte Listado Marketing ${moment().format("DD_MM_YYYY_h_mm_ss")} .xlsx`);
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.error(error);
      });
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
