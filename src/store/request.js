import axios from "@/api/axios-config";
import Swal from "sweetalert2";

const CONNECTION_ERROR_MESSAGE =
  "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";

export const request = async (config) => {
  try {
    const { data } = await axios(config);
    return data;
  } catch (error) {
    const body = error.response && error.response.data;
    return {
      estadoflag: false,
      mensaje: (body && body.mensaje) || CONNECTION_ERROR_MESSAGE,
      tipomensaje: "TMSGERR",
      data: [],
    };
  }
};

export const hasFailed = (response) =>
  !response.estadoflag && response.tipomensaje !== "TMSGINF";

export const notifySuccess = (message) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: message,
    showConfirmButton: false,
    timer: 3000,
  });
