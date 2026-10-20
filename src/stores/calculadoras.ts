import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import store from "@/store";
import type { ApiResponse } from "@/types/api";
import type {
  ConceptoCotizacionCalculadora,
  ConfiguracionCalculadora,
  ContenedorCalculadora,
  CostoCalculadora,
  CotizacionCreadaCalculadora,
  EnvioCotizacionCalculadora,
  FiltroCalculadora,
  FiltroFleteCalculadora,
  FleteCalculadora,
  FleteGrupal,
  FleteGrupalResumen,
  FilaCargaFlete,
  FletePricingCalculadora,
  FormProfitCalculadora,
  LoteTransporteCalculadora,
  MensajeCalculadora,
  NavieraCalculadora,
  OpcionCalculadora,
  ProfitCalculadoraFila,
  PuertoCalculadora,
  ServicioCalculadora,
  SucursalCalculadora,
  TipoCostoCalculadora,
  TransporteCalculadora,
  UbicacionCalculadora,
  UsuarioCalculadora,
} from "@/types/calculadora";
import type { EstadoCotizacion, Multiplicador } from "@/types/cotizacion";
import type { SucursalSesion, UsuarioSesion } from "@/types/sesion";
import { sessionBranchId, sessionIsoPais } from "@/utils/sesion";
// import funciones from "./../../mixins/funciones";

const JSON_HEADERS = { "Content-Type": "application/json" };
const sessionBranches = () => JSON.parse(sessionStorage.getItem("dataBranch") as string) as SucursalSesion[];
const sessionUsers = () => JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[];
const sessionPaisId = () => sessionBranches()[0]!.id_pais;
const confirmacionSimple = (title: string | undefined) => ({
  icon: "success" as const,
  title,
  allowEnterKey: true,
  allowOutsideClick: true,
  allowEscapeKey: true,
});
const aviso = (data: ApiResponse) => ({
  icon: data.estadoflag ? ("success" as const) : ("error" as const),
  title: "Aviso",
  text: data.mensaje,
});

