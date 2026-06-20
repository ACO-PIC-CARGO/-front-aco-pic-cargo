import axios from "@/api/axios-config";
import Swal from "sweetalert2";
import router from "@/router";

const state = {
  listHouse: [],
  house: {},
  lstFacturasFiscales: [],
};
const mutations = {
  SET_LIST_HOUSE(state, data) {
    state.listHouse = data;
  },
  SET_VER_HOUSE(state, data) {
    state.house = data;
  },
  SET_LIST_FACTURA_FISCALES(state, data) {
    state.lstFacturasFiscales = data;
  },
};
// getCargarHouse
const actions = {
  async verHouse({ commit }, filtros) {
    filtros.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;
    await axios
      .get(process.env.VUE_APP_URL_MAIN + `house_ver`, {
        params: filtros,

        "Content-Type": "application/json",
      })
      .then(function (response) {
        let data = response.data;
        commit("SET_VER_HOUSE", data.data ? data.data[0] : {});
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async setConfirmarTelex({ commit }, data) {
    await axios
      .put(process.env.VUE_APP_URL_MAIN + `houses_confirmar_telex`, data, {
        "Content-Type": "application/json",
      })
      .then(function (response) {
        let data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async guardarCarpetaHouse({ commit }, data) {
    var headers = {
      "Content-Type": "application/json",
    };

    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `crear-carpeta-house`,
      headers: headers,
      data: data,
    };

    axios(config).then((response) => {
      let res = response.data;
      console.log("Respuesta de guardarCarpetaHouse:", res);
    });
  },
  async listarHouse({ commit }, filtros) {
    filtros.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser"),
    )[0].id_branch;
    await axios
      .get(process.env.VUE_APP_URL_MAIN + `listado_houses`, {
        params: filtros,

        "Content-Type": "application/json",
      })
      .then(function (response) {
        let data = response.data;

        commit("SET_LIST_HOUSE", data.data ? data.data : []);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getCargarHouse({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `cargar_house?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let data = response.data;

        commit("SET_LIST_HOUSE", data.data ? data.data : []);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async insertComentarioHouse(__, dataObj = {}) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertComentarioHouse`,
      headers: {
        "Content-Type": "application/json",
      },
      data: dataObj,
    };

    await axios(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token);

        let res = response.data;
        if (res.status == "401") {
          Swal.fire({
            icon: "error",
            text: res.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed && res.status == "401") {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        } else {
          Swal.fire({
            icon: res.estadoflag ? "success" : "error",
            text: res.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async deleteHouse({ commit, state, rootState }, data) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + "setHouseDelete",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config).then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      if (response.data.status == "401") {
        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal) => {
          if (resSwal.isConfirmed && response.data.status == "401") {
            router.push({ name: "Login" });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }
        });
      }

      if (response.data.statusBol) {
        Swal.fire({
          icon: "success",
          title: "REGISTRO ELIMINADO.",
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          if (res.isConfirmed) {
            let ruta = router.currentRoute.name;
            console.log("ruta", ruta);
            if (ruta === "controlHouseEditar") {
              let id_master = rootState.copy_house.id_master;
              router.push({
                name: "controlMasterEditar",
                params: {
                  id: id_master,
                },
              });
            } else if (ruta === "controlMasterEditar") {
              window.location.reload();
            }
          }
        });
      }
    });
  },
  async getFacturasFiscales({ commit }, house = {}) {
    commit("SET_LIST_FACTURA_FISCALES", []);
    var vm = this;

    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `getFacturasFiscales`,
      params: {
        id_house: house.id_house,
        id_correlativo: house.id_correlativo,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };

    await axios(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token);

        if (!!response.data.data[0].estadoflag) {
          commit("SET_LIST_FACTURA_FISCALES", response.data.data);
        } else {
          commit("SET_LIST_FACTURA_FISCALES", []);
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
