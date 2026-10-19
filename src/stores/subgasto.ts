import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroSubGasto, SubGasto } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useSubgastoStore = defineStore("subgasto", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstSubGasto = ref<SubGasto[]>([]);
  const filtros = ref<FiltroSubGasto>({
    id: "",
    id_gasto: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: "null",
    mostrarflag: "null",
  });
  const model = ref<SubGasto>({
    id: "",
    id_gasto: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: true,
    mostrarflag: true,
  });

  async function GetListSubGasto(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_subgasto?&id_branch=${sessionBranchId()}&id_gasto=${
          filtros.value.id_gasto ? filtros.value.id_gasto : ""
        }&code=${filtros.value.code ? filtros.value.code : ""}&description=${
          filtros.value.description ? filtros.value.description : ""
        }&status=${
          filtros.value.status == "null" ? "" : filtros.value.status
        }&calculoflag=${
          filtros.value.calculoflag == "null" ? "" : filtros.value.calculoflag
        }&mostrarflag=${
          filtros.value.mostrarflag == "null" ? "" : filtros.value.mostrarflag
        }`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<SubGasto[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstSubGasto.value = data.data;
          } else {
            lstSubGasto.value = [];
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

  async function getValidateCodeSubGasto(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `validate_code_subgasto?id_branch=${sessionBranchId()}&code=${model.value.code}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function setSubGasto(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_subgasto`,
      headers: { "Content-Type": "application/json" },
      data: model.value,
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

  async function ActualizarSubGasto(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_subgasto`,
      headers: { "Content-Type": "application/json" },
      data: model.value,
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

  return { tipo, drawer, lstSubGasto, filtros, model, GetListSubGasto, getValidateCodeSubGasto, setSubGasto, ActualizarSubGasto };
});