export const useCalculadorasStore = defineStore("calculadoras", () => {
  const listTotalCotizacion = ref<unknown[]>([]);
  const listUser = ref<UsuarioCalculadora[]>([]);
  const cboStatus = ref<unknown[]>([]);
  const datos = ref<ConceptoCotizacionCalculadora[] | null>(null);
  const datosresumen = ref<ConceptoCotizacionCalculadora[] | null>(null);
  const lstTipoCosto = ref<TipoCostoCalculadora[]>([]);
  const lstServicio = ref<ServicioCalculadora[]>([]);
  const lstMultiplicador = ref<Multiplicador[]>([]);
  const lstCostos = ref<CostoCalculadora[]>([]);
  const lstFlete = ref<FleteCalculadora[]>([]);
  const lstProfit = ref<ProfitCalculadoraFila[]>([]);
  const lstFleteGrupalResumen = ref<FleteGrupalResumen[]>([]);
  const lstFleteGrupal = ref<FleteGrupal[]>([]);
  const lstFleteGrupalVenta = ref<FleteGrupal[]>([]);
  const lstDepartamentos = ref<UbicacionCalculadora[]>([]);
  const lstDistritos = ref<UbicacionCalculadora[]>([]);
  const lstCiudades = ref<UbicacionCalculadora[]>([]);
  const lstTransporte = ref<TransporteCalculadora[]>([]);
  const lstOpciones = ref<OpcionCalculadora[]>([]);
  const opcionCalculadora = ref<number | string>(1);
  const opciones = ref<OpcionCalculadora[]>([]);
  const config = ref<ConfiguracionCalculadora[]>([]);
  const estatusCotizacion = ref<EstadoCotizacion[]>([]);
  const fletePricing = ref<FletePricingCalculadora>({});
  const listSucursal = ref<SucursalCalculadora[]>();
  const navieraCalc = ref<NavieraCalculadora[]>();
  const contendedorCalc = ref<ContenedorCalculadora[]>();

  function setOpcion(opcion: number | string): void {
    console.log(opcion);
    opcionCalculadora.value = opcion;
  }

  async function GetTotalCotizacion(): Promise<void> {
    await axios<ApiResponse<unknown[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "get_total_cotizacion",
      headers: JSON_HEADERS,
      data: {
        iso_pais: sessionIsoPais(),
      },
    }).then((response) => {
      listTotalCotizacion.value = response.data.data;
    });
  }

  async function CargarPuertoPorTipoPorPais(data: { id_pais?: number | string; tipo?: string; type?: string }): Promise<PuertoCalculadora[]> {
    store.state.overlay = true;
    const valores = await axios<ApiResponse<PuertoCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `CargarPuertoXPaisXTipo/${data.id_pais}/${data.tipo}`,
      headers: JSON_HEADERS,
    });
    if (!valores.data.estadoflag) {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
      return [];
    }
    store.state.overlay = false;
    return valores.data.data;
  }

  async function CargarnavieraCalc(): Promise<void> {
    store.state.overlay = true;
    const valores = await axios<ApiResponse<NavieraCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_navieras`,
      headers: JSON_HEADERS,
    });
    if (valores.data.estadoflag) {
      navieraCalc.value = valores.data.data;
    } else {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
    }
    store.state.overlay = false;
  }

  async function CargarcontendedorCalc(): Promise<void> {
    store.state.overlay = true;
    const valores = await axios<ApiResponse<ContenedorCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_contenedores`,
      headers: JSON_HEADERS,
    });
    if (valores.data.estadoflag) {
      contendedorCalc.value = valores.data.data;
    } else {
      Swal.fire({
        icon: "info",
        title: valores.data.mensaje,
      });
    }
    store.state.overlay = false;
  }

  async function CargarSucursal(): Promise<void> {
    await axios<ApiResponse<SucursalCalculadora[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `cargar_sucursal`,
      headers: JSON_HEADERS,
    }).then((response) => {
      const data = response.data;
      if (data.estadoflag) {
        listSucursal.value = data.data;
      }
    });
  }

  async function getListUserCalc(): Promise<void> {
    const response = await axios<ApiResponse<UsuarioCalculadora[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "listar_usuarios_calculadora",
      headers: JSON_HEADERS,
      data: {
        iso_pais: sessionIsoPais(),
      },
    });

    listUser.value = response.data.data;
  }

  async function getCboStatus(): Promise<void> {
    const response = await axios<ApiResponse<unknown[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "cargue_status",
      headers: JSON_HEADERS,
    });

    cboStatus.value = response.data.data;
  }

  async function SetCall(data: Record<string, unknown>): Promise<void> {
    await axios<ApiResponse<MensajeCalculadora[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insert_call",
      headers: JSON_HEADERS,
      data: data,
    }).then((response) => {
      Swal.fire({
        icon: response.data.data[0]!.tipomensaje == "TMSGINF" ? "info" : "error",
        title: response.data.data[0]!.mensaje,
      });
    });
  }

  async function ExportarListUser(): Promise<void> {
    await axios<BlobPart>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "export_listar_usuarios_calculadora?id_pais=" + sessionIsoPais(),
      headers: { "Content-Type": "blob" },
      responseType: "blob",
      data: {
        iso_pais: sessionIsoPais(),
      },
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Listado Usuario Calculadora - ${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
    });
  }

  async function obtenerCotizacion(path: string, token: string): Promise<ConceptoCotizacionCalculadora[]> {
    const response = await axios<ApiResponse<ConceptoCotizacionCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + path + "?token=" + token,
      headers: JSON_HEADERS,
    });
    return response.data.data;
  }

  async function GetCotFCL(token: string): Promise<void> {
    datos.value = await obtenerCotizacion("get_cot_fcl", token);
  }
  async function GetCotLCL(token: string): Promise<void> {
    datos.value = await obtenerCotizacion("get_cot_lcl", token);
  }
  async function GetCotAereo(token: string): Promise<void> {
    datos.value = await obtenerCotizacion("get_cot_aereo", token);
  }
  async function GetCotFCLResumen(token: string): Promise<void> {
    datosresumen.value = await obtenerCotizacion("get_cot_fcl_resumen", token);
  }
  async function GetCotLCLResumen(token: string): Promise<void> {
    datosresumen.value = await obtenerCotizacion("get_cot_lcl_resumen", token);
  }
  async function GetCotAereoResumen(token: string): Promise<void> {
    datosresumen.value = await obtenerCotizacion("get_cot_aereo_resumen", token);
  }

  async function GetTipoCosto(data: FiltroCalculadora): Promise<void> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    data.id_pais = id_pais;
    const response = await axios<ApiResponse<TipoCostoCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "calc/tipo_costo",
      headers: JSON_HEADERS,
      params: data,
    });

    lstTipoCosto.value = response.data.data;
  }

  async function GetCalcServicio(): Promise<void> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    const data = { id_pais: id_pais };
    const response = await axios<ApiResponse<ServicioCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "calc/servicio",
      headers: JSON_HEADERS,
      params: data,
    });

    lstServicio.value = response.data.data;
  }

  async function GetCalcMultiplicador(data: FiltroCalculadora): Promise<void> {
    const branch = sessionBranches();
    data.id_branch = branch[0]!.id;
    const response = await axios<ApiResponse<Multiplicador[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "calc/multiplicador",
      headers: JSON_HEADERS,
      params: data,
    });

    lstMultiplicador.value = response.data.data;
  }

  async function PostCalcServicio(data: ServicioCalculadora): Promise<void> {
    sessionPaisId();
    const response = await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "calc/servicio/guardar",
      headers: JSON_HEADERS,
      data: data,
    });
    if (response.data.estadoflag) {
      GetCalcServicio();
    }
  }

  async function PostCalcCosto(data: CostoCalculadora): Promise<void> {
    const branch = sessionBranches();
    const dataUser = sessionUsers();
    const id_pais = branch[0]!.id_pais;
    data.id_pais = id_pais;
    data.users = dataUser[0]!.users;
    const response = await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "calc/costos/insertar",
      headers: JSON_HEADERS,
      data: data,
    });
    if (response.data.estadoflag) {
      GetCotCostos();
    }
  }

  async function GetCotCostos(): Promise<void> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    const params = { id_pais: id_pais };
    const response = await axios<ApiResponse<CostoCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "calc/costos",
      headers: JSON_HEADERS,
      params: params,
    });
    let data = response.data.data;
    data = data.map((v) => {
      return { ...v, bloqueadoflag: true };
    });
    lstCostos.value = data;
  }

  async function GetCotValLCL(data: unknown[]): Promise<FilaCargaFlete[]> {
    let res: FilaCargaFlete[] = [];
    const response = await axios<ApiResponse<FilaCargaFlete[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "calc/val_data_lcl",
      headers: JSON_HEADERS,
      data: {
        data: data,
      },
    });
    if (response.data.estadoflag) {
      res = response.data.data;
    }
    return res;
  }

  async function postGuardarCostos(data: Record<string, unknown>): Promise<void> {
    const dataUser = sessionUsers();
    data.user = dataUser[0]!.users;
    data.id_branch = sessionBranchId();
    const response = await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "calc/costos_calc",
      headers: JSON_HEADERS,
      data: data,
    });
    if (response.data.estadoflag) {
      Swal.fire(confirmacionSimple("Registro Correcto")).then((res) => {
        if (res.isConfirmed) {
          window.location.reload();
        }
      });
    }
  }

  async function obtenerListadoPorPais<T>(path: string, data: FiltroCalculadora): Promise<ApiResponse<T[]>> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    data.id_pais = id_pais;
    const response = await axios<ApiResponse<T[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: JSON_HEADERS,
      params: data,
    });

    return response.data;
  }

  async function getCostosList(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<FleteCalculadora>("calc/costos_list", data);
    if (res.estadoflag) lstFlete.value = res.data;
  }

  async function getProfitList(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<ProfitCalculadoraFila>("calc/profit_list", data);
    if (res.estadoflag) lstProfit.value = res.data;
  }

  async function enviarProfit(
    method: "post" | "put",
    path: string,
    data: Pick<FormProfitCalculadora, "user" | "id_pais">,
  ): Promise<ApiResponse<ProfitCalculadoraFila[]>> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    const dataUser = sessionUsers();
    data.user = dataUser[0]!.users;
    data.id_pais = id_pais;
    const response = await axios<ApiResponse<ProfitCalculadoraFila[]>>({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: JSON_HEADERS,
      data: data,
    });
    return response.data;
  }

  async function postGuardarProfit(data: FormProfitCalculadora): Promise<ProfitCalculadoraFila[]> {
    let res: ProfitCalculadoraFila[] = [];
    const response = await enviarProfit("post", "calc/profit", data);
    if (response.estadoflag) {
      res = response.data;
      Swal.fire(confirmacionSimple("Registro Correcto")).then((res) => {
        if (res.isConfirmed) {
          // window.location.reload();
        }
      });
    }
    return res;
  }

  async function actualizarGuardarProfit(data: FormProfitCalculadora): Promise<ProfitCalculadoraFila[]> {
    let res: ProfitCalculadoraFila[] = [];
    const response = await enviarProfit("put", "calc/profit/actualizar", data);
    if (response.estadoflag) {
      res = response.data;
      Swal.fire(confirmacionSimple("Registro Correcto")).then((res) => {
        if (res.isConfirmed) {
          // window.location.reload();
        }
      });
    }
    return res;
  }

  async function eliminarGuardarProfit(
    data: ProfitCalculadoraFila & Pick<FormProfitCalculadora, "user" | "id_pais">,
  ): Promise<ProfitCalculadoraFila[]> {
    let res: ProfitCalculadoraFila[] = [];
    const response = await enviarProfit("put", "calc/profit/anular", data);
    if (response.estadoflag) {
      res = response.data;
      Swal.fire(confirmacionSimple("Registro Correcto")).then((res) => {
        if (res.isConfirmed) {
          // window.location.reload();
        }
      });
    }
    return res;
  }

  async function ActualizarCosto(data: CostoCalculadora): Promise<void> {
    const dataUser = sessionUsers();
    data.user = dataUser[0]!.users;
    const response = await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "calc/costo/actualizar",
      headers: JSON_HEADERS,
      data: data,
    });
    if (response.data.estadoflag) {
      const res = response.data;
      Swal.fire(confirmacionSimple(res.mensaje)).then((res) => {
        if (res.isConfirmed) {
          GetCotCostos();
        }
      });
    }
  }

  async function EliminarCosto(data: CostoCalculadora): Promise<void> {
    const dataUser = sessionUsers();
    data.user = dataUser[0]!.users;
    const response = await axios<ApiResponse<MensajeCalculadora[]>>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "calc/costo/eliminar",
      headers: JSON_HEADERS,
      data: data,
    });
    if (response.data.estadoflag) {
      const res = response.data.data;
      // @ts-expect-error Kept: the title reads mensaje from the row list, so it is undefined
      Swal.fire(confirmacionSimple(res.mensaje)).then((res) => {
        if (res.isConfirmed) {
          GetCotCostos();
        }
      });
    }
  }

  async function getTransporte(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<TransporteCalculadora>("calc/transporte", data);
    if (res.estadoflag) lstTransporte.value = res.data;
  }

  async function getOpciones(): Promise<void> {
    sessionPaisId();
    const response = await axios<ApiResponse<OpcionCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "calc/cargar/opciones",
      headers: JSON_HEADERS,
      // params: data,
    });

    if (response.data.estadoflag) {
      opciones.value = response.data.data;
    }
  }

  async function getDepartamentos(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<UbicacionCalculadora>("calc/departamentos", data);
    if (res.estadoflag) lstDepartamentos.value = res.data;
  }

  async function getDistritos(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<UbicacionCalculadora>("calc/distritos", data);
    if (res.estadoflag) lstDistritos.value = res.data;
  }

  async function getCiudad(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<UbicacionCalculadora>("calc/ciudades", data);
    if (res.estadoflag) lstCiudades.value = res.data;
  }

  // async getTransporteGuardar({ dispatch }, data) {
  //   let branch = JSON.parse(sessionStorage.getItem("dataBranch"));
  //   let id_pais = branch[0].id_pais;
  //   data.id_pais = id_pais;
  //   let res = [];
  //   var headers = {
  //     "Content-Type": "application/json",
  //   };

  //   var config = {
  //     method: "post",
  //     url: import.meta.env.VITE_URL_MAIN + "calc/transporte/guardar",
  //     headers: headers,
  //     data: data,
  //   };
  //   let response = await axios(config);
  //   if (response.data.estadoflag) {
  //     let res = response.data;
  //     Swal.fire({
  //       icon: "success",
  //       title: res.mensaje,
  //       allowEnterKey: true,
  //       allowOutsideClick: true,
  //       allowEscapeKey: true,
  //     }).then((res) => {
  //       if (res.isConfirmed) {
  //         dispatch("getTransporte", {});
  //       }
  //     });
  //   }
  // },
  async function getConfiguración(data?: Record<string, unknown>): Promise<void> {
    sessionBranches();
    // let id_pais = branch[0].id_pais;
    // data.id_pais = id_pais;
    const response = await axios<ApiResponse<ConfiguracionCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "calc/cargar/config",
      headers: JSON_HEADERS,
      data: data,
    });

    if (response.data.estadoflag) {
      let data = response.data.data;
      data = data.map((v) => {
        return { ...v, editarflag: false };
      });
      config.value = data;
    }
  }

  async function ActualizarConfig(data: ConfiguracionCalculadora): Promise<void> {
    const dataUser = sessionUsers();
    data.user = dataUser[0]!.users;
    const response = await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "calc/config/actualizar",
      headers: JSON_HEADERS,
      data: data,
    });
    if (response.data.estadoflag) {
      const res = response.data;
      Swal.fire(confirmacionSimple(res.mensaje)).then((res) => {
        if (res.isConfirmed) {
          getConfiguración();
        }
      });
    }
  }

  async function getFleteGrupal(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<FleteGrupal>("calc/flete/grupal", data);
    if (res.estadoflag) lstFleteGrupal.value = res.data;
  }

  async function getFleteGrupalResumen(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<FleteGrupalResumen>("calc/flete/grupal/resumen", data);
    if (res.estadoflag) lstFleteGrupalResumen.value = res.data;
  }

  async function enviarConMensaje(method: "post" | "put", path: string, data: unknown): Promise<void> {
    const response = await axios<ApiResponse>({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: JSON_HEADERS,
      data: data,
    });
    if (response.data.estadoflag) {
      const res = response.data;
      Swal.fire(confirmacionSimple(res.mensaje)).then(() => {});
    }
  }

  async function enviarFleteGrupal(method: "post" | "put", path: string, data: FleteGrupal): Promise<void> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    data.id_pais = id_pais;
    await enviarConMensaje(method, path, data);
  }

  async function setFleteGrupal(data: FleteGrupal): Promise<void> {
    console.log("data", data);
    await enviarFleteGrupal("post", "calc/flete/grupal/guardar", data);
  }

  async function updateFleteGrupal(data: FleteGrupal): Promise<void> {
    await enviarFleteGrupal("put", "calc/flete/grupal/actualizar", data);
  }

  async function obtenerFleteCalculadora(datos: FiltroFleteCalculadora): Promise<void> {
    datos.id_branch = sessionBranchId();
    await axios<ApiResponse<FletePricingCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "calc/flete/obtener_flete",
      headers: JSON_HEADERS,
      params: datos,
    }).then((response) => {
      const res = response.data;

      fletePricing.value = res.data[0]!;
    });
  }

  async function getFleteGrupalVenta(data: FiltroCalculadora): Promise<void> {
    const res = await obtenerListadoPorPais<FleteGrupal>("calc/flete/grupal_venta", data);
    if (res.estadoflag) lstFleteGrupalVenta.value = res.data;
  }

  async function setFleteGrupalVenta(data: FleteGrupal): Promise<void> {
    console.log("data", data);
    await enviarFleteGrupal("post", "calc/flete/grupal_venta/guardar", data);
  }

  async function updateFleteGrupalVenta(data: FleteGrupal): Promise<void> {
    await enviarFleteGrupal("put", "calc/flete/grupal_venta/actualizar", data);
  }

  async function enviarTransportes(path: string, data: unknown): Promise<TransporteCalculadora[]> {
    let res: TransporteCalculadora[] = [];
    await axios<ApiResponse<TransporteCalculadora[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: JSON_HEADERS,
      data: data,
    }).then((response) => {
      if (response.data.estadoflag) {
        const val = response.data;

        res = response.data.data.map((item, index) => {
          return {
            ...item,
            index: index + 1,
          };
        });
        Swal.fire(confirmacionSimple(val.mensaje)).then(() => {});
      }
    });

    return res;
  }

  async function validarTransporte(data: LoteTransporteCalculadora): Promise<TransporteCalculadora[]> {
    sessionPaisId();
    return enviarTransportes("calc/transporte/validate", data);
  }

  async function setGuardarTransporte(data: LoteTransporteCalculadora): Promise<TransporteCalculadora[]> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    return enviarTransportes("calc/transporte/guardar", {
      ...data,
      id_pais: id_pais,
    });
  }

  async function enviarConAviso(method: "post" | "put", path: string, data: unknown): Promise<void> {
    const response = await axios<ApiResponse>({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: JSON_HEADERS,
      data: data,
    });

    if (response.data.estadoflag) {
      Swal.fire(aviso(response.data));
    }
  }

  async function EliminarTransporte(data: TransporteCalculadora): Promise<void> {
    await enviarConAviso("put", "calc/transporte/eliminar", data);
  }

  async function ActualizarTransporte(data: TransporteCalculadora): Promise<void> {
    await enviarConAviso("put", "calc/transporte/actualizar", data);
  }

  async function RegistroTransporte(data: TransporteCalculadora): Promise<void> {
    await enviarConAviso("post", "calc/transporte/registro", data);
  }

  async function actualizarFechaVigencia(vigencia: unknown): Promise<void> {
    const branch = sessionBranches();
    const id_pais = branch[0]!.id_pais;
    await enviarConAviso("put", "calc/actualizar_fecha_flete", { id_pais_destino: id_pais, vigencia: vigencia });
  }

  async function EnviarCotizacionCalculadoraAPrincing(data: EnvioCotizacionCalculadora): Promise<void> {
    const response = await axios<ApiResponse<CotizacionCreadaCalculadora[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "calc/enviar_pricing",
      headers: JSON_HEADERS,
      data: data,
    });
    const res = response.data;
    if (res.estadoflag) {
      Swal.fire({
        icon: "success",
        title: "Cotización Creada",
        confirmButtonText: "Ir a la cotización",
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((respuesta) => {
        if (respuesta.isConfirmed) {
          console.log(res.data);
          router.push({
            name: "verQuote",
            params: { id: res.data[0]!.id_quote_out },
          });
        }
      });
    }
  }

  async function opcionListado(): Promise<void> {
    await axios<ApiResponse<OpcionCalculadora[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `calc/opcion_listado`,
    }).then((res) => {
      const data = res.data;
      if (data.estadoflag) {
        const newData = data.data.map((item) => ({
          ...item,
          editarflag: false,
        }));
        lstOpciones.value = newData;
      } else {
        lstOpciones.value = [];
      }
    });
  }

  async function opcionActualizar(data: OpcionCalculadora): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `calc/opcion_actualizar`,
      data: data,
    }).then((res) => {
      const data = res.data;
      if (data.estadoflag) {
        Swal.fire({
          icon: "success",
          text: data.mensaje,
        });
        opcionListado();
      } else {
        opcionListado();
      }
    });
  }

  async function actualizarFlete(data: FleteCalculadora): Promise<void> {
    await enviarConMensaje("put", "calc/flete/actualizar", data);
  }

  async function cargarEstatus(): Promise<void> {
    await axios<ApiResponse<EstadoCotizacion[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `calc/estatus`,
    }).then((res) => {
      const data = res.data;
      if (data.estadoflag) {
        const newData = data.data;
        estatusCotizacion.value = newData;
      } else {
        estatusCotizacion.value = [];
      }
    });
  }

  async function actualizarEstadoCotizacionCalculadora(data: Partial<UsuarioCalculadora>): Promise<void> {
    await enviarConMensaje("put", "calc/actualizar/estado/cotizacion", data);
  }

  return {
    listTotalCotizacion,
    listUser,
    cboStatus,
    datos,
    datosresumen,
    lstTipoCosto,
    lstServicio,
    lstMultiplicador,
    lstCostos,
    lstFlete,
    lstProfit,
    lstFleteGrupalResumen,
    lstFleteGrupal,
    lstFleteGrupalVenta,
    lstDepartamentos,
    lstDistritos,
    lstCiudades,
    lstTransporte,
    lstOpciones,
    opcionCalculadora,
    opciones,
    config,
    estatusCotizacion,
    fletePricing,
    listSucursal,
    navieraCalc,
    contendedorCalc,
    setOpcion,
    GetTotalCotizacion,
    CargarPuertoPorTipoPorPais,
    CargarnavieraCalc,
    CargarcontendedorCalc,
    CargarSucursal,
    getListUserCalc,
    getCboStatus,
    SetCall,
    ExportarListUser,
    GetCotFCL,
    GetCotLCL,
    GetCotAereo,
    GetCotFCLResumen,
    GetCotLCLResumen,
    GetCotAereoResumen,
    GetTipoCosto,
    GetCalcServicio,
    GetCalcMultiplicador,
    PostCalcServicio,
    PostCalcCosto,
    GetCotCostos,
    GetCotValLCL,
    postGuardarCostos,
    getCostosList,
    getProfitList,
    postGuardarProfit,
    actualizarGuardarProfit,
    eliminarGuardarProfit,
    ActualizarCosto,
    EliminarCosto,
    getTransporte,
    getOpciones,
    getDepartamentos,
    getDistritos,
    getCiudad,
    getConfiguración,
    ActualizarConfig,
    getFleteGrupal,
    getFleteGrupalResumen,
    setFleteGrupal,
    updateFleteGrupal,
    obtenerFleteCalculadora,
    getFleteGrupalVenta,
    setFleteGrupalVenta,
    updateFleteGrupalVenta,
    validarTransporte,
    setGuardarTransporte,
    EliminarTransporte,
    ActualizarTransporte,
    RegistroTransporte,
    actualizarFechaVigencia,
    EnviarCotizacionCalculadoraAPrincing,
    opcionListado,
    opcionActualizar,
    actualizarFlete,
    cargarEstatus,
    actualizarEstadoCotizacionCalculadora,
  };
});
