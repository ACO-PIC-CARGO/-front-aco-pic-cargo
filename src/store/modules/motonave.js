import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";

let state = {
  tipo: "filter",
  drawer: false,
  lstMotonave: [],
  MotonaveFilter: {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  },
  MotonaveModel: {
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  },
};
let mutations = {
  SET_LIST_MOTONAVE(state, data) {
    state.lstMotonave = data;
  },
};
let actions = {
  async GetListMotonave({ commit }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN +
        `listar_motonave?&id_branch=${
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        }&name=${state.MotonaveFilter.name}&description=${
          state.MotonaveFilter.description
        }&status=${
          state.MotonaveFilter.status == "null"
            ? ""
            : state.MotonaveFilter.status
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
            commit("SET_LIST_MOTONAVE", data.data);
          } else {
            commit("SET_LIST_MOTONAVE", []);
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
  async setMotonave({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insertar_motonave`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.MotonaveModel,
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
  async ActualizarMotonave({ commit }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_motonave`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: state.MotonaveModel,
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
