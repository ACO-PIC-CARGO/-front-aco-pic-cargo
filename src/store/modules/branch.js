import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import router from "@/router";
let state = {
  lstBranch: [],
};
let mutations = {
  SET_LST_BRANCH(state, data) {
    state.lstBranch = data;
  },
};
let actions = {
  async ListadoSucursal({ commit }) {
    var config = {
      method: "get",
      url: `${process.env.VUE_APP_URL_MAIN}listar_sucursal`,

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
            commit("SET_LST_BRANCH", data.data);
          } else {
            commit("SET_LIST_CITY", []);
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
  async inactivarSucursal({ commit }, id) {
    var config = {
      method: "put",
      url: `${process.env.VUE_APP_URL_MAIN}inactivar_sucursal`,
      data: {
        id: id,
      },
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
