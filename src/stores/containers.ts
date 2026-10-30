import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroCatalogo, FormContenedor, TipoContenedor } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";

export const useContainersStore = defineStore("containers", () => {
  const list = ref<TipoContenedor[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<TipoContenedor>>({});
  const loading = ref(false);

  async function fetchDataContainers(data: FiltroCatalogo): Promise<void> {
    loading.value = false;

    await axios<ApiResponse<TipoContenedor[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_containers?` +
        `code=${encodeURIComponent(String(data.code))}` +
        `&name=${encodeURIComponent(String(data.name))}` +
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

  async function insertContainers(data: FormContenedor): Promise<void> {
    const response = await request({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_containers",
      headers: { "Content-Type": "application/json" },
      data: data,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
      showCancelButton: false,
      confirmButtonText: "Ok",
    });
    fetchDataContainers({ code: "", description: "", name: "", status: 1 });
  }

  async function readContainers(id: number): Promise<void> {
    await axios<ApiResponse<TipoContenedor[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_containers?id=${id}`,
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

  async function updateContainers(data: FormContenedor): Promise<void> {
    const response = await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_containers",
      headers: { "Content-Type": "application/json" },
      data: data,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
      showCancelButton: false,
      confirmButtonText: "Ok",
    });
    fetchDataContainers({ code: "", description: "", name: "", status: 1 });
  }

  return { list, response, record, loading, fetchDataContainers, insertContainers, readContainers, updateContainers };
});
