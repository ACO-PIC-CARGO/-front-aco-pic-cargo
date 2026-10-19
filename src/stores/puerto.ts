import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroPuerto } from "@/types/catalogos";
import type { Puerto } from "@/types/cotizacion";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

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
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_puerto?&id_branch=${sessionBranchId()}&name=${PortFilter.value.name}&description=${
          PortFilter.value.description
        }&id_pais=${PortFilter.value.id_pais}&status=${PortFilter.value.status}&id_transporte=${PortFilter.value.id_transporte}&code=${
          PortFilter.value.code
        }`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<Puerto[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstPort.value = data.data;
          } else {
            lstPort.value = [];
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

  async function setPuerto(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_puerto`,
      headers: { "Content-Type": "application/json" },
      data: PortModel.value,
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

  async function ActualizarPuerto(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_puerto`,
      headers: { "Content-Type": "application/json" },
      data: PortModel.value,
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
