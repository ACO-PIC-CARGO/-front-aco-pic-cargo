import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
const state = {
  tipo: "filter",
  drawer: false,
  lstAirline: [],

  AirlineFilter: {
    code_iata: "",
    name: "",
    code_icao: "",
    code_three: "",
    id_pais: "",
    created_at: "",
    updated_at: "",
    code: "",
    status: true,
    id_branch: JSON.parse(sessionStorage.getItem("dataUser"))
      ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
      : "",
  },
  AirlineModel: {
    code_iata: "",
    name: "",
    code_icao: "",
    code_three: "",
    id_pais: "",
    created_at: "",
    updated_at: "",
    code: "",
    status: "",
    id_branch: JSON.parse(sessionStorage.getItem("dataUser"))
      ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
      : "",
  },
};
const mutations = {
  SET_LIST_AIRLINE(state, data) {
    state.lstAirline = data;
  },
};
const actions = {
  async GetListAirline({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_airlines?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&code=${
          state.AirlineFilter.code ? state.AirlineFilter.code : ""
        }&code_iata=${
          state.AirlineFilter.code_iata ? state.AirlineFilter.code_iata : ""
        }&code_icao=${
          state.AirlineFilter.code_icao ? state.AirlineFilter.code_icao : ""
        }&name=${
          state.AirlineFilter.name ? state.AirlineFilter.name : ""
        }&status=${
          state.AirlineFilter.status ? state.AirlineFilter.status : ""
        }&id_pais=${
          state.AirlineFilter.id_pais ? state.AirlineFilter.id_pais : ""
        }
        `,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          if (data.estadoflag == true) {
            commit("SET_LIST_AIRLINE", data.data);
          } else {
            commit("SET_LIST_AIRLINE", []);
            Swal.fire({
              icon: data.status == "401" ? "error" : "info",
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
          console.error(error);
        });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
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
      throw error;
    }
  },
  async ValidateCodigoIATANuevo() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_iata_airlines_nuevo?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&code_iata=${state.AirlineModel.code_iata}
        `,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
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
      throw error;
    }
  },
  async ValidateCodigoICAONuevo() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_icao_airlines_nuevo?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&code_icao=${state.AirlineModel.code_icao}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
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
      throw error;
    }
  },

  async setAirline({ commit }) {
    state.AirlineModel.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser")
    )[0].id_branch;
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insert_airlines`,
      data: state.AirlineModel,
      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
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
      throw error;
    }
  },
  async ValidateCodigoIATAEditar() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_iata_airlines_editar?id=${state.AirlineModel.id}&id_branch=${state.AirlineModel.id_branch}&code_iata=${state.AirlineModel.code_iata}
        `,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
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
      throw error;
    }
  },
  async ValidateCodigoICAOEditar() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_icao_airlines_editar?id=${state.AirlineModel.id}&id_branch=${state.AirlineModel.id_branch}&code_icao=${state.AirlineModel.code_icao}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
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
      throw error;
    }
  },

  async actualizarAirline({ commit }) {
    state.AirlineModel.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser")
    )[0].id_branch;
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_airlines`,
      data: state.AirlineModel,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      await axios(config)
        .then(function (response) {
          let data = response.data;
          sessionStorage.setItem("auth-token", data.token);
          Swal.fire({
            icon: !!data.estadoflag ? "success" : "error",
            text: data.mensaje,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: res.statusText,
        text: res.data.mensaje,
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
      throw error;
    }
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
