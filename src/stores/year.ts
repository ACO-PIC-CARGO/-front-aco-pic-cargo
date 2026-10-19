import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Anio, FiltroAnio, FormAnio } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useYearStore = defineStore("year", () => {
  const list = ref<Anio[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<Anio>>({});
  const loading = ref(false);

  async function fetchDataYear(data: FiltroAnio): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<Anio[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_year?` +
        `id_branch=${sessionBranchId()}` +
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
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  async function insertYear(data: FormAnio): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_year",
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
        }).then((result) => {
          if (result.isConfirmed) {
            fetchDataYear({ description: "", status: 1 });
          }
        });
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  async function readYear(id: Anio["id"]): Promise<void> {
    await axios<ApiResponse<Anio[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_year?id=${id}`,
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
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  async function updateYear(data: FormAnio): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_year",
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
        }).then((result) => {
          if (result.isConfirmed) {
            fetchDataYear({ description: "", status: 1 });
          }
        });
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  return { list, response, record, loading, fetchDataYear, insertYear, readYear, updateYear };
});
