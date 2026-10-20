import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import moment from "moment";
import axios from "@/api/http";
import router from "@/router";
import { useSecuritysStore } from "@/stores/securitys";
import type { ApiResponse } from "@/types/api";
import type { ResultadoCargaMasivaGastos } from "@/types/cargaMasiva";
import type {
  ControlGastoHouse,
  ControlGastoMaster,
  CorrelativoControlGasto,
  FilaMensaje,
  ListadoControlGastoHouses,
  RespuestaControlGasto,
} from "@/types/finanzas";
import { sessionUser } from "@/utils/sesion";

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
  function setListControlGastosHouse(data: ListadoControlGastoHouses | never[]): void {
    master_houses.value = (data as ListadoControlGastoHouses).lsthouses;
  }
  function setListControlGastosMaster(data: ListadoControlGastoHouses | never[]): void {
    master_egresos.value = (data as ListadoControlGastoHouses).lsthouses;
  }

  async function getListControlGastos(id: number | string): Promise<void> {
    const routeParams = router.currentRoute.value.params;
    // console.log(routeParams);
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `control_gastos_list?id=${id}&id_branch=${routeParams.id_branch}`,
      headers: headers,
    };

    await axios<RespuestaControlGasto<ControlGastoMaster[]>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.statusBol == true) {
        listControlGastos.value = response.data.data;
      } else {
        listControlGastos.value = [];
        Swal.fire({
          icon: "error",
          title: data.statusText,
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
    });
  }
  async function getListControlGastosHouses(id: number | string): Promise<void> {
    const routeParams = router.currentRoute.value.params;
    // console.log(routeParams);
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `control_gastos_listhouses?id=${id}&id_branch=${routeParams.id_branch}`,
      headers: headers,
    };

    await axios<RespuestaControlGasto<ListadoControlGastoHouses>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.statusBol == true) {
        setListControlGastosHouse(response.data.data);
      } else {
        setListControlGastosHouse([]);
        Swal.fire({
          icon: "error",
          title: data.statusText,
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
    });
  }
  async function getListControlGastosMaster(id: number | string): Promise<void> {
    const routeParams = router.currentRoute.value.params;
    // console.log(routeParams);
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `control_gastos_listmaster?id=${id}&id_branch=${routeParams.id_branch}`,
      headers: headers,
    };

    await axios<RespuestaControlGasto<ListadoControlGastoHouses>>(config).then((response) => {
      const data = response.data;
      sessionStorage.setItem("auth-token", data.token!);
      if (data.statusBol == true) {
        setListControlGastosMaster(response.data.data);
      } else {
        setListControlGastosMaster([]);
        Swal.fire({
          icon: "error",
          title: data.statusText,
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
    });
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
  async function setControl(house: { id_master: number | string; [campo: string]: unknown }): Promise<void> {
    console.log("house", house);
    const data = {
      id_house: house.id_master,
      id_user: sessionUser().id,
      status: 1,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setControl",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<RespuestaControlGasto<FilaMensaje[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        if (data.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: data.data[0]!.mensaje,
          });
          // dispatch("getListControlGastos", house.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: (data.data as unknown as FilaMensaje).mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function guardarIngresos(data: { id_master: number | string; [campo: string]: unknown }): Promise<void> {
    console.log("data", data);
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setIngresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<RespuestaControlGasto<FilaMensaje[]>>(config)
      .then(function (response) {
        const res = response.data;
        sessionStorage.setItem("auth-token", res.token!);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0]!.mensaje,
          });
          getListControlGastosHouses(data.id_master);
        } else {
          Swal.fire({
            icon: "error",
            text: (res.data as unknown as FilaMensaje).mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function actualizarIngresos(data: { code_master: number | string; [campo: string]: unknown }): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "editIngreso",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<RespuestaControlGasto<FilaMensaje[]>>(config)
      .then(function (response) {
        const res = response.data;
        sessionStorage.setItem("auth-token", res.token!);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0]!.mensaje,
          });
          getListControlGastosHouses(data.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: (res.data as unknown as FilaMensaje).mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function copiarCGingresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "copiar_cgingresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<RespuestaControlGasto<FilaMensaje[]>>(config)
      .then(function (response) {
        const res = response.data;
        sessionStorage.setItem("auth-token", res.token!);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0]!.mensaje,
          });
          // dispatch("getListControlGastosHouses", data.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: (res.data as unknown as FilaMensaje).mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function copiarCGEgresos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "copiar_cgegresos",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<RespuestaControlGasto<FilaMensaje[]>>(config)
      .then(function (response) {
        const res = response.data;
        sessionStorage.setItem("auth-token", res.token!);
        if (res.statusBol == true) {
          Swal.fire({
            icon: "info",
            text: res.data[0]!.mensaje,
          });
          // dispatch("getListControlGastosMaster", data.code_master);
        } else {
          Swal.fire({
            icon: "error",
            text: (res.data as unknown as FilaMensaje).mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
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
  async function eliminarIngreso(data: { id: number | string; [campo: string]: unknown }): Promise<void> {
    console.log("data3", data);
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "delIngresos/" + data.id,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<RespuestaControlGasto<FilaMensaje>>(config)
      .then(function (response) {
        const res = response.data;
        sessionStorage.setItem("auth-token", res.token!);
        if (!res.statusBol == true) {
          Swal.fire({
            icon: "error",
            text: res.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function CargaMasivaControlDeGastos(data: unknown): Promise<ResultadoCargaMasivaGastos[]> {
    response.value = [];
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "carga_masiva_controldegasto",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse<ResultadoCargaMasivaGastos[]>>(config)
      .then(function (res) {
        const body = res.data;
        sessionStorage.setItem("auth-token", body.token!);
        setResponse(body.data);
      })
      .catch(function (error) {
        console.error(error);
      });
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
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "guardar_cuotas_cge_tipo_proveedor",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse<FilaMensaje[]>>(config)
      .then(function (response) {
        const res = response.data;
        sessionStorage.setItem("auth-token", res.token!);
        if (res.estadoflag) {
          Swal.fire({
            icon: "success",
            text: res.data[0]!.mensaje,
          });
        } else {
          Swal.fire({
            icon: "error",
            text: res.data[0]!.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
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
