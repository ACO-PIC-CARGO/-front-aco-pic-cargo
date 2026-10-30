import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroSubIngreso, SubIngreso } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";

export const useSubingresoStore = defineStore("subingreso", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstSubIngreso = ref<SubIngreso[]>([]);
  const filtros = ref<FiltroSubIngreso>({
    id: "",
    id_ingreso: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: "null",
    mostrarflag: "null",
  });
  const model = ref<Partial<SubIngreso>>({
    id: "",
    id_ingreso: "",
    code: "",
    description: "",
    status: true,
    id_branch: "",
    calculoflag: true,
    mostrarflag: true,
  });

  async function GetListSubIngreso(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_subingreso",
      params: {
        id_ingreso: filtros.value.id_ingreso || "",
        code: filtros.value.code || "",
        description: filtros.value.description || "",
        status: filtros.value.status == "null" ? "" : filtros.value.status,
        calculoflag: filtros.value.calculoflag == "null" ? "" : filtros.value.calculoflag,
        mostrarflag: filtros.value.mostrarflag == "null" ? "" : filtros.value.mostrarflag,
      },
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<SubIngreso[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstSubIngreso.value = data.data;
          } else {
            lstSubIngreso.value = [];
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

  function getValidateCodeSubIngreso(): Promise<ApiResponse> {
    return request({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validate_code_subingreso",
      params: { code: model.value.code },
      headers: { "Content-Type": "application/json" },
    });
  }

  async function setSubIngreso(): Promise<boolean> {
    const response = await request({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insertar_subingreso",
      headers: { "Content-Type": "application/json" },
      data: model.value,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
    });
    return response.estadoflag;
  }

  async function ActualizarSubIngreso(): Promise<boolean> {
    const response = await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_subingreso",
      headers: { "Content-Type": "application/json" },
      data: model.value,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
    });
    return response.estadoflag;
  }

  return { tipo, drawer, lstSubIngreso, filtros, model, GetListSubIngreso, getValidateCodeSubIngreso, setSubIngreso, ActualizarSubIngreso };
});
