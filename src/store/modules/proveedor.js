import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
import router from "@/router";
const state = {
  lstProveedores: [],
};
const mutations = {
  SET_PROVEEDOR(state, data) {
    state.lstProveedores = data;
  },
};
const actions = {
  async obtenerProveedorPricing({ commit }, data) {
    data.id_branch = JSON.parse(
      sessionStorage.getItem("dataUser")
    )[0].id_branch;
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + `cargar_proveedor_pricing`,

      headers: {
       
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios(config)
      .then((response) => {
        let data = response.data;
        if (!!data.estadoflag) {
          commit("SET_PROVEEDOR", data.data);
        } else {
          commit("SET_PROVEEDOR", []);
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
};
export default {
  namespace: true,
  state,
  mutations,
  actions,
};
