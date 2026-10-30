import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroPuerto } from "@/types/catalogos";
import type { Puerto } from "@/types/cotizacion";
import { filledParams } from "@/utils/queryParams";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";

export const usePuertoStore = defineStore("puerto", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstPort = ref<Puerto[]>([]);
  const PortFilter = ref<FiltroPuerto>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  });
  const PortModel = ref<Puerto>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  });

  async function GetListPort(): Promise<void> {
    const { name, description, id_pais, status, id_transporte, code } = PortFilter.value;
    const response = await request<Puerto>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_puerto",
      headers: { "Content-Type": "application/json" },
      params: filledParams({ name, description, id_pais, status, id_transporte, code }),
    });
    lstPort.value = response.estadoflag ? response.data : [];
    if (!response.estadoflag) showRejectedResponse(response);
  }

  async function savePuerto(method: "post" | "put", endpoint: string): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + endpoint,
      headers: { "Content-Type": "application/json" },
      data: PortModel.value,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
    });
    return response.estadoflag;
  }

  const setPuerto = () => savePuerto("post", "insertar_puerto");
  const ActualizarPuerto = () => savePuerto("put", "actualizar_puerto");

  async function verPuerto(params: { id: number | string; id_transport?: number | string }): Promise<Puerto | null | undefined | false> {
    let res: Puerto | null | undefined = null;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_puerto`,
      headers: { "Content-Type": "application/json" },
      params: params,
    };
    try {
      await axios<ApiResponse<Puerto[]>>(config)
        .then(function (response) {
          const data = response.data;
          res = data.data[0];
        })
        .catch(function (error) {
          console.error(error);
        });

      return res;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  return { tipo, drawer, lstPort, PortFilter, PortModel, GetListPort, setPuerto, ActualizarPuerto, verPuerto };
});
