import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Begend, FiltroBegend, FormBegend } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useBegendStore = defineStore("begend", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstBegend = ref<Begend[]>([]);
  const filtros = ref<FiltroBegend>({
    id: "",
    position: "",
    code: "",
    name: "",
    description: "",
    color: "",
    status: "1",
  });
  const model = ref<FormBegend>({
    id: "",
    position: "",
    code: "",
    name: "",
    description: "",
    color: "",
    status: "1",
  });

  async function GetListBegend(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_begend?&id_branch=${sessionBranchId()}&status=${filtros.value.status ? filtros.value.status : ""}&position=${
          filtros.value.position ? filtros.value.position : ""
        }&code=${filtros.value.code ? filtros.value.code : ""}&name=${filtros.value.name ? filtros.value.name : ""}&description=${
          filtros.value.description ? filtros.value.description : ""
        }&color=${filtros.value.color ? filtros.value.color : ""}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<Begend[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          if (data.estadoflag == true) {
            lstBegend.value = data.data;
          } else {
            lstBegend.value = [];
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

  async function getValidatePositionBegend(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `validate_position_begend?id_branch=${sessionBranchId()}&position=${model.value.position}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function setBegend(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_begend`,
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

  async function getValidatePositionActualizarBegend(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_actualizar_begend?id_branch=${sessionBranchId()}&id=${model.value.id}&position=${model.value.position}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function ActualizarBegend(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_begend`,
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

  return {
    tipo,
    drawer,
    lstBegend,
    filtros,
    model,
    GetListBegend,
    getValidatePositionBegend,
    setBegend,
    getValidatePositionActualizarBegend,
    ActualizarBegend,
  };
});
