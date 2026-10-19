import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroItemServicio, ItemServicio } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const useItemServicesStore = defineStore("itemServices", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstItemServices = ref<ItemServicio[]>([]);
  const filtros = ref<FiltroItemServicio>({
    id: "",
    id_groupservices: "",
    code: "",
    name: "",
    description: "",
    id_branch: "",
    status: 1,
  });
  const model = ref<ItemServicio>({
    id: "",
    id_groupservices: "",
    code: "",
    name: "",
    description: "",
    id_branch: "",
    status: "",
  });

  async function GetListItemServices(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_itemservices?&id_branch=${sessionBranchId()}&id_groupservices=${
          filtros.value.id_groupservices ? filtros.value.id_groupservices : ""
        }&code=${filtros.value.code ? filtros.value.code : ""}&name=${
          filtros.value.name ? filtros.value.name : ""
        }&description=${
          filtros.value.description ? filtros.value.description : ""
        }&status=${filtros.value.status == "null" ? "" : filtros.value.status}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<ItemServicio[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstItemServices.value = data.data;
          } else {
            lstItemServices.value = [];
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

  async function setItemServices(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_itemservices`,
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

  async function ActualizarItemServices(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_itemservices`,
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

  return { tipo, drawer, lstItemServices, filtros, model, GetListItemServices, setItemServices, ActualizarItemServices };
});
