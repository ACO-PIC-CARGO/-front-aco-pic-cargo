import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Distrito, FiltroDistrito } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useTownStore = defineStore("town", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstTown = ref<Distrito[]>([]);
  const filtros = ref<FiltroDistrito>({
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });
  const model = ref<Partial<Distrito>>({
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });

  async function GetListTown(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_town?&id_branch=${sessionBranchId()}&id_pais=${filtros.value.id_pais ? filtros.value.id_pais : ""}&id_city=${
          filtros.value.id_city ? filtros.value.id_city : ""
        }&id_state=${filtros.value.id_state ? filtros.value.id_state : ""}&id_town=${
          filtros.value.id_town ? filtros.value.id_town : ""
        }&code=${filtros.value.code ? filtros.value.code : ""}&name=${filtros.value.name ? filtros.value.name : ""}&description=${
          filtros.value.description ? filtros.value.description : ""
        }&status=${filtros.value.status ? filtros.value.status : ""}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<Distrito[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstTown.value = data.data;
          } else {
            lstTown.value = [];
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

  async function cargarTownParaPricing(params: { id_pais: number | string }): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_town_pricing`,
      params: params,
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<Distrito[]>>(config)
        .then(function (response) {
          const data = response.data;
          if (data.estadoflag == true) {
            lstTown.value = data.data;
          } else {
            lstTown.value = [];
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function setTown(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_town`,
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

  async function ActualizarTown(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_town`,
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

  return { tipo, drawer, lstTown, filtros, model, GetListTown, cargarTownParaPricing, setTown, ActualizarTown };
});
