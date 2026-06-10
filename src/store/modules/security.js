// validToken
import axios from '@/api/axios-config';;
import router from "@/router";
import Swal from "sweetalert2";
import StatePrincipal from "./../index";
const state = {
  response: {
    estadoflag: true,
  },
  errorClave: "",
  frmLogin: {
    user: "",
    password: "",
    id_sucursal: "",
  },
  MostrarLogin: true,
  MostrarSucursal: false,
  lstSucursal: [],
};
const mutations = {
  SET_RESPONSE(state, data) {
    state.response = data;
  },
  SET_SUCURSAL_X_USUARIO(state, data) {
    state.lstSucursal = data;
  },
};
const actions = {
  async ValidarToken({ commit, dispatch }) {
    let val = null;

    // let menu = JSON.parse(sessionStorage.getItem("menu"));
    // let dataBranch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "validToken",
      headers: headers,
    };

    await axios(config).then(async (response) => {
      val = response.data;
      // val = res;

      // }
      // commit("SET_RESPONSE", res);
    });
    return val;
  },
  async ObtenerDatosConfig({ commit, dispatch }) {
    let val = null;

    // let menu = JSON.parse(sessionStorage.getItem("menu"));
    // let dataBranch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "obtener_existe_datos_config",
      params: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      },
      headers: headers,
    };

    await axios(config).then(async (response) => {
      val = response.data;
      sessionStorage.setItem(
        "ConfigEmpresa",
        JSON.stringify(response.data.data[0])
      );
      localStorage.setItem(
        "ConfigEmpresa",
        JSON.stringify(response.data.data[0])
      );
    });
    return val;
  },
  async singin({ commit, dispatch }) {
    state.errorClave = "";
    var headers = {
     
      "Content-Type": "application/json",
    };
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "singin",
      headers: headers,
      data: state.frmLogin,
    };

    await axios(config).then(async (response) => {
      let res = response.data;
      state.response.estadoflag = res.estadoflag;

      if (!!res.estadoflag) {
        sessionStorage.setItem("security", response.data.data[0].id_secutiry);
        localStorage.setItem("security", response.data.data[0].id_secutiry);
        sessionStorage.setItem("auth-token", response.data.token);
        localStorage.setItem("auth-token", response.data.token);
        let dataUSer = response.data.data;

        dataUSer[0].id_user = response.data.data[0].id;
        dataUSer[0].id = response.data.data[0].id_entitie;

        sessionStorage.setItem("dataUser", JSON.stringify(dataUSer));
        localStorage.setItem("dataUser", JSON.stringify(dataUSer));
        await dispatch("CargarBranch");
        if (state.lstSucursal.length == 1) {
          let dataBranch = state.lstSucursal;
          sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
          localStorage.setItem("dataBranch", JSON.stringify(dataBranch));

          // --------------------------------------------
          let datos = JSON.parse(sessionStorage.getItem("dataUser"));
          datos[0].id_branch = dataBranch[0].id;
          sessionStorage.setItem("dataUser", JSON.stringify(datos));
          localStorage.setItem("dataUser", JSON.stringify(datos));
          sessionStorage.setItem("iso_pais", dataBranch[0].iso_pais);
          localStorage.setItem("iso_pais", dataBranch[0].iso_pais);
          sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
          localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
          await setTimeout(async () => {
            await dispatch("_getMenuItem");
            await dispatch("ObtenerDatosConfig");
            StatePrincipal.state.lstMenu = JSON.parse(
              sessionStorage.getItem("menu")
            );
          }, 1000);
          // await this.ListProgrammedPayment();

          if (dataBranch[0].esnuevoflag) {
            router.push({ name: "ConfiguracionInicial" }, () => {});
          } else {
            router.push({ name: "Main" }, () => {});
          }
        } else {
          state.MostrarLogin = false;
          state.MostrarSucursal = true;
        }
      } else {
        state.errorClave = res.mensaje;
      }
    });
    return state.response;
  },
  async CargarBranch({ commit }) {
    // response.data.data[0].id
    let id_usuario = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "CargarBranch/" + id_usuario,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        var res = response.data;

        commit("SET_SUCURSAL_X_USUARIO", res.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async ReEstablecerContrasenia({ commit }, data) {
    // response.data.data[0].id
    // let id_usuario = JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "recuperar_clave",
      headers: {
       
        "Content-Type": "application/json",
      },
      data: { email: state.frmLogin.user },
    };
    await axios(config)
      .then(function (response) {
        var res = response.data;
        
        Swal.fire({
          icon: res.estadoflag ? "success" : "error",
          html: res.mensaje,
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
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
  //     url: process.env.VUE_APP_URL_MAIN + "ListProgrammedPayment",

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
  //       console.log(error);
  //     });
  // },
  async _getMenuItem({ commit }) {
    this.state.dataMenu = false;
    var dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
    var data = JSON.stringify({
      id_entitie: dataUser[0].id_user,
      id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    });
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "getMenuModules",
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        sessionStorage.setItem("menu", JSON.stringify(response.data.data));
        localStorage.setItem("menu", JSON.stringify(response.data.data));
        commit("_setItemsMenu", response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async validarUsuarioAdmin({ commit }, data) {
    let respuesta = null;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "validar_usuario_admin",
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        respuesta = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return respuesta;
  },
};
export default {
  namespace: true,
  state,
  mutations,
  actions,
};
