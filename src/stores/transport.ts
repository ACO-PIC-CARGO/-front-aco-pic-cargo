import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useShipmentStore } from "@/stores/shipment";
import type { ApiResponse } from "@/types/api";
import type { FiltroTransporte, FormTransporte, Transporte } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useTransportStore = defineStore("transport", () => {
  const list = ref<Transporte[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Transporte>>({});
  const loading = ref(false);

  function setListTransport(data: Transporte[]) {
    list.value = data;
    // While transport was a Vuex module this commit also ran shipment's SET_LIST_TRANSPORT.
    useShipmentStore().transports = data;
  }

  async function fetchDataTransport(data: FiltroTransporte): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Transporte[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_transport?` +
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

        setListTransport(data.estadoflag ? data.data : []);
        loading.value = true;

        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function insertTransport(data: FormTransporte): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_transport",
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
          fetchDataTransport({ name: "", code: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readTransport(id: Transporte["id"]): Promise<void> {
    await axios<ApiResponse<Transporte[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_transport?id=${id}`,
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

  async function updateTransport(data: FormTransporte): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_transport",
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
          fetchDataTransport({ name: "", code: "", description: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function cargarTransport(): Promise<void> {
    await axios<ApiResponse<Transporte[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_transport?` + `id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        setListTransport(data.estadoflag ? data.data : []);

        if (!data.estadoflag) {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return { list, response, record, loading, fetchDataTransport, insertTransport, readTransport, updateTransport, cargarTransport };
});
