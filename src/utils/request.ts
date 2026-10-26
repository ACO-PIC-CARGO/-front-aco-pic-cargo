import type { AxiosRequestConfig } from "axios";
import axios from "@/api/http";
import Swal from "sweetalert2";
import type { SweetAlertResult } from "sweetalert2";
import type { ApiResponse } from "@/types/api";

const CONNECTION_ERROR_MESSAGE =
  "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";

interface FailedRequest {
  response?: { data?: { mensaje?: string } };
}

export const request = async <Row = unknown>(
  config: AxiosRequestConfig,
): Promise<ApiResponse<Row[]>> => {
  try {
    const { data } = await axios<ApiResponse<Row[]>>(config);
    return data;
  } catch (error) {
    const { response } = error as FailedRequest;
    const body = response && response.data;
    return {
      estadoflag: false,
      mensaje: (body && body.mensaje) || CONNECTION_ERROR_MESSAGE,
      tipomensaje: "TMSGERR",
      data: [],
    };
  }
};

export const hasFailed = (response: ApiResponse): boolean =>
  !response.estadoflag && response.tipomensaje !== "TMSGINF";

export const notifySuccess = (message: string): Promise<SweetAlertResult> =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    titleText: message,
    showConfirmButton: false,
    timer: 3000,
  });
