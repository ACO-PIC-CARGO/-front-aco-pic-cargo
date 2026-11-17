// validToken
import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import type { ApiResponse } from "@/types/api";
import type { MyPermissions } from "@/types/roles";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import type { ItemMenu, SucursalSesion, UsuarioLogin, UsuarioSesion } from "@/types/sesion";
import { bindSessionBranch, resumeSession } from "@/api/sessionRefresh";
import { chooseSessionBranch } from "@/utils/sesion";

const readDataUser = (): UsuarioLogin[] => JSON.parse(sessionStorage.getItem("dataUser") as string);

export const RECOVERY_NEEDS_EMAIL =
  "Escribe el correo de tu cuenta en «Usuario o Email» y vuelve a pulsar «Olvidé contraseña».";

export const useSecuritysStore = defineStore("securitys", () => {
  const response = ref({ estadoflag: true });
  const errorClave = ref("");
  // recordarme: el backend crea una sesión persistente (cookie de refresco de 30 días).
  const frmLogin = ref({ user: "", password: "", id_sucursal: "" as number | string, recordarme: true });
  const MostrarLogin = ref(true);
  const MostrarSucursal = ref(false);
  const lstSucursal = ref<SucursalSesion[]>([]);

  async function ValidarToken(): Promise<ApiResponse | null> {
    let val: ApiResponse | null = null;

    // let menu = JSON.parse(sessionStorage.getItem("menu"));
    // let dataBranch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "validToken",
      headers: { "Content-Type": "application/json" },
    }).then(async (response) => {
      val = response.data;
      // val = res;

      // }
      // commit("SET_RESPONSE", res);
    });
    return val;
  }

  async function ObtenerDatosConfig(): Promise<ApiResponse<unknown[]> | null> {
    let val: ApiResponse<unknown[]> | null = null;

    // let menu = JSON.parse(sessionStorage.getItem("menu"));
    // let dataBranch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];
    await axios<ApiResponse<unknown[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "obtener_existe_datos_config",
      params: { id_branch: readDataUser()[0]!.id_branch },
      headers: { "Content-Type": "application/json" },
    }).then(async (response) => {
      val = response.data;
      sessionStorage.setItem("ConfigEmpresa", JSON.stringify(response.data.data[0]));
      localStorage.setItem("ConfigEmpresa", JSON.stringify(response.data.data[0]));
    });
    return val;
  }

  async function singin(): Promise<{ estadoflag: boolean }> {
    errorClave.value = "";
    const loginRequest = (persistente: boolean) => {
      const { recordarme, ...credenciales } = frmLogin.value;
      return request<UsuarioLogin>({
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "singin",
        headers: { "Content-Type": "application/json" },
        // Necesario para que el navegador guarde la cookie HttpOnly de refresco.
        withCredentials: persistente,
        data: persistente ? { ...credenciales, recordarme } : credenciales,
      });
    };
    let login = await loginRequest(true);
    // Si el servidor no acepta credenciales para este origen (CORS), el navegador bloquea la respuesta:
    // se reintenta como login clásico (token de 8 h, sin cookie) para no dejar al usuario fuera.
    if (!login.estadoflag && login.mensaje === CONNECTION_ERROR_MESSAGE) login = await loginRequest(false);
    await Promise.resolve(login).then(async (res) => {
      response.value.estadoflag = res.estadoflag;

      if (res.estadoflag) {
        sessionStorage.setItem("security", String(res.data[0]!.id_secutiry));
        localStorage.setItem("security", String(res.data[0]!.id_secutiry));
        sessionStorage.setItem("auth-token", res.token!);
        localStorage.setItem("auth-token", res.token!);
        const dataUSer = res.data;

        dataUSer[0]!.id_user = res.data[0]!.id;
        dataUSer[0]!.id = res.data[0]!.id_entitie;

        sessionStorage.setItem("dataUser", JSON.stringify(dataUSer));
        localStorage.setItem("dataUser", JSON.stringify(dataUSer));
        await CargarBranch();
        if (lstSucursal.value.length == 1) {
          const dataBranch = lstSucursal.value;
          sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
          localStorage.setItem("dataBranch", JSON.stringify(dataBranch));

          // --------------------------------------------
          const datos = readDataUser();
          datos[0]!.id_branch = dataBranch[0]!.id;
          sessionStorage.setItem("dataUser", JSON.stringify(datos));
          localStorage.setItem("dataUser", JSON.stringify(datos));
          sessionStorage.setItem("iso_pais", dataBranch[0]!.iso_pais);
          localStorage.setItem("iso_pais", dataBranch[0]!.iso_pais);
          sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
          localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
          await bindSessionBranch(dataBranch[0]!.id);
          await _getMenuItem();
          await ObtenerDatosConfig();
          useAppStore().lstMenu = JSON.parse(sessionStorage.getItem("menu") as string);

          if (dataBranch[0]!.esnuevoflag) {
            router.push({ name: "ConfiguracionInicial" });
          } else {
            router.push({ name: "Main" });
          }
        } else {
          MostrarLogin.value = false;
          MostrarSucursal.value = true;
        }
      } else {
        errorClave.value = res.mensaje;
      }
    });
    return response.value;
  }

  async function CargarBranch() {
    // response.data.data[0].id
    const id_usuario = readDataUser()[0]!.id_user;
    await axios<ApiResponse<SucursalSesion[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "CargarBranch/" + id_usuario,

      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const res = response.data;

        lstSucursal.value = res.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  // Sesión recordada: entra directo a la sucursal ligada a la sesión, sin pedir la clave.
  async function retomarSesion(): Promise<boolean> {
    const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[] | null;
    if (!users?.[0]?.id_user) return false;
    const sesion = await resumeSession();
    if (!sesion) return false;

    const storedBranch = JSON.parse(sessionStorage.getItem("dataBranch") as string) as SucursalSesion[] | null;
    const idBranch = sesion.idBranch ?? users[0].id_branch;
    if (!idBranch) return false;

    if (idBranch !== users[0].id_branch || storedBranch?.[0]?.id !== idBranch || !sessionStorage.getItem("menu")) {
      await CargarBranch();
      const branch = lstSucursal.value.find((v) => v.id == idBranch);
      if (!branch) return false;
      chooseSessionBranch(branch);
      await _getMenuItem();
      await ObtenerDatosConfig();
    } else if (!sesion.idBranch) {
      // Sesión creada antes de existir la sucursal en la sesión: se liga a la guardada.
      await bindSessionBranch(idBranch);
    }

    const [branch] = JSON.parse(sessionStorage.getItem("dataBranch") as string) as SucursalSesion[];
    if (branch?.esnuevoflag) return false;
    useAppStore().lstMenu = JSON.parse(sessionStorage.getItem("menu") as string);
    return true;
  }

  async function ReEstablecerContrasenia() {
    if (!frmLogin.value.user.trim()) {
      errorClave.value = RECOVERY_NEEDS_EMAIL;
      return;
    }
    const res = await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "recuperar_clave",
      headers: { "Content-Type": "application/json" },
      data: { email: frmLogin.value.user },
    });
    Swal.fire({
      icon: res.estadoflag ? "success" : "error",
      html: res.mensaje,
    });
  }

  // async ListProgrammedPayment() {
  //   this.errorBranch = "";
  //   let datos = JSON.parse(sessionStorage.getItem("dataUser"));
  //   let dataBranch = state.lstSucursal.filter(
  //     (v) => v.id == state.frmLogin.id_sucursal
  //   );
  //   datos[0].id_branch = state.frmLogin.id_sucursal;
  //   // sessionStorage.setItem("dataUser", JSON.stringify(datos));
  //   // sessionStorage.setItem("iso_pais", dataBranch[0].iso_pais);
  //   // sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
  //   var config = {
  //     method: "get",
  //     url: import.meta.env.VUE_APP_URL_MAIN + "ListProgrammedPayment",

  //     headers: {
  //      
  //       "Content-Type": "application/json",
  //     },
  //   };
  //   await axios(config)
  //     .then(function (response) {
  //       var res = response.data.data;
  //       router.push({
  //         name: "Main",
  //       });
  //       if (res.filter((v) => v.totalpendiente == 1).length > 0) {
  //         Swal.fire({
  //           icon: "warning",
  //           title: "ADVERTENCIA",
  //           text: "Existen pagos pendientes por realizar.",
  //           allowEscapeKey: false,
  //           allowEnterKey: false,
  //           allowOutsideClick: false,
  //         }).then((res) => {
  //           // if (res.isConfirmed) {
  //           //   window.location.reload();
  //           // }
  //         });
  //       }
  //     })
  //     .catch(function (error) {
  //       console.error(error);
  //     });
  // },
  async function _getMenuItem() {
    dataMenu.value = false;

    await axios<ApiResponse<ItemMenu[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "menu_session",
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        sessionStorage.setItem("menu", JSON.stringify(response.data.data));
        localStorage.setItem("menu", JSON.stringify(response.data.data));
        useAppStore()._setItemsMenu(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
    await loadMyPermissions();
  }

  async function loadMyPermissions() {
    for (const storage of [sessionStorage, localStorage]) storage.removeItem("permissions");
    await axios<ApiResponse<MyPermissions>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "my_permissions",
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        for (const storage of [sessionStorage, localStorage]) {
          storage.setItem("permissions", JSON.stringify(response.data.data));
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function validarUsuarioAdmin(data: unknown): Promise<ApiResponse | null> {
    let respuesta: ApiResponse | null = null;
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "validar_usuario_admin",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then(function (response) {
        respuesta = response.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return respuesta;
  }

  const dataMenu = ref(false);

  return {
    response,
    errorClave,
    frmLogin,
    MostrarLogin,
    MostrarSucursal,
    lstSucursal,
    ValidarToken,
    ObtenerDatosConfig,
    singin,
    CargarBranch,
    retomarSesion,
    ReEstablecerContrasenia,
    _getMenuItem,
    validarUsuarioAdmin,
    dataMenu,
  };
});
