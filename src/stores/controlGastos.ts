import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import type { SweetAlertIcon } from "sweetalert2";
import type { AxiosRequestConfig } from "axios";
import moment from "moment";
import axios from "@/api/http";
import { useSecuritysStore } from "@/stores/securitys";
import type { ApiResponse } from "@/types/api";
import type { ResultadoCargaMasivaGastos } from "@/types/cargaMasiva";
import type {
  ControlGastoHouse,
  ControlGastoMaster,
  CorrelativoControlGasto,
  ListadoControlGastoHouses,
  RespuestaControlGasto,
} from "@/types/finanzas";
import { hasFailed, request } from "@/utils/request";

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const ALERT_ICONS: Record<string, SweetAlertIcon> = { TMSGINF: "info", TMSGADV: "warning" };

const alertIcon = (response: ApiResponse) => ALERT_ICONS[response.tipomensaje] ?? "error";

const warnIfFailed = (response: ApiResponse) => {
  if (hasFailed(response)) Swal.fire({ icon: alertIcon(response), text: response.mensaje });
};

const save = async (config: AxiosRequestConfig): Promise<boolean> => {
  const response = await request(config);
  Swal.fire({ icon: response.estadoflag ? "success" : alertIcon(response), text: response.mensaje });
  return response.estadoflag;
};

const expenseControlRows = async (path: string, id: number | string): Promise<ControlGastoHouse[]> => {
  const response = await request<ListadoControlGastoHouses>({ method: "get", url: `${URL_MAIN}${path}?id=${id}` });
  warnIfFailed(response);
  return response.data[0]?.lsthouses ?? [];
};

export const useControlGastosStore = defineStore("controlGastos", () => {
  const listControlGastos = ref<ControlGastoMaster[]>([]);
  const master_houses = ref<ControlGastoHouse[]>([]);
  const master_egresos = ref<ControlGastoHouse[]>([]);
  const listCorrelativo = ref<CorrelativoControlGasto[]>([]);
  const response = ref<ResultadoCargaMasivaGastos[]>([]);
  const nombreCampania = ref("");
  const listHouses = ref<ControlGastoHouse[]>([]);

  function setResponse(data: ResultadoCargaMasivaGastos[]): void {
    response.value = data;
    useSecuritysStore().response = data as never;
  }

  async function getListControlGastos(id: number | string): Promise<void> {
    const response = await request<ControlGastoMaster>({ method: "get", url: `${URL_MAIN}control_gastos_list?id=${id}` });
    warnIfFailed(response);
    listControlGastos.value = response.estadoflag ? response.data : [];
  }

  async function getListControlGastosHouses(id: number | string): Promise<void> {
    master_houses.value = await expenseControlRows("control_gastos_listhouses", id);
  }

  async function getListControlGastosMaster(id: number | string): Promise<void> {
    master_egresos.value = await expenseControlRows("control_gastos_listmaster", id);
  }

  async function cargarCorrelativo(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_correlativo`,
      headers: headers,
    };

    await axios<RespuestaControlGasto<CorrelativoControlGasto[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.statusBol == true) {
        listCorrelativo.value = response.data.data;
      } else {
        listCorrelativo.value = [];
      }
    });
  }
  async function listarCGECcorralativo(id_proveedor: number | string): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listar_cge_corralativo?id_proveedor=${id_proveedor}`,
      headers: headers,
    };

    await axios<RespuestaControlGasto<CorrelativoControlGasto[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.statusBol == true) {
        let i = 0;
        const data = response.data.data;
        data.forEach((element) => {
          element.index = i;
          i++;
        });
        listCorrelativo.value = data;
      } else {
        listCorrelativo.value = [];
      }
    });
  }
  async function setControl(house: { id_house?: number | string; [campo: string]: unknown }): Promise<boolean> {
    return save({ method: "post", url: URL_MAIN + "setControl", data: { id_house: house.id_house, status: 1 } });
  }

  async function guardarIngresos(data: { id_master: number | string; [campo: string]: unknown }): Promise<boolean> {
    const saved = await save({ method: "post", url: URL_MAIN + "setIngresos", data });
    if (saved) await getListControlGastosHouses(data.id_master);
    return saved;
  }

  async function actualizarIngresos(data: Record<string, unknown>): Promise<boolean> {
    return save({ method: "post", url: URL_MAIN + "editIngreso", data });
  }

  async function copiarCGingresos(data: Record<string, unknown>): Promise<boolean> {
    return save({ method: "put", url: URL_MAIN + "copiar_cgingresos", data });
  }

  async function copiarCGEgresos(data: Record<string, unknown>): Promise<boolean> {
    return save({ method: "put", url: URL_MAIN + "copiar_cgegresos", data });
  }

  async function getNombreCompania(id_master: number | string | null): Promise<string> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "obtener_nombre_camapania?id_master=" + id_master,
      headers: {
        "Content-Type": "application/json",
      },
    };

    await axios<ApiResponse<{ name: string }[]>>(config)
      .then(function (response) {
        const res = response.data;
        sessionStorage.setItem("auth-token", res.token!);
        if (res.estadoflag == true) {
          nombreCampania.value = res.data[0]!.name;
        } else {
          nombreCampania.value = "";
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return nombreCampania.value;
  }
  async function eliminarIngreso(data: { id: number | string; [campo: string]: unknown }): Promise<boolean> {
    const response = await request({ method: "post", url: URL_MAIN + "delIngresos/" + data.id });
    warnIfFailed(response);
    return response.estadoflag;
  }

  async function CargaMasivaControlDeGastos(data: unknown): Promise<ResultadoCargaMasivaGastos[]> {
    response.value = [];
    const answer = await request<ResultadoCargaMasivaGastos>({ method: "post", url: URL_MAIN + "carga_masiva_controldegasto", data });
    warnIfFailed(answer);
    setResponse(answer.data);
    return response.value;
  }
  async function DescargarConsolidadoCargaMasiva(id_mastercontrol: number | string): Promise<void> {
    response.value = [];

    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "consolidado_carga_masiva?id_mastercontrol=" + id_mastercontrol,
      responseType: "blob" as const,
      headers: {
        "Content-Type": "blob",
      },
    };

    await axios<BlobPart>(config)
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        // let name = this.uuidv4();
        link.setAttribute("download", `Consolidación Carga Masiva ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`);
        document.body.appendChild(link);
        link.click();
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function guardarCuotasCgeTipoProveedor(data: Record<string, unknown>): Promise<ResultadoCargaMasivaGastos[]> {
    response.value = [];
    await save({ method: "post", url: URL_MAIN + "guardar_cuotas_cge_tipo_proveedor", data });
    return response.value;
  }

  async function imprimirGuardarControlDetallado(data: Record<string, unknown>): Promise<void> {
    // vm._calcularTotales();
    console.log("imprimirGuardarControlDetallado", data);
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPdfInstructivoDetallado",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config).catch(function (error) {
      console.error(error);
    });
  }

  return {
    listControlGastos,
    master_houses,
    master_egresos,
    listCorrelativo,
    response,
    nombreCampania,
    listHouses,
    getListControlGastos,
    getListControlGastosHouses,
    getListControlGastosMaster,
    cargarCorrelativo,
    listarCGECcorralativo,
    setControl,
    guardarIngresos,
    actualizarIngresos,
    copiarCGingresos,
    copiarCGEgresos,
    getNombreCompania,
    eliminarIngreso,
    CargaMasivaControlDeGastos,
    DescargarConsolidadoCargaMasiva,
    guardarCuotasCgeTipoProveedor,
    imprimirGuardarControlDetallado,
  };
});
