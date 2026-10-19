import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Multiplicador } from "@/types/cotizacion";
import type {
  ClienteCarga,
  CorrelativosConfig,
  CostoConfig,
  DatoEmpresaConfig,
  DatoUsuarioConfig,
  FiltroCostosConfig,
  GuardarCostosConfig,
  ProveedorCarga,
  TipoCostoConfig,
} from "@/types/empresas";
import { sessionBranchId } from "@/utils/sesion";

const hasSession = (): boolean => !!JSON.parse(sessionStorage.getItem("dataUser") as string);

export const useConfigEmpresaStore = defineStore("configEmpresa", () => {
  const config = ref(true);
  const datoEmpresa = ref<DatoEmpresaConfig>({
    id: "",
    id_document: "",
    document: "",
    trade_name: "",
    logo: "",
    id_pais: "",
    id_logo: "",
    address: "",
    tipoimpuesto: "",
    impuesto: 0,
    usarclientes: true,
    usaropadmin: true,
  });
  const dataUsuario = ref<DatoUsuarioConfig>({
    usuario: "",
    birthday: "",
    departamento: "",
    description: "",
    document: "",
    ic: "",
    id: "",
    id_branch: "",
    id_document: "",
    id_pais: "",
    id_sex: "",
    id_user: "",
    names: "",
    nombrecompleto: "",
    path: "",
    second_surname: "",
    surname: "",
    phone: "",
    email: "",
  });
  const lstProveedor = ref<ProveedorCarga[]>([]);
  const lstClientes = ref<ClienteCarga[]>([]);
  const lstCostos = ref<CostoConfig[]>([]);
  const lstMultiplicador = ref<Multiplicador[]>([]);
  const listTipoCostos = ref<TipoCostoConfig[]>([]);
  const configEmpresa = ref<CorrelativosConfig>({
    correlativopricing: null,
    correlativomaster: null,
    correlativocge: null,
  });

  async function actualizarDatoEmpresa(): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_datos_empresa_config`,
      headers: { "Content-Type": "application/json" },
      data: { ...datoEmpresa.value, TipoImp: datoEmpresa.value.tipoimpuesto },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function actualizarDatoAdministrador(): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_datos_administrador_config`,
      headers: { "Content-Type": "application/json" },
      data: dataUsuario.value,
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
          showCancelButton: false,
          confirmButtonText: "Ok",
        });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function actualizarDatoCMProveedor(subConjunto: ProveedorCarga[]): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_datos_cm_proveedor`,
      headers: { "Content-Type": "application/json" },
      data: {
        id_branch: sessionBranchId(),
        lstProveedor: subConjunto,
      },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        // Swal.fire({
        //   icon: !!data.estadoflag ? "success" : "error",
        //   text: data.mensaje,
        //   showCancelButton: false,
        //   confirmButtonText: "Ok",
        // });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function actualizarDatoCMCliente(subConjunto: ClienteCarga[]): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_datos_cm_cliente`,
      headers: { "Content-Type": "application/json" },
      data: {
        id_branch: sessionBranchId(),
        lstClientes: subConjunto,
      },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        // Swal.fire({
        //   icon: !!data.estadoflag ? "success" : "error",
        //   text: data.mensaje,
        //   showCancelButton: false,
        //   confirmButtonText: "Ok",
        // });
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function obtenerConfigCostos(filter: FiltroCostosConfig): Promise<void> {
    await axios<ApiResponse<CostoConfig[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `obtener_config_costos?id_branch=${sessionBranchId()}&id_modality=${filter.id_modality}&shipment=${filter.shipment}`,
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        lstCostos.value = response.data.data;
      })
      .catch((error) => {
        console.log("Error al obtener los datos:", error);
      });
  }

  async function getMultiplicadorConfig(filter: { id_shipment: number | string }): Promise<void> {
    await axios<ApiResponse<Multiplicador[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `cargar_multiplicador_config?id_shipment=${filter.id_shipment}&id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const valores: Multiplicador[] = [];
        response.data.data.forEach((element) => {
          valores.push({
            id: element.id,
            value: element.id,
            code: element.code,
            text: element.name!,
            valor: element.valor ? element.valor : 0,
          });
        });

        lstMultiplicador.value = valores;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getTipoCostosConfig(filter: { id_shipment: number | string; id_modality: number | string }): Promise<void> {
    await axios<ApiResponse<TipoCostoConfig[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `tipo_costo_x_embarque?id_shipment=${filter.id_shipment}&id_modality=${filter.id_modality}`,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          listTipoCostos.value = data.data;
        } else {
          listTipoCostos.value = [];
          Swal.fire({
            icon: "error",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function guardarCostos(costos: GuardarCostosConfig): Promise<ApiResponse> {
    costos.id_branch = sessionBranchId();
    try {
      const response = await axios<ApiResponse>({
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + `guardar_costos_config`,
        headers: { "Content-Type": "application/json" },
        data: costos,
      });
      const resData = response.data;
      return resData;
    } catch (error) {
      console.log("Error al guardar costos de configuración:", error);
      throw error;
    }
  }

  async function OmitirConfiguracionCost(): Promise<false | undefined> {
    if (!hasSession()) {
      return false;
    }
    await axios({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `omitir_config_cost`,
      headers: { "Content-Type": "application/json" },
      data: { id_branch: sessionBranchId() },
    }).catch(function (error) {
      console.error(error);
    });
  }

  async function finalizarConfiguracion(): Promise<false | undefined> {
    if (!hasSession()) {
      return false;
    }
    await axios({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `finalizar_config`,
      headers: { "Content-Type": "application/json" },
      data: { id_branch: sessionBranchId() },
    }).catch(function (error) {
      console.error(error);
    });
  }

  async function GuardarConfiguracionEmpresa(): Promise<void> {
    await axios({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `guardar_existe_datos_config`,
      headers: { "Content-Type": "application/json" },
      data: {
        ...configEmpresa.value,
        id_branch: sessionBranchId(),
      },
    }).catch(function (error) {
      console.error(error);
    });
  }

  return {
    config,
    datoEmpresa,
    dataUsuario,
    lstProveedor,
    lstClientes,
    lstCostos,
    lstMultiplicador,
    listTipoCostos,
    configEmpresa,
    actualizarDatoEmpresa,
    actualizarDatoAdministrador,
    actualizarDatoCMProveedor,
    actualizarDatoCMCliente,
    obtenerConfigCostos,
    getMultiplicadorConfig,
    getTipoCostosConfig,
    guardarCostos,
    OmitirConfiguracionCost,
    finalizarConfiguracion,
    GuardarConfiguracionEmpresa,
  };
});
