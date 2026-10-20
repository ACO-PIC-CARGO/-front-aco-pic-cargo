// validToken
import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import store from "@/store";
import type { ApiResponse } from "@/types/api";
import type { ItemMenu, SucursalSesion, UsuarioLogin } from "@/types/sesion";

const readDataUser = (): UsuarioLogin[] => JSON.parse(sessionStorage.getItem("dataUser") as string);

export const useSecuritysStore = defineStore("securitys", () => {
  const response = ref({ estadoflag: true });
  const errorClave = ref("");
  const frmLogin = ref({ user: "", password: "", id_sucursal: "" as number | string });
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
    await axios<ApiResponse<UsuarioLogin[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "singin",
      headers: { "Content-Type": "application/json" },
      data: frmLogin.value,
    }).then(async (res_) => {
      const res = res_.data;
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
          // Awaiting the timer id only yields one tick, as the Vuex action did.
          await setTimeout(async () => {
            await _getMenuItem();
            await ObtenerDatosConfig();
            store.state.lstMenu = JSON.parse(sessionStorage.getItem("menu") as string);
          }, 1000);
          // await this.ListProgrammedPayment();

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

  async function ReEstablecerContrasenia() {
    // response.data.data[0].id
    // let id_usuario = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user;
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "recuperar_clave",
      headers: { "Content-Type": "application/json" },
      data: { email: frmLogin.value.user },
    })
      .then(function (response) {
        const res = response.data;

        Swal.fire({
          icon: res.estadoflag ? "success" : "error",
          html: res.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
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
  //     url: import.meta.env.VITE_URL_MAIN + "ListProgrammedPayment",

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
    store.state.dataMenu = false;
    const dataUser = readDataUser();
    const data = JSON.stringify({
      id_entitie: dataUser[0]!.id_user,
      id_branch: readDataUser()[0]!.id_branch,
    });

    await axios<ApiResponse<ItemMenu[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getMenuModules",
      headers: { "Content-Type": "application/json" },
      data: data,
    })
      .then(function (response) {
        sessionStorage.setItem("menu", JSON.stringify(response.data.data));
        localStorage.setItem("menu", JSON.stringify(response.data.data));
        store.commit("_setItemsMenu", response.data.data);
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
    ReEstablecerContrasenia,
    _getMenuItem,
    validarUsuarioAdmin,
    dataMenu,
  };
});
