import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroGastoIngreso, TipoIngreso } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useIngresosStore = defineStore("ingresos", () => {
  const list = ref<TipoIngreso[]>([]);
  const response = ref<unknown[]>([]);
  const record = ref<Partial<TipoIngreso>>({});
  const loading = ref(false);

  async function cargarIngreso(): Promise<void> {
    await axios<ApiResponse<TipoIngreso[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_ingreso?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          list.value = data.data;
        } else {
          list.value = [];
          showRejectedResponse(data);
        }
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function fetchDataIngreso(data: FiltroGastoIngreso): Promise<void> {
    loading.value = false;
    await axios<ApiResponse<TipoIngreso[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_ingreso?` +
        `id_branch=${sessionBranchId()}` +
        `&code=${encodeURIComponent(String(data.code))}` +
        `&description=${encodeURIComponent(String(data.description))}` +
        `&calculoflag=${data.calculoflag}` +
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

  async function insertIngreso(data: Partial<TipoIngreso> & { id_branch?: number }): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_ingreso",
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
          fetchDataIngreso({ code: "", description: "", calculoflag: "", status: true });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function readIngreso(id: number): Promise<void> {
    await axios<ApiResponse<TipoIngreso[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_ingreso?id=${id}`,
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

  async function updateIngreso(data: Partial<TipoIngreso>): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_ingreso",
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
          fetchDataIngreso({ code: "", description: "", calculoflag: "", status: true });
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function ActualizarCXC(data: unknown): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_cxc",
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
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function ActualizarCXP(data: unknown): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_cxp",
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
    cargarIngreso,
    fetchDataIngreso,
    insertIngreso,
    readIngreso,
    updateIngreso,
    ActualizarCXC,
    ActualizarCXP,
  };
});
