import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { EstadoRegion, FiltroEstadoRegion } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useStatesStore = defineStore("states", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstState = ref<EstadoRegion[]>([]);
  const StateFilter = ref<FiltroEstadoRegion>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });
  const StateModel = ref<Partial<EstadoRegion>>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });

  async function GetListState(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_state?&id_branch=${sessionBranchId()}&name=${StateFilter.value.name}&description=${
          StateFilter.value.description ? StateFilter.value.description : ""
        }&id_pais=${StateFilter.value.id_pais ? StateFilter.value.id_pais : ""}&status=${StateFilter.value.status}&code=${
          StateFilter.value.code ? StateFilter.value.code : ""
        }`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<EstadoRegion[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstState.value = data.data;
          } else {
            lstState.value = [];
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

  async function setState(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_state`,
      headers: { "Content-Type": "application/json" },
      data: StateModel.value,
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

  async function ActualizarState(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_state`,
      headers: { "Content-Type": "application/json" },
      data: StateModel.value,
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

  return { tipo, drawer, lstState, StateFilter, StateModel, GetListState, setState, ActualizarState };
});
