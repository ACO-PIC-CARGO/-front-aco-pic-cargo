import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import store from "@/store";
import { usePricingStore } from "@/stores/pricing";
import type { ApiResponse } from "@/types/api";
import type { FiltroModalidad, FormModalidad, Modalidad } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useModalityStore = defineStore("modality", () => {
  const list = ref<Modalidad[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Modalidad>>({});
  const loading = ref(false);

  function setListModality(data: Modalidad[]) {
    list.value = data;
    // While modality was a Vuex module this commit also ran pricing's and aduana's SET_LIST_MODALITY.
    usePricingStore().listModality = data;
    store.commit("SET_LIST_MODALITY", data);
  }

  async function fetchDataModality(data: FiltroModalidad): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Modalidad[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_modality?` +
        `id_branch=${sessionBranchId()}` +
        `&code=${encodeURIComponent(String(data.code))}` +
        `&name=${encodeURIComponent(String(data.name))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
        `&status=${data.status}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        setListModality(data.estadoflag ? data.data : []);
        loading.value = true;
        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function insertModality(data: FormModalidad): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_modality",
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
          fetchDataModality({ code: "", name: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readModality(id: Modalidad["id"]): Promise<void> {
    await axios<ApiResponse<Modalidad[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_modality?id=${id}`,
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

  async function updateModality(data: FormModalidad): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_modality",
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
          fetchDataModality({ code: "", name: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return { list, response, record, loading, fetchDataModality, insertModality, readModality, updateModality };
});
