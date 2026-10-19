import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Ciudad, FiltroCiudad } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useCityStore = defineStore("city", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstCity = ref<Ciudad[]>([]);
  const filtros = ref<FiltroCiudad>({
    id: "",
    id_pais: "",
    id_state: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });
  const model = ref<Partial<Ciudad>>({
    id: "",
    id_pais: "",
    id_state: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });

  async function GetListCity(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_city?&id_branch=${sessionBranchId()}&name=${filtros.value.name ? filtros.value.name : ""}&description=${
          filtros.value.description ? filtros.value.description : ""
        }&id_pais=${filtros.value.id_pais ? filtros.value.id_pais : ""}&id_state=${
          filtros.value.id_state ? filtros.value.id_state : ""
        }&status=${filtros.value.status !== "null" ? filtros.value.status : ""}&code=${filtros.value.code ? filtros.value.code : ""}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<Ciudad[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstCity.value = data.data;
          } else {
            lstCity.value = [];
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

  async function setCity(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_city`,
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

  async function ActualizarCity(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_city`,
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

  return { tipo, drawer, lstCity, filtros, model, GetListCity, setCity, ActualizarCity };
});
