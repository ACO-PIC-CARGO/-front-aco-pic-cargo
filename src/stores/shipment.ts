import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import store from "@/store";
import { useMultiplicadorStore } from "@/stores/multiplicador";
import type { ApiResponse } from "@/types/api";
import type { FiltroTipoCarga, FormTipoCarga, Transporte } from "@/types/catalogos";
import type { TipoCarga } from "@/types/cotizacion";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useShipmentStore = defineStore("shipment", () => {
  const list = ref<TipoCarga[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<TipoCarga>>({});
  const loading = ref(false);
  const transports = ref<Transporte[]>([]);

  function setListShipment(data: TipoCarga[]) {
    list.value = data;
    // While shipment was a Vuex module this commit also ran multiplicador's, pricing's and aduana's SET_LIST_SHIPMENT.
    useMultiplicadorStore().shipments = data;
    store.commit("SET_LIST_SHIPMENT", data);
  }

  async function fetchDataCargarTransport(): Promise<void> {
    await axios<ApiResponse<Transporte[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_transports?` + `id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          transports.value = data.data;
        } else {
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function fetchDataShipment(data: FiltroTipoCarga): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<TipoCarga[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_shipment?` +
        `id_branch=${sessionBranchId()}` +
        `&id_transport=${data.id_transport}` +
        `&name=${encodeURIComponent(String(data.name))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
        `&status=${data.status}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          setListShipment(data.data);
          loading.value = true;
        } else {
          setListShipment([]);
          loading.value = true;
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function insertShipment(data: FormTipoCarga): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_shipment",
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
          fetchDataShipment({ name: "", description: "", id_transport: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readShipment(id: TipoCarga["id"]): Promise<void> {
    await axios<ApiResponse<TipoCarga[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_shipment?id=${id}`,
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

  async function updateShipment(data: FormTipoCarga): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_shipment",
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
          fetchDataShipment({ name: "", description: "", id_transport: "", status: 1 });
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
    loading,
    transports,
    fetchDataCargarTransport,
    fetchDataShipment,
    insertShipment,
    readShipment,
    updateShipment,
  };
});
