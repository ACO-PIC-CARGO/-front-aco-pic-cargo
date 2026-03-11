import axios from "axios";

const state = {
  payPath: null,
  datosPath: null,
};
const mutations = {
  SET_ID_PATH(state, data) {
    state.payPath = data;
  },
  SET_DATOS_PATH(state, data) {
    state.datosPath = data;
  },
};
const actions = {
  async _uploadFile({ commit }, file) {
    var FormData = require("form-data");
    var fs = require("fs");
    var data = new FormData();
    data.append("name", "Prueba");
    data.append("file", file);
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "uploadAllPath",
      headers: {
        "auth-token": sessionStorage.getItem("auth-token"),
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios(config)
      .then(function (response) {
        commit("SET_ID_PATH", response.data.data[0].insertid);
        commit("SET_DATOS_PATH", response.data.data[0]);
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  async uploadFileFromUrlToOneDrive({ commit }, data) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "mover_files_servidor_onedrive",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("auth-token"),
      },
      data: data,
    };

    await axios(config).then((response) => {});
  },
};
export default {
  namespace: true,
  state,
  mutations,
  actions,
};
