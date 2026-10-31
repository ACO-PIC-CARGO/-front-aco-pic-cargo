import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import type { ApiResponse } from "@/types/api";
import type { FiltroTipoTelefono, FormTipoTelefono, TipoTelefono } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

export const useTypePhoneStore = defineStore("type_phone", () => {
  const list = ref<TipoTelefono[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<TipoTelefono>>({});

  async function fetchDataTypePhone(data: FiltroTipoTelefono): Promise<void> {
    await axios<ApiResponse<TipoTelefono[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `getListTypePhone?` +
        `id_branch=${sessionBranchId()}` +
        `&code=${encodeURIComponent(String(data.code))}` +
        `&name=${encodeURIComponent(String(data.name))}` +
        `&status=${data.status}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          list.value = data.data;
        } else {
          list.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && data.status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        }
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  async function reloadUnfilteredList(): Promise<void> {
    await fetchDataTypePhone({ code: "", name: "", status: 1 });
  }

  async function insertTypePhone(data: FormTipoTelefono): Promise<boolean> {
    return axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertTypePhone",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then(async (response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        const result = await Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
        if (result.isConfirmed) await reloadUnfilteredList();
        return result.isConfirmed;
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
        return false;
      });
  }

  async function readTypePhone(id: TipoTelefono["id"]): Promise<void> {
    await axios<ApiResponse<TipoTelefono[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `readTypePhone?id=${id}`,
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

  async function inactiveTypePhone(data: Pick<TipoTelefono, "id">): Promise<boolean> {
    return axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "deleteTypePhone",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then(async (response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        const result = await Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
        if (result.isConfirmed) await reloadUnfilteredList();
        return result.isConfirmed;
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
        return false;
      });
  }

  async function updateTypePhone(data: FormTipoTelefono): Promise<boolean> {
    return axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "updateTypePhone",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then(async (response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        if (!data.estadoflag) return false;
        const result = await Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
        if (result.isConfirmed) await reloadUnfilteredList();
        return result.isConfirmed;
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
        return false;
      });
  }

  return { list, response, record, fetchDataTypePhone, insertTypePhone, readTypePhone, inactiveTypePhone, updateTypePhone };
});
