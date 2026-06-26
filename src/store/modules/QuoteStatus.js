import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";
let state = {
  tipo: "filter",
  drawer: false,
  statusQuoteList: [],
  max_position: 0,
  max_position_calls: 0,
  max_position_report: 0,
  max_position_select: 0,
  StatusFilter: {
    id: "",
    name: "",
    code: "",
    position: "",
    position_select: "",
    position_report: "",
    position_calls: "",
    status_calls: "",
    status_calls_all: "",
    description: "",
    status: "1",
    id_branch: JSON.parse(sessionStorage.getItem("dataUser"))
      ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
      : "",
  },
  StatusModel: {
    id: "",
    name: "",
    code: "",
    position: "",
    position_select: "",
    position_report: "",
    position_calls: "",
    status_calls: "",
    status_calls_all: "",
    description: "",
    status: "1",
    id_branch: JSON.parse(sessionStorage.getItem("dataUser"))
      ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
      : "",
  },
};
let mutations = {
  SET_STATUS_QUOTE_LIST(state, data) {
    state.statusQuoteList = data;
  },
  SET_MAX_POSITION_QUOTE_LIST(state, data) {
    state.max_position = data ? data[0].position : 1;
    state.max_position_calls = data ? data[0].position_calls : 1;
    state.max_position_report = data ? data[0].position_report : 1;
    state.max_position_select = data ? data[0].position_select : 1;
  },
};
let actions = {
  async GetListQuoteStatus({ commit, dispatch }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `list_quote_status?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&code=${state.StatusFilter.code ? state.StatusFilter.code : ""}&name=${
          state.StatusFilter.name ? state.StatusFilter.name : ""
        }&description=${
          state.StatusFilter.description ? state.StatusFilter.description : ""
        }&position=${
          state.StatusFilter.position ? state.StatusFilter.position : ""
        }&position_report=${
          state.StatusFilter.position_report
            ? state.StatusFilter.position_report
            : ""
        }&position_select=${
          state.StatusFilter.position_select
            ? state.StatusFilter.position_select
            : ""
        }&position_calls=${
          state.StatusFilter.position_calls
            ? state.StatusFilter.position_calls
            : ""
        }&status_calls=${
          state.StatusFilter.status_calls !== "null"
            ? state.StatusFilter.status_calls
            : ""
        }&status_calls_all=${
          state.StatusFilter.status_calls_all !== "null"
            ? state.StatusFilter.status_calls_all
            : ""
        }&status=${
          state.StatusFilter.status !== "null" ? state.StatusFilter.status : ""
        }`,

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
            commit("SET_STATUS_QUOTE_LIST", data.data);
            dispatch("MaxPositionQuoteStatus");
          } else {
            commit("SET_STATUS_QUOTE_LIST", []);
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
      console.error(error);
    }
  },
  async MaxPositionQuoteStatus({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `max_position_quote_status?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }`,

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
            commit("SET_MAX_POSITION_QUOTE_LIST", data.data);
          } else {
            commit("SET_MAX_POSITION_QUOTE_LIST", []);
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
      console.error(error);
    }
  },
  async getValidatePositionQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&position=${state.StatusModel.position}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async getValidatePositionSelectQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_select_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&position_select=${state.StatusModel.position_select}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async getValidatePositionReportQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_report_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&position_report=${state.StatusModel.position_report}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async getValidatePositionCallsQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_calls_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&position_calls=${state.StatusModel.position_calls}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async setQuoteStatus() {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_position_calls`,

      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.StatusModel,
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
      console.error(error);
    }
  },
  async getValidatePositionActualizarQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_actualizar_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id=${state.StatusModel.id}&position=${state.StatusModel.position}`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async getValidatePositionSelectActualizarQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_select_actualizar_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id=${state.StatusModel.id}&position_select=${
          state.StatusModel.position_select
        }`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async getValidatePositionReportActualizarQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_report_actualizar_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id=${state.StatusModel.id}&position_report=${
          state.StatusModel.position_report
        }`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  async getValidatePositionCallsActualizarQuoteStatus() {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `validate_position_calls_actualizar_status_quote?id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&id=${state.StatusModel.id}&position_calls=${
          state.StatusModel.position_calls
        }`,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    try {
      let res = await axios(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  async actualizarQuoteStatus() {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_position_calls`,

      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.StatusModel,
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
      console.error(error);
    }
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
