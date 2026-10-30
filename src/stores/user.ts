import { defineStore } from "pinia";
import { ref } from "vue";
import type { AxiosError } from "axios";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import type { ApiResponse } from "@/types/api";
import type {
  FiltroUsuario,
  FormUsuario,
  UsuarioDetalle,
  UsuarioExistente,
  UsuarioListado,
  UsuarioPosicion,
  UsuarioSucursal,
} from "@/types/seguridad";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";

export const useUserStore = defineStore("user", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstUsers = ref<UsuarioListado[]>([]);
  const filtros = ref<FiltroUsuario>({
    users: "",
    nombrecompleto: "",
    id_document: "",
    document: "",
    phone: "",
    email: "",
    status: "1",
  });
  const model = ref<FormUsuario>({
    id: "",
    id_entitie: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    users: "",
    id_document: "",
    document: "",
    id_sex: "",
    status: "1",
    departamento: "1",
    names: "",
    surname: "",
    second_surname: "",
    socialprincipal: "",
    socialsecundary: "",
    phone: "",
    address: "",
    birthday: "",
    email: "",
    cambiarClave: false,
    clave: "",
    confirmclave: "",
  });
  const sucursales = ref<UsuarioSucursal[]>([]);
  const positions = ref<UsuarioPosicion[]>([]);

  async function GetListUsers(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_usuarios",
      params: {
        users: filtros.value.users || "",
        nombrecompleto: filtros.value.nombrecompleto || "",
        id_document: filtros.value.id_document || "",
        document: filtros.value.document || "",
        phone: filtros.value.phone || "",
        email: filtros.value.email || "",
        status: filtros.value.status === "null" ? "" : filtros.value.status,
      },
      headers: { "Content-Type": "application/json" },
    };

    await axios<ApiResponse<UsuarioListado[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstUsers.value = data.data;
        } else {
          lstUsers.value = [];
          showRejectedResponse(data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function GetVerUsers(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "ver_usuario",
      params: { id: model.value.id },
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<UsuarioDetalle[]>>(config)
        .then(function (response) {
          const data = response.data;

          if (data.estadoflag == true) {
            model.value = data.data[0]!;
            positions.value = data.data[0]!.positions;
            sucursales.value = data.data[0]!.sucursales;
            sessionStorage.setItem("auth-token", data.token!);
          } else {
            Swal.fire({
              icon: "warning",
              title: "Aviso",
              text: data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      const res = (error as AxiosError<ApiResponse>).response!;
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      }).then((resSwal) => {
        if (resSwal.isConfirmed && res.status == 401) {
          router.push({ name: "Login" });
          setTimeout(() => {
            window.location.reload();
          }, 10);
        }
      });
      throw error;
    }
  }

  async function validateUserUsuario(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `validate_user_usuarios?users=${model.value.users}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function validateEmailUsuario(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validate_email_usuarios",
      params: { email: model.value.email },
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function validateDocumentUsuario(): Promise<ApiResponse<UsuarioExistente[]> | undefined> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validate_document_usuarios",
      params: { id_document: model.value.id_document, document: model.value.document },
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse<UsuarioExistente[]>>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function saveAndShow(method: string, path: string, data: unknown): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: { "Content-Type": "application/json" },
      data,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
    return response.estadoflag;
  }

  async function saveUserAndReturnToList(method: string, path: string): Promise<boolean> {
    const saved = await saveAndShow(method, path, {
      ...model.value,
      positions: positions.value,
      sucursales: sucursales.value,
    });
    if (saved) router.push({ name: "listUser" });
    return saved;
  }

  const setUsers = (): Promise<boolean> => saveUserAndReturnToList("post", "insertar_usuario");

  const ActualizarUsers = (): Promise<boolean> => saveUserAndReturnToList("put", "actualizar_usuario");

  const cambiarEstadoUsers = (id: number, status: number): Promise<boolean> =>
    saveAndShow("put", "cambiar_estado_usuario", { id, status });

  return {
    tipo,
    drawer,
    lstUsers,
    filtros,
    model,
    sucursales,
    positions,
    GetListUsers,
    GetVerUsers,
    validateUserUsuario,
    validateEmailUsuario,
    validateDocumentUsuario,
    setUsers,
    ActualizarUsers,
    cambiarEstadoUsers,
  };
});
