import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
const state = {
  listProyeccion: [],
  proyeccion: {},
  proyeccionaprobada: "",
};
const mutations = {
  SET_LIST_PROYECCION(state, data) {
    state.listProyeccion = data;
  },
  SET_PROYECCION(state, data) {
    state.proyeccion = data;
  },
  SET_PROYECCION_APROBADA(state, data) {
    state.proyeccionaprobada = data;
  },
};
const actions = {
  async setProyeccion(_, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_proyeccion`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
        if (!!data.estadoflag) {
          router.go(-1);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getProyeccion({ commit }, data) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `list_proyeccion?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id_month=${data.id_month}&id_year=${data.id_year}&correlativo=${
          data.correlativo
        }&total_proyectado_ext=${data.total_proyectado_ext}&estado=${
          data.estado
        }&aprobadoflag=${data.aprobadoflag}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        if (!!data.estadoflag) {
          commit("SET_LIST_PROYECCION", data.data);
        } else {
          commit("SET_LIST_PROYECCION", []);
          Swal.fire({
            icon: "error",
            text: data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && data.status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async verProyeccion({ commit }, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `ver_proyeccion?id=${id}`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        if (!!data.estadoflag) {
          commit("SET_PROYECCION", data.data[0]);
        } else {
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async updateProyeccion(_, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `update_proyeccion`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
        if (!!data.estadoflag) {
          router.go(-1);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async validateProyeccionAprobacion(_, data) {
    let res = null;
    var config = {
      method: "put",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_proyeccion_aprobacion?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    return res;
  },
  async copiarProyeccion(_, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `copiar_proyeccion`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          html: data.mensaje,
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async aprobarProyeccion(_, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `aprobar_proyeccion`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async eliminarProyeccion(_, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `eliminar_proyeccion`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async primeraProyeccion(_, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `generar_primerar_proyeccion`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        sessionStorage.setItem("auth-token", data.token);
        Swal.fire({
          icon: !!data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
        if (!!data.estadoflag) {
          router.push({
            name: "editarProyeccion",
            params: { id: data.data[0].id },
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async exportarVerProyeccion(__, id) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `excel_proyeccion?id=${id}`,
      responseType: "blob",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Proyeccion-${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getProyeccionAprobada({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `proyeccion_aprobada?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        if (!!data.estadoflag) {
          commit("SET_PROYECCION_APROBADA", data.data[0].proyeccion_mes_anio);
        } else {
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
};
export default {
  namespace: true,
  state,
  mutations,
  actions,
};
