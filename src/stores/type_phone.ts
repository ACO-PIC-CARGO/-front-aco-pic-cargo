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
          // Stores the whole response body, not its rows.
          list.value = response.data as unknown as TipoTelefono[];
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

  async function insertTypePhone(data: FormTipoTelefono): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertTypePhone",
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
            window.location.reload();
          }
        });
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  async function readTypePhone(id: TipoTelefono["id"]): Promise<void> {
    await axios<ApiResponse>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `readTypePhone?id=${id}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          record.value = data as Partial<TipoTelefono>;
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

  async function inactiveTypePhone(data: Pick<TipoTelefono, "id">): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "deleteTypePhone",
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
            window.location.reload();
          }
        });
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  async function updateTypePhone(data: FormTipoTelefono): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "updateTypePhone",
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
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        }
      })
      .catch((e) => {
        console.error("Error al obtener los datos:", e);
      });
  }

  return { list, response, record, fetchDataTypePhone, insertTypePhone, readTypePhone, inactiveTypePhone, updateTypePhone };
});
