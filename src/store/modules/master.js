import axios from '@/api/axios-config';;
import Swal from "sweetalert2";
const state = {};
const mutations = {};
const actions = {
  async createCarpetaOneDrive(__, { name = "" }) {
    var config = {
      method: "get",
      url:
        process.env.VUE_APP_URL_MAIN + `crear-carpeta-master?nromaster=${name}`,
      headers: {
       
        "Content-Type": "application/json",
      },
    };
    let res = await axios(config)
      .then(async function (response) {
        return response.data.data;
      })
      .catch((e) => {
        console.error(e);
        return false;
      });
    return res;
  },
  async actualizarMaster(__, { id = 0, url = "" }) {
    var config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `update_folder_onedrive`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios(config).then(async function (response) {
      return response.data.data;
    });
  },
  async insertComentarioMaster(
    __,
    { id_entitie = 0, id_master = 0, fecha = 0, comentario = 0 },
  ) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + `insert_comentario_master`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: {
        id_entitie: id_entitie,
        id_master: id_master,
        fecha: fecha,
        comentario: comentario,
      },
    };

    await axios(config).then(function (response) {
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
          icon: res.estadoflag == true ? "success" : "error",
          text: res.mensaje,
        });
      }
    });
  },
  async actualizarURLEnElMaster(__, { id = "", url = "" }) {
    console.log("crearCarpetaOneDrive", url);
    let config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `actualizar_folder_onedrive_master`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios(config).then(async (response) => {
      return response.data.data;
    });
  },
  async moverCostos(__, data) {
    let config = {
      method: "put",
      url: process.env.VUE_APP_URL_MAIN + `mover_cgegresos`,
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config).then(async (response) => {
      return response.data.data;
    });
  },
};

export default {
  namespace: true,
  state,
  mutations,
  actions,
};
