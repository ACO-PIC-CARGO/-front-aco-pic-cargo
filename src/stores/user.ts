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
import { sessionBranchId } from "@/utils/sesion";

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
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_usuarios?&id_branch=${sessionBranchId()}&users=${
          filtros.value.users ? filtros.value.users : ""
        }&nombrecompleto=${filtros.value.nombrecompleto ? filtros.value.nombrecompleto : ""}&id_document=${
          filtros.value.id_document ? filtros.value.id_document : ""
        }&document=${filtros.value.document ? filtros.value.document : ""}&phone=${
          filtros.value.phone ? filtros.value.phone : ""
        }&email=${filtros.value.email ? filtros.value.email : ""}&status=${
          filtros.value.status === "null" ? "" : filtros.value.status
        }`,

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
      url: import.meta.env.VITE_URL_MAIN + `ver_usuario?&id_branch=${sessionBranchId()}&id=${model.value.id}`,

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
      url: import.meta.env.VITE_URL_MAIN + `validate_email_usuarios?email=${model.value.email}`,

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
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_document_usuarios?id_branch=${sessionBranchId()}&id_document=${model.value.id_document}&document=${
          model.value.document
        }`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse<UsuarioExistente[]>>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function setUsers(): Promise<void> {
    const datos = model.value;
    datos.id_branch = sessionBranchId();
    datos.positions = positions.value;
    datos.sucursales = sucursales.value;
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_usuario`,
      headers: { "Content-Type": "application/json" },
      data: datos,
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((res) => {
            if (res.isConfirmed) {
              router.push({ name: "listUser" });
            }
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function ActualizarUsers(): Promise<void> {
    const datos = model.value;
    datos.id_branch = sessionBranchId();
    datos.positions = positions.value;
    datos.sucursales = sucursales.value;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_usuario`,
      headers: { "Content-Type": "application/json" },
      data: datos,
    };
    try {
      await axios<ApiResponse>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            text: data.mensaje,
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((res) => {
            if (res.isConfirmed) {
              router.push({ name: "listUser" });
            }
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function cambiarEstadoUsers(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `cambiar_estado_usuario`,
      headers: { "Content-Type": "application/json" },
      data: model.value,
    };
    try {
      await axios<ApiResponse>(config).then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

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
