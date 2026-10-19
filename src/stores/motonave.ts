import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroMotonave, Motonave } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useMotonaveStore = defineStore("motonave", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstMotonave = ref<Motonave[]>([]);
  const MotonaveFilter = ref<FiltroMotonave>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  });
  const MotonaveModel = ref<Partial<Motonave>>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  });

  async function GetListMotonave(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_motonave?&id_branch=${sessionBranchId()}&name=${MotonaveFilter.value.name}&description=${
          MotonaveFilter.value.description
        }&status=${MotonaveFilter.value.status == "null" ? "" : MotonaveFilter.value.status}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<Motonave[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          if (data.estadoflag == true) {
            lstMotonave.value = data.data;
          } else {
            lstMotonave.value = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function setMotonave(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_motonave`,
      headers: { "Content-Type": "application/json" },
      data: MotonaveModel.value,
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function ActualizarMotonave(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_motonave`,
      headers: { "Content-Type": "application/json" },
      data: MotonaveModel.value,
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  return { tipo, drawer, lstMotonave, MotonaveFilter, MotonaveModel, GetListMotonave, setMotonave, ActualizarMotonave };
});
