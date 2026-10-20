import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import store from "@/store";
import { usePricingStore } from "@/stores/pricing";
import type { ApiResponse } from "@/types/api";
import type { FiltroIncoterms, FormIncoterm } from "@/types/catalogos";
import type { Incoterm } from "@/types/cotizacion";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useIncotermStore = defineStore("incoterm", () => {
  const list = ref<Incoterm[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Incoterm>({});
  const loading = ref(false);

  function setListIncoterms(data: Incoterm[]) {
    list.value = data;
    // While incoterm was a Vuex module this commit also ran pricing's and aduana's SET_LIST_INCOTERMS.
    usePricingStore().listIncoterms = data;
    store.commit("SET_LIST_INCOTERMS", data);
  }

  async function fetchDataIncoterms(data: FiltroIncoterms): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Incoterm[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_incoterms?` +
        `id_branch=${sessionBranchId()}` +
        `&name=${encodeURIComponent(String(data.name))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
        `&status=${data.status}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        setListIncoterms(data.estadoflag ? data.data : []);
        loading.value = true;
        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function insertIncoterms(data: FormIncoterm): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_incoterms",
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
          fetchDataIncoterms({ name: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readIncoterms(id: Incoterm["id"]): Promise<void> {
    await axios<ApiResponse<Incoterm[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_incoterms?id=${id}`,
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

  async function updateIncoterms(data: FormIncoterm): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_incoterms",
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
          fetchDataIncoterms({ name: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function CargarIncotermsConfig(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };
    await axios<ApiResponse<Incoterm[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_incoterms_config`,
      headers: { "Content-Type": "application/json" },
      params: data,
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          setListIncoterms(data.data);
        } else {
          setListIncoterms([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    list,
    response,
    record,
    loading,
    fetchDataIncoterms,
    insertIncoterms,
    readIncoterms,
    updateIncoterms,
    CargarIncotermsConfig,
  };
});
