import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroCatalogo, TipoDocumento } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useDocumentStore = defineStore("document", () => {
  const list = ref<TipoDocumento[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<TipoDocumento>>({});
  const loading = ref(false);

  async function fetchDataDocument(data: FiltroCatalogo): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<TipoDocumento[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_documents?` +
        `code=${encodeURIComponent(String(data.code))}` +
        `&name=${encodeURIComponent(String(data.name))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
        `&status=${data.status}` +
        `&id_branch=${sessionBranchId()}`,
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
        console.error("Error al obtener los datos:", error);
      });
  }

  async function insertDocument(data: Partial<TipoDocumento> & { id_branch?: number }): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_documents",
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
          fetchDataDocument({ name: "", description: "", code: "", status: 1 });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readDocument(id: number): Promise<void> {
    await axios<ApiResponse<TipoDocumento[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_documents?id=${id}`,
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

  async function updateDocument(data: Partial<TipoDocumento>): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_documents",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
            showCancelButton: false,
            confirmButtonText: "Ok",
          }).then(() => {
            fetchDataDocument({ name: "", description: "", code: "", status: 1 });
          });
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  return { list, response, record, loading, fetchDataDocument, insertDocument, readDocument, updateDocument };
});
