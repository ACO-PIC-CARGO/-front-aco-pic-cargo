import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import type { ApiResponse } from "@/types/api";
import type { FiltroPosicion, FormPosicion, PosicionListado, UsuarioNoAsignado } from "@/types/seguridad";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";

export const usePositionStore = defineStore("position", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstPosition = ref<PosicionListado[]>([]);
  const lstUsuarioNoAsignado = ref<UsuarioNoAsignado[]>([]);
  const filtros = ref<FiltroPosicion>({
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    estado: true,
  });
  const model = ref<FormPosicion>({
    id: "",
    code: "",
    name: "",
    description: "",
    estado: "",
    modules_position: [],
    button_position: [],
    user_position: [],
  });

  function setModel(rows: FormPosicion[]): void {
    model.value = rows[0]!;
  }

  async function cargarPosition(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_posicion?&id_branch=${sessionBranchId()}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<PosicionListado[]> & { estado?: string }>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstPosition.value = data.data;
          } else {
            lstPosition.value = [];
            Swal.fire({
              icon: data.status == "401" ? "error" : "info",
              text: data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && data.estado == "401") {
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function GetListPosition(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_posicion?&id_branch=${sessionBranchId()}&code=${filtros.value.code ? filtros.value.code : ""}&name=${
          filtros.value.name ? filtros.value.name : ""
        }&description=${filtros.value.description ? filtros.value.description : ""}&estado=${
          filtros.value.estado == "null" ? "" : filtros.value.estado
        }`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<PosicionListado[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstPosition.value = data.data;
          } else {
            lstPosition.value = [];
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

  async function verPosition(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_posicion?id_branch=${sessionBranchId()}&id=${model.value.id}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<FormPosicion[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            setModel(data.data);
          } else {
            setModel([]);
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

  async function cargarUsuarioNoAsignadoPosicion(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `cargar_usuario_no_asignado_posicion?id_branch=${sessionBranchId()}&id=${model.value.id}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<UsuarioNoAsignado[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstUsuarioNoAsignado.value = data.data;
          } else {
            lstUsuarioNoAsignado.value = [];
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

  async function setPosition(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `insertar_actualizar_posicion`,
      headers: { "Content-Type": "application/json" },
      data: {
        id: model.value.id,
        user_position: model.value.user_position,
      },
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

  async function ActualizarEstadoPosition(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `cambiar_estado_posicion`,
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
    lstPosition,
    lstUsuarioNoAsignado,
    filtros,
    model,
    cargarPosition,
    GetListPosition,
    verPosition,
    cargarUsuarioNoAsignadoPosicion,
    setPosition,
    ActualizarEstadoPosition,
  };
});
