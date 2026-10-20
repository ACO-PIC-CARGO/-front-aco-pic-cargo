import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import type { ApiResponse } from "@/types/api";
import type { Begend, Modalidad } from "@/types/catalogos";
import type {
  AprobacionCotizacion,
  CotizacionAduanaDetalle,
  Costo,
  CotizacionListado,
  DatosPrevisualizacion,
  DatosPrincipales,
  EjecutivoCotizacion,
  EmpresaCotizacion,
  EstadoServicioReporte,
  FiltroCotizaciones,
  FiltroLlamadasAduana,
  FiltroPuertos,
  Impuesto,
  ImpuestoReporte,
  Incoterm,
  IngresoInstructivoAprobar,
  InstructivoCotizacion,
  LineaInstructivo,
  LineaReporte,
  LlamadaCotizacion,
  MasterAprobado,
  Multiplicador,
  Nota,
  Numerico,
  OpcionCosto,
  OpcionesReporte,
  OpcionInstructivo,
  Puerto,
  RespuestaArchivo,
  RespuestaRegistroCotizacion,
  Servicio,
  ServicioInstructivo,
  ServicioPredeterminado,
  TipoCarga,
} from "@/types/cotizacion";
import type { TipoCostoConfig } from "@/types/empresas";
import type { ProveedorPricing } from "@/types/entidades";
import {
  calcularImpuestos,
  calcularValor,
  currencyFormat,
  formatImp,
  formatearContainer,
  formatearNotas,
  formatearServicios,
} from "@/utils/cotizacion";
import { userIdAtAppLoad } from "@/utils/appLoad";
import { sessionBranchId, sessionIsoPais, sessionSucursal, sessionUser } from "@/utils/sesion";

export const useAduanaStore = defineStore("aduana", () => {
  const { calcularFac, formatearCostos, formatearCostosEditar } = useCotizacionCalculos();
  const IdQuote = ref<number | string>("");
  const datosEmpresa = ref<EmpresaCotizacion[]>([]);
  const totalCosto = ref(0);
  const totalCostos = ref(0);
  const nro_quote = ref<string>("");
  const mensaje = ref<string>("");
  const actualizarComparativa = ref(false);
  const filtro = ref<FiltroCotizaciones>({
    id_marketing: "",
    id_status: "",
    id_entities: "",
    id_modality: "",
    id_shipment: "",
    id_incoterm: "",
    fechainicio: "",
    fechafin: "",
    estado: "activo",
  });
  const mostrarGuardarCostos = ref(false);
  const index = ref(0);
  const cantidadOpcionesSeleccionadas = ref(0);
  const tab = ref(1);
  const page = ref(1);
  const llenadoCostos = ref(false);
  const datosPrincipales = ref<DatosPrincipales>({
    id_percepcionaduana: "",
    id_marketing: "",
    id_status: "",
    id_vendedor: userIdAtAppLoad,
    id_pricing: userIdAtAppLoad,
    cif: "",
    contacto: "",
    descripcionMercancia: "",
    begEndList: "",
    ejecutivo_ventas: "",
    fecha_fin: "",
    fecha_inicio: "",
    fullflag: false,
    ganancia: 0,
    id: "",
    id_entitie: "",
    iddestino: "",
    idincoterms: "",
    idorigen: "",
    idsentido: "",
    idtipocarga: "",
    monto: "",
    nameStatusQuote: "",
    nombre: "",
    numerobultos: "",
    peso: "",
    volumen: "",
    quote: "",
    rangeDays: "",
    seguro: "",
    statusMain: "",
    statusQuote: "",
    telefono: "",
    proveedor: "",
    telefonoproveedor: "",
    tiempo_transito: "",
    direccionproveedor: "",
    containers: [],

    iddistrito: "",
    idprovincia: "",
  });
  const opcionCostos = ref<OpcionCosto[]>([
    {
      nro_propuesta: 1,
      date_end: "",
      tiempo_transito: 0,
      listCostos: [],
      listImpuestos: [],
      listNotasQuote: [],
      selected: false,
    },
  ]);
  const listPortEnd = ref<Puerto[]>([]);
  const listPortBegin = ref<Puerto[]>([]);
  const preServices = ref<ServicioPredeterminado[]>([]);
  const listServices = ref<Servicio[]>([]);
  const preCostos = ref<Costo[]>([]);
  const listTipoCostos = ref<TipoCostoConfig[]>([]);
  const namesection = ref<TipoCostoConfig[]>([]);
  const listMultiplicador = ref<Multiplicador[]>([]);
  const copylistServices = ref<Servicio[]>([]);
  const listCostos = ref<Costo[]>([]);
  const listImpuestos = ref<Impuesto[]>([]);
  const listModality = ref<Modalidad[]>([]);
  const listShipment = ref<TipoCarga[]>([]);
  const listIncoterms = ref<Incoterm[]>([]);
  const listQuotes = ref<CotizacionListado[]>([]);
  const listQuotes2 = ref<CotizacionListado[]>([]);
  const listNotasQuote = ref<Nota[]>([]);
  const filtroCalls = ref<FiltroCotizaciones>({
    id_marketing: "",
    id_status: "",
    id_entities: "",
    id_modality: "",
    id_shipment: "",
    id_incoterm: "",
    fechainicio: "",
    fechafin: "",
    estado: "activo",
  });
  const listIngresosInstructivoAprobar = ref<IngresoInstructivoAprobar[]>([]);
  const listIngresosInstructivo = ref<OpcionInstructivo[]>([]);
  const listCostosInstructivo = ref<OpcionInstructivo[]>([]);
  const listImpuestosInstructivo = ref<OpcionInstructivo[]>([]);
  const listInstructivo = ref<InstructivoCotizacion[]>([]);
  const listEjecutivo = ref<EjecutivoCotizacion[]>([]);
  const totalVenta = ref(0);
  const id = ref<number | string>();
  const vendedor = ref<string>();
  const totalFlete = ref<Numerico>();
  const tiporeporte = ref<string>();
  const copy_quote = ref<CotizacionAduanaDetalle>();
  const aprobadoflag = ref<boolean>();
  const fullflag = ref<boolean | number>();
  const mostrarBtnActualizarFlag = ref<boolean>();
  const listServiciosInstructivo = ref<ServicioInstructivo[]>();
  const recargarCostoSeleccionados = ref<boolean>();
  const cancelarLlenadoNuevaOpcion = ref<boolean>();
  const actualizarCostosFlag = ref<boolean>();
  const abrirModalContenedor = ref<boolean>();
  const costoflag = ref<boolean>();
  const actualizarNotas = ref<boolean>();
  const bloquearBtnImprimir = ref<boolean>();
  const ventaflag = ref<boolean>();
  const reset = ref<boolean>();
  const urlFolder = ref<string>();
  const begEndList = ref<Begend[]>();
  const errorValorMercancia = ref<string>();
  const step = ref<number | string>();
  const step2 = ref<boolean>();
  const step3 = ref<boolean>();
  const btnRegistrar = ref<boolean>();
  const e1 = ref<number | string>();
  const fecha_inicio = ref<string>();
  const errfecha_fin = ref<string>();
  const errtiempo_transito = ref<string>();

  function setListQuotes(data: CotizacionListado[]): void {
    usePricingStore().SET_LIST_QUOTES(data);
    listQuotes.value = data;
  }
  function setPreCostos(data: Costo[]): void {
    usePricingStore().preCostos = data;
    preCostos.value = data;
  }
  function setPreServices(data: ServicioPredeterminado[]): void {
    usePricingStore().preServices = data;
    preServices.value = data;
  }
  function setCargarNotasCotizacion(data: Nota[]): void {
    usePricingStore().listNotasQuote = data;
    listNotasQuote.value = data;
  }
  function setListEjecutivo(data: EjecutivoCotizacion[]): void {
    usePricingStore().listEjecutivo = data;
    listEjecutivo.value = data;
  }
  function setListIncoterms(data: Incoterm[]): void {
    usePricingStore().listIncoterms = data;
    listIncoterms.value = data;
  }
  function setListModality(data: Modalidad[]): void {
    usePricingStore().listModality = data;
    listModality.value = data;
  }
  function setListPortBegin(data: Puerto[]): void {
    usePricingStore().listPortBegin = data;
    listPortBegin.value = data;
  }
  function setListPortEnd(data: Puerto[]): void {
    usePricingStore().listPortEnd = data;
    listPortEnd.value = data;
  }
  function setListServices(data: Servicio[]): void {
    const pricing = usePricingStore();
    pricing.listServices = data;
    pricing.copylistServices = data;
    listServices.value = data;
    copylistServices.value = data;
  }
  function setListShipment(data: TipoCarga[]): void {
    usePricingStore().listShipment = data;
    listShipment.value = data;
  }
  function setMultiplicador(data: Multiplicador[]): void {
    usePricingStore().listMultiplicador = data;
    // While configEmpresa was a Vuex module this commit also ran its SET_MULTPLICADOR.
    useConfigEmpresaStore().lstMultiplicador = data;
    listMultiplicador.value = data;
  }
  function setTipoCostos(data: TipoCostoConfig[]): void {
    const pricing = usePricingStore();
    pricing.listTipoCostos = data;
    pricing.namesection = data;
    // While configEmpresa was a Vuex module this commit also ran its SET_TIPO_COSTOS.
    useConfigEmpresaStore().listTipoCostos = data;
    listTipoCostos.value = data;
    namesection.value = data;
  }
  function setInstructivo(data: InstructivoCotizacion[]): void {
    usePricingStore().listInstructivo = data;
    listInstructivo.value = data;
  }

  async function ListarMontosFinalesAduanaMONGODB(): Promise<void> {
    try {
      const config = {
        method: "get",
        url: `${import.meta.env.VITE_URL_MAIN}listar_montos_finales_aduana`,
        params: {
          id_branch: sessionBranchId(),
        },
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await axios<ApiResponse<CotizacionListado[]>>(config);
      const { estadoflag, token, data } = response.data;

      if (estadoflag) {
        sessionStorage.setItem("auth-token", token!);

        const quotes = data.map((v) => ({
          ...v,
          quote: v.expediente,
        }));

        listQuotes2.value = quotes;
      }
    } catch (error) {
      console.error("Error al listar montos finales quote:", error);
    }
  }

  async function GuardaCostosFinalesAduana(): Promise<void> {
    await generaInstructivoparaguardataAduana();
    const listServiciosInstructivo: ServicioInstructivo[] = [];
    listServices.value.forEach((element) => {
      listServiciosInstructivo.push({
        name: element.service,
        status: element.status == true ? "SI" : "NO",
      });
    });
    const listIngresosInstructivo = [...listIngresosInstructivoAprobar.value[0]!.dataIngresos];
    const listCostosInstructivo = [...listIngresosInstructivoAprobar.value[0]!.dataCostos];

    const data = {
      id: id.value,
      expediente: listInstructivo.value[0]!.expediente,
      sentido: listInstructivo.value[0]!.sentido,
      carga: listInstructivo.value[0]!.carga,
      incoterms: listInstructivo.value[0]!.incoterms,
      nombre: datosPrincipales.value.nombre,
      direccion: listInstructivo.value[0]!.direccion,
      telefono: datosPrincipales.value.telefono,
      vendedor: vendedor.value,
      proveedor: listInstructivo.value[0]!.proveedor,
      origen: listInstructivo.value[0]!.origen,
      destino: listInstructivo.value[0]!.destino,
      fiscal: listInstructivo.value[0]!.fiscal,
      ruc: listInstructivo.value[0]!.ruc,
      listServiciosInstructivo: listServiciosInstructivo,
      listIngresosInstructivo: listIngresosInstructivo,
      listCostosInstructivo: listCostosInstructivo,
      id_branch: sessionBranchId(),
    };

    const headers = {
      "Content-Type": "application/json",
    };

    await axios
      // @ts-expect-error Kept: the headers object goes in as the request config, as before.
      .post<ApiResponse>(import.meta.env.VITE_URL_MAIN + "insert_monto_finales_aduana", data, headers)
      .then((response) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const res = response.data;
      })
      .catch((e) =>
        Swal.fire({
          icon: "error",
          title: "Ocurrió un error",
          text: e,
          showConfirmButton: true,
        })
      );
  }
  async function getPersonalPricingAduana(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "get_personal_pricing?id_branch=" + sessionBranchId(),
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<EjecutivoCotizacion[]>>(config)
      .then(function (response) {
        setListEjecutivo(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function aprobarCotizacionAduana(dataParaAprobar: AprobacionCotizacion): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "aprobar_cotizacion_aduana",
      headers: {
        "Content-Type": "application/json",
      },
      data: dataParaAprobar,
    };
    await axios<ApiResponse<MasterAprobado[]>>(config).then(async (res) => {
      const data = res.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const name = data.data[0]!.nro_master + " - " + datosPrincipales.value.nombre;

      // if (dataParaAprobar.nuevoexpediente == true) {
      //   let url_carpeta = await dispatch("createCarpetaOneDrive", { name });

      //   await dispatch("actualizarMaster", {
      //     id: data.data[0].id_master,
      //     url: url_carpeta,
      //   });
      // }
      Swal.fire({
        icon: data.estadoflag == true ? "success" : "error",
        title: "Aviso",
        text: res.data.mensaje,
        timerProgressBar: true,
        allowOutsideClick: false,
        confirmButtonText: "Ir al control de gastos",
        denyButtonText: "Cerrar",
        showCancelButton: false,
        showConfirmButton: true,
        showDenyButton: true,
        confirmButtonColor: "#004D40",
        denyButtonColor: "#DD2C00",
      }).then((res) => {
        if (res.isConfirmed) {
          router.push({
            name: "editControlGasto",
            params: {
              id: data.data[0]!.id_master,
              id_branch: sessionBranchId(),
            },
          });
        }
        if (res.isDenied) {
          window.location.reload();
        }
      });
    });
  }
  async function getServicesAduana(): Promise<void> {
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}obtenerListadoServiciosAduanaQuote`,
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ServicioPredeterminado[]>>(config).then((response) => {
      const data = response.data;

      if (data.estadoflag) {
        sessionStorage.setItem("auth-token", data.token!);

        setPreServices(data.data);
      }
    });
  }
  async function cargarListadoQuoteAduana(): Promise<void> {
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}cargar__quote_aduana`,
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionListado[]>>(config).then((response) => {
      const data = response.data;
      if (data.estadoflag) {
        sessionStorage.setItem("auth-token", data.token!);
        listQuotes2.value = data.data;
      }
    });
  }
  async function getCotizacionUnificar(id: number | string): Promise<void> {
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}obtener_cotizacion_unificar`,
      params: {
        id: id,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionListado[]>>(config).then((response) => {
      const data = response.data;

      if (data.estadoflag) {
        sessionStorage.setItem("auth-token", data.token!);

        setListQuotes(data.data);
      } else {
        setListQuotes([]);
      }
    });
  }
  async function getAduanaUnificar(id: number | string): Promise<void> {
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}obtener_aduana_unificar`,
      params: {
        id: id,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionListado[]>>(config).then((response) => {
      const data = response.data;

      if (data.estadoflag) {
        sessionStorage.setItem("auth-token", data.token!);

        setListQuotes(data.data);
      } else {
        setListQuotes([]);
      }
    });
  }
  async function getItemsServices(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getItemsServices",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),

        id_incoterms: datosPrincipales.value.idincoterms, // 5,
        id_modality: datosPrincipales.value.idsentido, //1,
        // id_shipment: state.datosPrincipales.,//1,
        id_shipment: (datosPrincipales.value.idtipocarga as TipoCarga).id
          ? (datosPrincipales.value.idtipocarga as TipoCarga).id
          : datosPrincipales.value.idtipocarga,
      },
    };
    await axios<ApiResponse<Servicio[]>>(config)
      .then(function (response) {
        const data = response.data;
        // let data = response.data.data;
        if (data.data) {
          setListServices(data.data);
        } else {
          setListServices([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function obtenerCostosAduana(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "obtener_costos_pricing",
      headers: headers,
      params: data,
    };
    await axios<ApiResponse<Costo[]>>(config).then(function (response) {
      setPreCostos(response.data.data);
    });
  }
  async function getMultiplicadorAduana(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      id_shipment: (datosPrincipales.value.idtipocarga as TipoCarga).id
        ? (datosPrincipales.value.idtipocarga as TipoCarga).id
        : datosPrincipales.value.idtipocarga,
      containers: datosPrincipales.value.containers
        ? datosPrincipales.value.containers
        : datosPrincipales.value.containers,
      id_branch: sessionBranchId(),
    };
    //
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getMultiplicador",
      data: data,
      headers: headers,
    };
    await axios<ApiResponse<Multiplicador[]>>(config)
      .then(function (response) {
        const valores: Multiplicador[] = [];
        response.data.data.forEach((element) => {
          valores.push({
            id: element.id,
            value: element.id,
            code: element.code,
            text: element.name,
            valor: element.valor ? element.valor : 0,
          });
        });

        setMultiplicador(valores);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getTipoCostosAduana(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `tipo_costo_x_embarque?id_shipment=${
          (datosPrincipales.value.idtipocarga as TipoCarga).id
            ? (datosPrincipales.value.idtipocarga as TipoCarga).id
            : datosPrincipales.value.idtipocarga
        }&id_modality=${datosPrincipales.value.idsentido}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<TipoCostoConfig[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (!!data.estadoflag) {
          setTipoCostos(data.data);
        } else {
          setTipoCostos([]);
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
  async function predataAduana({ tipo = "" }: { tipo?: string }): Promise<DatosPrevisualizacion> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise(async (resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const iso = sessionIsoPais();
      const TipoCostos = namesection.value.map((v) => ({
        name: v.name,
        codigo: v.codigo,
      }));
      const isImport = listModality.value.some((v) => v.id == datosPrincipales.value.idsentido && v.code == "I");
      let totalImpuesto = 0;
      let imp: ImpuestoReporte[] = [];
      const flete: EstadoServicioReporte[] = [];
      const locales: EstadoServicioReporte[] = [];
      const aduana: EstadoServicioReporte[] = [];
      const almacen: EstadoServicioReporte[] = [];
      const incluye: { name?: string }[] = [];
      const noincluye: { name?: string }[] = [];
      const OpcionesSelecciondas: Record<string, unknown>[] = [];
      let importante: { name?: string }[] = [];
      const contenedor: { name?: string; valor?: number }[] = [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const totalSeguroCargaInterna = 0;
      let totalFleteVentas = 0;
      // GENERALES
      /** AGRUPADO */
      let conceptos: { name?: string }[] = [];
      /** !AGRUPADO */
      let datosFlete: LineaReporte[] = [];
      let datosOrigen: LineaReporte[] = [];
      let datosLocales: LineaReporte[] = [];
      let datosAduanas: LineaReporte[] = [];
      let datosAlmacenes: LineaReporte[] = [];
      let datosGastosTerceros: LineaReporte[] = [];
      // SON LOS COSTOS
      let totalFlete = 0;
      let totalOrigen = 0;
      let totalLocales = 0;
      let totalAduanas = 0;
      let totalAlmacenes = 0;
      let totalGastosTercero = 0;

      // ----------------------------------------------------------------
      /* contenedor*/

      datosPrincipales.value.containers!.forEach((element) => {
        contenedor.push({
          name: element.description,
          valor: element.cantidad,
        });
      });

      /** incluye - no incluye */
      listServices.value.forEach((element) => {
        if (element.status == 1) {
          incluye.push({
            name: element.service,
          });
        }
        if (element.status != 1) {
          noincluye.push({
            name: element.service,
          });
        }
      });
      /*  let ExisteSeguro = state.listCostos.some(
          (v) => v.code_cost == 15 && v.status == 1 && v.esventaflag == 1
        );
  /
        /* NOTAS DE QUOTE - INCLU */

      listServices.value.forEach((element) => {
        if (element.codebegend == "OR") {
          flete.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
        if (element.codebegend == "FL") {
          locales.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
        if (element.codebegend == "DE") {
          aduana.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
        if (element.codebegend == "OP") {
          almacen.push({
            name: element.service,
            estado: element.status == 1 || element.status == true ? "SI" : "NO",
          });
        }
      });
      opcionCostos.value
        .filter((v) => v.selected)
        .forEach((opcionCosto) => {
          setTimeout(async () => {
            importante = [];
            imp = [];
            datosFlete = [];
            datosOrigen = [];
            datosLocales = [];
            datosAduanas = [];
            datosAlmacenes = [];
            datosGastosTerceros = [];
            conceptos = [];
            totalFlete = 0;
            totalOrigen = 0;
            totalLocales = 0;
            totalAduanas = 0;
            totalAlmacenes = 0;
            totalGastosTercero = 0;
            totalImpuesto = 0;
            totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcionCosto.listCostos);
            let totalServicios = 0;

            //  NOTAS
            opcionCosto.listNotasQuote
              .filter((v) => v.estado == 1)
              .forEach((element) => {
                importante.push({ name: element.descripcion });
              });
            // impuestos
            if (listServices.value.some((v) => v.code_service == 15 && v.status == 1)) {
              const codeCalc = ["05", "06", "07", "08", "09", "10", "11", "12"];
              opcionCosto.listImpuestos
                .filter((v) => codeCalc.includes(v.codigo as string))
                .forEach((element) => {
                  imp.push({
                    type: element.codigo,
                    name: element.descripcion,
                    percentage: element.codigo01,
                    valor: calcularImpuestos({
                      impuestos: opcionCosto.listImpuestos,
                      item: element,
                      totalFlete: totalFleteVentas,
                      datosPrincipales: datosPrincipales.value,
                    }),
                    // miMixin.methods.currencyFormat(element.valor),
                  });

                  // console.log("valor", element.valor);
                  totalImpuesto += parseFloat(
                    calcularImpuestos({
                      impuestos: opcionCosto.listImpuestos,
                      item: element,
                      totalFlete: totalFleteVentas,
                      datosPrincipales: datosPrincipales.value,
                    })
                  );
                });
            }
            //  costos
            const isFlete = opcionCosto.listCostos.some(
              (v) => v.esfleteflag == 1 && v.status == true && v.esventaflag == 1
            );
            const isOrigen = opcionCosto.listCostos.some(
              (v) => v.esorigenflag == 1 && v.status == true && v.esventaflag == 1
            );

            const isLocal = opcionCosto.listCostos.some(
              (v) => v.eslocalflag == 1 && v.status == true && v.esventaflag == 1
            );
            const isAduana = opcionCosto.listCostos.some(
              (v) => v.esaduanaflag == 1 && v.status == true && v.esventaflag == 1
            );
            const isAlmacen = opcionCosto.listCostos.some(
              (v) => v.esalmacenflag == 1 && v.status == true && v.esventaflag == 1
            );
            const isGastosTercero = opcionCosto.listCostos.some(
              (v) => v.esgastostercerosflag == 1 && v.status == true && v.esventaflag == 1
            );

            if (tipo == "AGRUPADO") {
              // state.listCostos
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  if (element.esfleteflag == 1) {
                    datosFlete.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : 0
                    ) {
                      totalFlete +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalFlete += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.esorigenflag == 1) {
                    datosOrigen.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : 0
                    ) {
                      totalOrigen +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalOrigen += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.eslocalflag == 1) {
                    datosLocales.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      totalLocales +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalLocales += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.esaduanaflag == 1) {
                    datosAduanas.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      totalAduanas +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalAduanas += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }

                  if (element.esalmacenflag == 1) {
                    datosAlmacenes.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      totalAlmacenes +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalAlmacenes += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.esgastostercerosflag == 1) {
                    datosGastosTerceros.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      totalGastosTercero +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalGastosTercero += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                });
              if (isFlete == true && isImport) {
                opcionCosto.listCostos
                  .filter((v) => v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1)
                  .forEach((element) => {
                    if (conceptos.filter((v) => v.name == element.nameservice)) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isOrigen == true) {
                opcionCosto.listCostos
                  .filter((v) => v.status == 1 && v.esorigenflag == 1 && v.esventaflag == 1)
                  .forEach((element) => {
                    if (conceptos.filter((v) => v.name == element.nameservice)) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }

              if (isLocal == true) {
                opcionCosto.listCostos
                  .filter((v) => v.status == 1 && v.eslocalflag == 1 && v.esventaflag == 1)
                  .forEach((element) => {
                    if (conceptos.filter((v) => v.name == element.nameservice)) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isAduana == true) {
                opcionCosto.listCostos
                  .filter((v) => v.status == 1 && v.esaduanaflag == 1 && v.esventaflag == 1)
                  .forEach((element) => {
                    if (conceptos.filter((v) => v.name == element.nameservice)) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isFlete == true && !isImport) {
                opcionCosto.listCostos
                  .filter((v) => v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1)
                  .forEach((element) => {
                    if (conceptos.filter((v) => v.name == element.nameservice)) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }

              if (isAlmacen == true) {
                opcionCosto.listCostos
                  .filter((v) => v.status == 1 && v.esalmacenflag == 1 && v.esventaflag == 1)
                  .forEach((element) => {
                    if (conceptos.filter((v) => v.name == element.nameservice)) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
              if (isGastosTercero == true) {
                opcionCosto.listCostos
                  .filter((v) => v.status == 1 && v.esgastostercerosflag == 1 && v.esventaflag == 1)
                  .forEach((element) => {
                    if (conceptos.filter((v) => v.name == element.nameservice)) {
                      conceptos.push({
                        name: element.nameservice,
                      });
                    }
                  });
              }
            }
            if (tipo == "DETALLE") {
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  if (element.esfleteflag == 1) {
                    if (
                      listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      datosFlete.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          (listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!
                            .valor as number) *
                            (element.costounitario as number) *
                            (calcularFac(
                              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                                : "N",
                              datosPrincipales.value.volumen,
                              datosPrincipales.value.peso,
                              datosPrincipales.value.containers,
                              datosPrincipales.value.amount
                            ) as number)
                        ),
                      });
                      totalFlete +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      datosFlete.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          calcularValor(
                            datosPrincipales.value.amount,
                            totalFleteVentas,
                            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                              : "",
                            listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                            )
                              ? listMultiplicador.value.some(
                                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                                )
                                ? element.cif
                                : element.seguro
                              : 0
                          )
                        ),
                      });
                      totalFlete += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.esorigenflag == 1) {
                    if (
                      listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      datosOrigen.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          (listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!
                            .valor as number) *
                            (element.costounitario as number) *
                            (calcularFac(
                              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                                : "N",
                              datosPrincipales.value.volumen,
                              datosPrincipales.value.peso,
                              datosPrincipales.value.containers,
                              datosPrincipales.value.amount
                            ) as number)
                        ),
                      });
                      totalOrigen +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      datosOrigen.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          calcularValor(
                            datosPrincipales.value.amount,
                            totalFleteVentas,
                            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                              : "",
                            listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                            )
                              ? listMultiplicador.value.some(
                                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                                )
                                ? element.cif
                                : element.seguro
                              : 0
                          )
                        ),
                      });
                      totalOrigen += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }

                  if (element.eslocalflag == 1) {
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      datosLocales.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                            : 0) as number) *
                            (element.costounitario as number) *
                            (calcularFac(
                              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                                : "N",
                              datosPrincipales.value.volumen,
                              datosPrincipales.value.peso,
                              datosPrincipales.value.containers,
                              datosPrincipales.value.amount
                            ) as number)
                        ),
                      });
                      totalLocales +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      datosLocales.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          calcularValor(
                            datosPrincipales.value.amount,
                            totalFleteVentas,
                            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                              : "",
                            listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                            )
                              ? listMultiplicador.value.some(
                                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                                )
                                ? element.cif
                                : element.seguro
                              : 0
                          )
                        ),
                      });
                      totalLocales += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }

                  if (element.esaduanaflag == 1) {
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      datosAduanas.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                            : 0) as number) *
                            (element.costounitario as number) *
                            (calcularFac(
                              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                                : "N",
                              datosPrincipales.value.volumen,
                              datosPrincipales.value.peso,
                              datosPrincipales.value.containers,
                              datosPrincipales.value.amount
                            ) as number)
                        ),
                      });
                      totalAduanas +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      datosAduanas.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          calcularValor(
                            datosPrincipales.value.amount,
                            totalFleteVentas,
                            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                              : "",
                            listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                            )
                              ? listMultiplicador.value.some(
                                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                                )
                                ? element.cif
                                : element.seguro
                              : 0
                          )
                        ),
                      });
                      totalAduanas += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }

                  if (element.esalmacenflag == 1) {
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      datosAlmacenes.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                            : 0) as number) *
                            (element.costounitario as number) *
                            (calcularFac(
                              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                                : "N",
                              datosPrincipales.value.volumen,
                              datosPrincipales.value.peso,
                              datosPrincipales.value.containers,
                              datosPrincipales.value.amount
                            ) as number)
                        ),
                      });
                      totalAlmacenes +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      datosAlmacenes.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          calcularValor(
                            datosPrincipales.value.amount,
                            totalFleteVentas,
                            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                              : "",
                            listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                            )
                              ? listMultiplicador.value.some(
                                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                                )
                                ? element.cif
                                : element.seguro
                              : 0
                          )
                        ),
                      });
                      totalAlmacenes += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.esgastostercerosflag == 1) {
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      datosGastosTerceros.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                            : 0) as number) *
                            (element.costounitario as number) *
                            (calcularFac(
                              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                                : "N",
                              datosPrincipales.value.volumen,
                              datosPrincipales.value.peso,
                              datosPrincipales.value.containers,
                              datosPrincipales.value.amount
                            ) as number)
                        ),
                      });
                      totalGastosTercero +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      datosGastosTerceros.push({
                        name: element.nameservice,
                        valor: currencyFormat(
                          calcularValor(
                            datosPrincipales.value.amount,
                            totalFleteVentas,
                            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                              : "",
                            listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                            )
                              ? listMultiplicador.value.some(
                                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                                )
                                ? element.cif
                                : element.seguro
                              : 0
                          )
                        ),
                      });
                      totalGastosTercero += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                });
            }
            if (tipo == "TOTAL") {
              console.log("----------");
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  if (element.esfleteflag == 1) {
                    datosFlete.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      totalFlete +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalFlete += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.esorigenflag == 1) {
                    datosOrigen.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      totalOrigen +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalOrigen += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }

                  if (element.eslocalflag == 1) {
                    datosLocales.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      totalLocales +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalLocales += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }

                  if (element.esaduanaflag == 1) {
                    datosAduanas.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                        : false
                    ) {
                      totalAduanas +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalAduanas += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }

                  if (element.esalmacenflag == 1) {
                    datosAlmacenes.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      totalAlmacenes +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalAlmacenes += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                  if (element.esgastostercerosflag == 1) {
                    datosGastosTerceros.push({
                      name: element.nameservice,
                      valor: "",
                    });
                    if (
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    ) {
                      totalGastosTercero +=
                        ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                          : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number);
                    } else {
                      totalGastosTercero += calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      );
                    }
                  }
                });
            }
            // ----------------------------------------------------------------
            totalServicios =
              (isFlete == true ? totalFlete : 0) +
              (isOrigen == true ? totalOrigen : 0) +
              (isLocal == true ? totalLocales : 0) +
              (isAduana == true ? totalAduanas : 0) +
              (isAlmacen == true ? totalAlmacenes : 0) +
              (isGastosTercero == true ? totalGastosTercero : 0);

            let totalImpuestosIGV = 0;
            // ----------------------------------------------------------------

            if (!!isImport) {
              totalImpuestosIGV =
                ((parseFloat(String(isLocal == true ? totalLocales : 0)) +
                  parseFloat(String(isAduana == true ? totalAduanas : 0)) +
                  parseFloat(String(isAlmacen == true ? totalAlmacenes : 0)) +
                  parseFloat(String(isGastosTercero == true ? totalGastosTercero : 0))) *
                  (useEnterprisesStore().impuesto.impuesto as number)) /
                100;
            } else {
              totalImpuestosIGV =
                ((parseFloat(String(isOrigen == true ? totalOrigen : 0)) +
                  parseFloat(String(isLocal == true ? totalLocales : 0)) +
                  parseFloat(String(isAduana == true ? totalAduanas : 0)) +
                  parseFloat(String(isGastosTercero == true ? totalGastosTercero : 0))) *
                  (useEnterprisesStore().impuesto.impuesto as number)) /
                100;
            }

            const total = currencyFormat(
              parseFloat(String(totalServicios)) +
                parseFloat(String(totalImpuesto)) +
                parseFloat(String(totalImpuestosIGV))
            );

            OpcionesSelecciondas.push({
              nro_propuesta: opcionCosto.nro_propuesta,
              importante: importante,
              impuesto: imp,
              datosFlete: isFlete == true ? datosFlete : [],
              datosOrigen: isOrigen == true ? datosOrigen : [],
              datosLocales: isLocal == true ? datosLocales : [],
              datosAduanas: isAduana == true ? datosAduanas : [],
              datosAlmacenes: isAlmacen == true ? datosAlmacenes : [],
              datosGastosTerceros: isGastosTercero == true ? datosGastosTerceros : [],
              totalImpuestosIGV: currencyFormat(totalImpuestosIGV),
              totalImpuesto: currencyFormat(parseFloat(String(totalImpuesto)).toFixed(2)),
              total: total,
              totalFlete: isFlete == true ? currencyFormat(totalFlete) : currencyFormat(0),
              totalOrigen: isOrigen == true ? currencyFormat(totalOrigen) : currencyFormat(0),
              totalLocales: isLocal == true ? currencyFormat(totalLocales) : currencyFormat(0),
              totalAduanas: isAduana == true ? currencyFormat(totalAduanas) : currencyFormat(0),
              totalAlmacenes: isAlmacen == true ? currencyFormat(totalAlmacenes) : currencyFormat(0),
              totalGastosTercero: isGastosTercero == true ? currencyFormat(totalGastosTercero) : currencyFormat(0),
              conceptos: conceptos,
              totalServicios: currencyFormat(totalServicios),
              listServices: listServices.value,
              listNotasQuote: opcionCosto.listNotasQuote,
            });
          }, 10);
        });

      /* FLETE - LOCAL - ADUANA - ALMACEN - SERVICIOS SIEMPRE VENTAFLAG == 0*/

      /* IMPUESTOS */

      // ----------------------------------------------------------------

      /* GENERAR */

      const data = {
        TipoCostos: TipoCostos,
        isImport: listModality.value.some((v) => v.id == datosPrincipales.value.idsentido && v.code == "I"),
        id_branch: sessionBranchId(),
        code: "########",
        business_name: datosEmpresa.value[0]!.business_name ? datosEmpresa.value[0]!.business_name : "",
        address: datosEmpresa.value[0]!.address,
        iso: datosEmpresa.value[0]!.iso_pais,
        iso_pais: datosEmpresa.value[0]!.iso_pais,
        pais: datosEmpresa.value[0]!.pais,
        document: datosEmpresa.value[0]!.document,
        phone: datosEmpresa.value[0]!.phone,
        tipo: tipo,
        cliente: datosPrincipales.value.nombre,
        slogancliente: datosPrincipales.value.slogan ? datosPrincipales.value.slogan : "",
        fechafin: datosPrincipales.value.fecha_fin,
        tiempoTransito: datosPrincipales.value.tiempo_transito,
        origen:
          listPortBegin.value.filter((v) => v.id_port == datosPrincipales.value.idorigen).length > 0
            ? listPortBegin.value.filter((v) => v.id_port == datosPrincipales.value.idorigen)[0]!.name
            : "",
        destino:
          listPortEnd.value.filter((v) => v.id_port == datosPrincipales.value.iddestino).length > 0
            ? listPortEnd.value.filter((v) => v.id_port == datosPrincipales.value.iddestino)[0]!.name
            : "",

        flete: flete,
        almacen: almacen,
        aduana: aduana,
        local: locales,
        // totalImpuesto: miMixin.methods.currencyFormat(
        //   parseFloat(totalImpuesto).toFixed(2)
        // ),
        incluye: incluye,
        noincluye: noincluye,
        importante: importante,
        contenedor: contenedor,
        conceptos: conceptos,
        numerobultos: datosPrincipales.value.numerobultos,
        peso: datosPrincipales.value.peso,
        volumen: datosPrincipales.value.volumen,
        sentido: listModality.value.filter((v) => v.id == datosPrincipales.value.idsentido)[0]!.name,
        embarque: listShipment.value.filter(
          (v) =>
            v.id ==
            ((datosPrincipales.value.idtipocarga as TipoCarga).id
              ? (datosPrincipales.value.idtipocarga as TipoCarga).id
              : datosPrincipales.value.idtipocarga)
        )[0]!.embarque,
        icoterm: listIncoterms.value.filter((v) => v.id == datosPrincipales.value.idincoterms)[0]!.name,

        OpcionesSelecciondas: OpcionesSelecciondas,
      };
      setTimeout(() => {
        resolve(data);
      }, 1000);
    });
  }
  async function getModalityAduana(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getModality",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<Modalidad[]>>(config)
      .then(function (response) {
        setListModality(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function obtenerDatosEmpresaAduana(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `getBranch/${sessionBranchId()}`,
      headers: headers,
      data: data,
    };
    await axios<ApiResponse<EmpresaCotizacion[]>>(config).then((res) => {
      const data = res.data.data;
      datosEmpresa.value = data;
    });
  }
  async function getPortBeginAduana({ id_transport = 0, id = null, search = null }: FiltroPuertos): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPortBegin",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
        id_transport: id_transport,
        id: id,
        search: search,
      },
    };
    await axios<ApiResponse<Puerto[]>>(config)
      .then(function (response) {
        setListPortBegin(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getPortEndAduana({ id_transport = 0, id = null, search = null }: FiltroPuertos): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPortEnd",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
        id_transport: id_transport,
        id: id,
        search: search,
      },
    };
    await axios<ApiResponse<Puerto[]>>(config)
      .then(function (response) {
        setListPortEnd(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getShipmentAduana(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getShipment",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<TipoCarga[]>>(config)
      .then(function (response) {
        setListShipment(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getIncotermsAduana(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getIncoterms",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<Incoterm[]>>(config)
      .then(function (response) {
        setListIncoterms(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function registrarAduana({ fullflag = true }: { fullflag?: boolean }): Promise<void> {
    const imp = listServices.value.filter((v) => v.code_service == "15" && v.status == true);
    const isFCL = listShipment.value.some(
      (v) =>
        v.id ==
          ((datosPrincipales.value.idtipocarga as TipoCarga).id
            ? (datosPrincipales.value.idtipocarga as TipoCarga).id
            : datosPrincipales.value.idtipocarga) && v.code == "FCL"
    );
    const opciones: unknown[] = [];
    await opcionCostos.value.forEach(async (opcionCosto) => {
      const costocotizacion = formatearCostos({
        costos: opcionCosto.listCostos,
        services: listServices.value,
        multiplicadores: listMultiplicador.value,
        datosPrincipales: datosPrincipales.value,
        totalDeFlete: totalFlete.value,
      });
      const notacosto = formatearNotas({
        notas: opcionCosto.listNotasQuote.filter((v) => v.estado == 1),
      });
      const impuestos =
        imp.length > 0
          ? formatImp({
              impuestos: opcionCosto.listImpuestos,
              datosPrincipales: datosPrincipales.value,
              totalFlete: totalFlete.value,
            })
          : [];
      opciones.push({
        nro_propuesta: opcionCosto.nro_propuesta,
        date_end: opcionCosto.date_end,
        tiempo_transito: opcionCosto.tiempo_transito,
        listCostos: costocotizacion,
        listImpuestos: impuestos,
        listNotasQuote: notacosto,
        selected: opcionCosto.selected,
      });
    });

    const data = {
      tiporeporte: tiporeporte.value ? tiporeporte.value : "TOTAL",
      id_percepcionaduana: datosPrincipales.value.id_percepcionaduana,
      fullflag: fullflag,
      id_marketing: datosPrincipales.value.id_marketing,
      statusquote: datosPrincipales.value.id_status,
      idVendedor: datosPrincipales.value.id_vendedor,
      idPricing: datosPrincipales.value.id_pricing,
      id_entitie: datosPrincipales.value.id_entitie,
      idsentido: datosPrincipales.value.idsentido,
      idtipocarga: (datosPrincipales.value.idtipocarga as TipoCarga).id
        ? (datosPrincipales.value.idtipocarga as TipoCarga).id
        : datosPrincipales.value.idtipocarga,
      idincoterms: datosPrincipales.value.idincoterms,
      proveedor: datosPrincipales.value.proveedor,
      telefonoproveedor: datosPrincipales.value.telefonoproveedor,
      direccionproveedor: datosPrincipales.value.direccionproveedor,
      idorigen: datosPrincipales.value.idorigen,
      iddestino: datosPrincipales.value.iddestino,
      numerobultos: !isFCL ? datosPrincipales.value.numerobultos : 0,
      peso: !isFCL ? datosPrincipales.value.peso : 0,
      volumen: !isFCL ? datosPrincipales.value.volumen : 0,
      contenedores: isFCL
        ? formatearContainer({
            containers: datosPrincipales.value.containers!,
          })
        : [],
      serviciocotizacion: formatearServicios({
        services: listServices.value,
      }),
      monto: datosPrincipales.value.amount,

      iddistrito: datosPrincipales.value.iddistrito,
      idprovincia: datosPrincipales.value.idprovincia,

      descripcionMercancia: datosPrincipales.value.descripcioncarga ? datosPrincipales.value.descripcioncarga : "",
      ventascasillerodetalles: [],
      opcionCostos: opciones,
      id_branch: sessionBranchId(),
    };
    //  console.log(data.costocotizacion);
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "insert_aduana  ",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    // let vm = this;
    await axios<RespuestaRegistroCotizacion>(config).then(async (response) => {
      id.value = response.data.insertId;
      nro_quote.value = response.data.nro_quote;
      mensaje.value = response.data.msg;
      tiporeporte.value = "";
    });
  }
  async function getListQuoteAduana(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_aduana?id_branch=${sessionBranchId()}&id_marketing=${
          filtro.value.id_marketing ? filtro.value.id_marketing : ""
        }&id_status=${filtro.value.id_status ? filtro.value.id_status : ""}&id_entities=${
          filtro.value.id_entities ? filtro.value.id_entities : ""
        }&id_modality=${filtro.value.id_modality ? filtro.value.id_modality : ""}&id_shipment=${
          filtro.value.id_shipment ? filtro.value.id_shipment : ""
        }&id_incoterm=${filtro.value.id_incoterm ? filtro.value.id_incoterm : ""}&fechainicio=${
          filtro.value.fechainicio ? filtro.value.fechainicio : ""
        }&fechafin=${filtro.value.fechafin ? filtro.value.fechafin : ""}&estado=${
          filtro.value.estado == "activo" ? 1 : filtro.value.estado == "eliminado" ? 0 : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<CotizacionListado[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          const rows = data.data.map((elemento, index) => {
            return { ...elemento, index };
          });
          setListQuotes(rows);
        } else {
          setListQuotes([]);
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
        console.error(error);
      });
  }
  async function getAdunaVer({ id: idAduana }: { id: number | string }): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `ver_aduana?id=${idAduana}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionAduanaDetalle[]>>(config).then(async (response) => {
      const res = response.data.data[0]!;

      copy_quote.value = res;
      id.value = res.id;
      nro_quote.value = res.quote;
      datosPrincipales.value.id_marketing = res.id_marketing;
      datosPrincipales.value.id_status = res.id_status; //-------
      datosPrincipales.value.id_vendedor = res.id_vendedor;
      datosPrincipales.value.id_pricing = res.id_pricing;
      datosPrincipales.value.nombre = res.nombre;
      datosPrincipales.value.id_entitie = res.id_entitie;
      datosPrincipales.value.telefono = res.telefono;
      datosPrincipales.value.idsentido = res.idsentido;
      datosPrincipales.value.idtipocarga = res.idtipocarga;
      datosPrincipales.value.idincoterms = res.idincoterms;
      datosPrincipales.value.proveedor = res.proveedor;
      datosPrincipales.value.telefonoproveedor = res.telefonoproveedor;
      datosPrincipales.value.direccionproveedor = res.direccionproveedor;
      datosPrincipales.value.id_status = res.statusquote;
      datosPrincipales.value.descripcioncarga = res.descripcionmercancia;
      datosPrincipales.value.fecha_inicio = res.fecha_inicio;
      // --------------------------------------------------------------
      datosPrincipales.value.iddestino = res.iddestino;
      datosPrincipales.value.idorigen = res.idorigen;
      datosPrincipales.value.numerobultos = res.numerobultos;
      datosPrincipales.value.peso = res.peso;
      datosPrincipales.value.volumen = res.volumen;
      // --------------------------------------------------------------
      listServices.value = res.servicios;
      copylistServices.value = res.servicios;
      datosPrincipales.value.amount = res.monto;
      // --------------------------------------------------------------
      opcionCostos.value = [];

      res.opcioncostos.forEach((element) => {
        opcionCostos.value.push({
          id: element.id,
          nro_propuesta: element.nro_propuesta,
          date_end: element.date_end,
          tiempo_transito: element.tiempo_transito,
          listCostos: element.listcostos,
          listImpuestos: element.listimpuestos,
          listNotasQuote: element.listnotasquote,
          selected: element.selected,
        });
      });

      // --------------------------------------------------------------

      datosPrincipales.value.containers = res.containers;
      aprobadoflag.value = res.aprobadoflag;
      fullflag.value = res.fullflag;
      tiporeporte.value = res.tiporeporte;
      datosPrincipales.value.id_percepcionaduana = res.id_percepcionaduana;
      mostrarBtnActualizarFlag.value = !(res.statusmain == 0 || res.aprobadoflag == true);
    });
  }
  async function actualizarQuoteAduana(): Promise<void> {
    const imp = listServices.value.filter((v) => v.code_service == "15" && v.status == true);
    const opciones: unknown[] = [];
    await opcionCostos.value.forEach(async (opcionCosto) => {
      const costocotizacion = formatearCostosEditar({
        costos: opcionCosto.listCostos,
        services: listServices.value,
        multiplicadores: listMultiplicador.value,
        datosPrincipales: datosPrincipales.value,
        totalDeFlete: totalFlete.value,
      });
      const notacosto = formatearNotas({
        notas: opcionCosto.listNotasQuote.filter((v) => v.estado == 1),
      });
      const impuestos =
        imp.length > 0
          ? formatImp({
              impuestos: opcionCosto.listImpuestos,
              datosPrincipales: datosPrincipales.value,
              totalFlete: totalFlete.value,
            })
          : [];
      opciones.push({
        id: opcionCosto.id,
        nro_propuesta: opcionCosto.nro_propuesta,
        date_end: opcionCosto.date_end,
        tiempo_transito: opcionCosto.tiempo_transito,
        listCostos: costocotizacion,
        listImpuestos: impuestos,
        listNotasQuote: notacosto,
        selected: opcionCosto.selected,
      });
    });
    const data = {
      tiporeporte: tiporeporte.value ? tiporeporte.value : "TOTAL",
      id_percepcionaduana: datosPrincipales.value.id_percepcionaduana,
      id: id.value,
      id_quote: id.value,
      fullflag: true,
      id_marketing: datosPrincipales.value.id_marketing,
      statusquote: datosPrincipales.value.id_status,
      idVendedor: datosPrincipales.value.id_vendedor,
      idPricing: datosPrincipales.value.id_pricing,
      id_entitie: datosPrincipales.value.id_entitie,
      idsentido: datosPrincipales.value.idsentido,
      idtipocarga: (datosPrincipales.value.idtipocarga as TipoCarga).id
        ? (datosPrincipales.value.idtipocarga as TipoCarga).id
        : datosPrincipales.value.idtipocarga,
      idincoterms: datosPrincipales.value.idincoterms,
      proveedor: datosPrincipales.value.proveedor,
      telefonoproveedor: datosPrincipales.value.telefonoproveedor,
      direccionproveedor: datosPrincipales.value.direccionproveedor,
      idorigen: datosPrincipales.value.idorigen,
      iddestino: datosPrincipales.value.iddestino,
      numerobultos: datosPrincipales.value.numerobultos,
      peso: datosPrincipales.value.peso,
      volumen: datosPrincipales.value.volumen,
      contenedores: formatearContainer({
        containers: datosPrincipales.value.containers!,
      }),
      serviciocotizacion: formatearServicios({
        services: listServices.value,
      }),
      monto: datosPrincipales.value.amount,

      iddistrito: datosPrincipales.value.iddistrito,
      idprovincia: datosPrincipales.value.idprovincia,

      descripcionMercancia: datosPrincipales.value.descripcioncarga ? datosPrincipales.value.descripcioncarga : "",
      opcionCostos: opciones,
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_aduana",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    // let vm = this;
    await axios<ApiResponse>(config).then(async (response) => {
      const data = response.data;

      Swal.fire({
        icon: "info",
        text: data.mensaje,
      });
    });
  }
  async function getCargarMasterDetalleNotasCotizacionAduana(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_notas_cotizacion?id_branch=${sessionBranchId()}`,
      headers: headers,
    };
    axios<ApiResponse<Nota[]>>(config).then((response) => {
      const data = response.data;
      if (data.estadoflag == true) {
        setCargarNotasCotizacion(response.data.data);
      } else {
        Swal.fire({
          icon: "error",
          text: data.mensaje,
        });
        setCargarNotasCotizacion([]);
      }
    });
  }

  async function unificarQuoteAduana(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "aduana_unificar",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<RespuestaRegistroCotizacion>(config).then((response) => {
      IdQuote.value = response.data.insertId;
      nro_quote.value = response.data.nro_quote;
      mensaje.value = response.data.msg;
      tiporeporte.value = "";
    });
  }

  async function actualizarAduanaRecibidoEnviado(data: Record<string, unknown>): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `update_aduana_recibido_enviado`,
      headers: headers,
      data: data,
    };
    axios<ApiResponse>(config).then((response) => {
      const data = response.data;

      Swal.fire({
        icon: data.estadoflag == true ? "info" : "error",
        text: data.mensaje,
      });
    });
  }
  async function guardarNotaAduana(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "set_calls_aduana",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config).catch(function (error) {
      console.error(error);
    });
  }
  async function getQuoteCallAduana(filtro: FiltroLlamadasAduana): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
      id_estado: filtro.id_estado,
      id_sentido: filtro.id_sentido,
      id_carga: filtro.id_carga,
      id_incoterms: filtro.id_incoterms,
      desde: filtro.desde,
      hasta: filtro.hasta,
    };

    const header = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `list_calls_aduana?id_branch=${sessionBranchId()}&id_marketing=${
          filtroCalls.value.id_marketing ? filtroCalls.value.id_marketing : ""
        }&id_status=${filtroCalls.value.id_status ? filtroCalls.value.id_status : ""}&id_entities=${
          filtroCalls.value.id_entities ? filtroCalls.value.id_entities : ""
        }&id_modality=${filtroCalls.value.id_modality ? filtroCalls.value.id_modality : ""}&id_shipment=${
          filtroCalls.value.id_shipment ? filtroCalls.value.id_shipment : ""
        }&id_incoterm=${filtroCalls.value.id_incoterm ? filtroCalls.value.id_incoterm : ""}&fechainicio=${
          filtroCalls.value.fechainicio ? filtroCalls.value.fechainicio : ""
        }&fechafin=${filtroCalls.value.fechafin ? filtroCalls.value.fechafin : ""}&estado=${
          typeof filtroCalls.value.estado === "string" ? (filtroCalls.value.estado == "activo" ? 1 : 0) : ""
        }`,
      headers: header,
      data: data,
    };
    await axios<ApiResponse<LlamadaCotizacion[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          usePricingStore().SET_LIST_CALLS(data.data);
        } else {
          usePricingStore().SET_LIST_CALLS([]);
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
        console.error(error);
      });
  }
  async function generarReporteAduana({ tipo = "", nro_propuesta = 0 }: OpcionesReporte): Promise<void> {
    const opcion = opcionCostos.value.filter((v) => v.nro_propuesta == nro_propuesta)[0]!;
    let totalFleteVentas = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const iso = sessionIsoPais();
    const TipoCostos = namesection.value.map((v) => ({
      name: v.name,
      codigo: v.codigo,
    }));
    const isImport = listModality.value.some((v) => v.id == datosPrincipales.value.idsentido && v.code == "I");
    let totalImpuesto = 0;
    const imp: ImpuestoReporte[] = [];
    const flete: EstadoServicioReporte[] = [];
    const locales: EstadoServicioReporte[] = [];
    const aduana: EstadoServicioReporte[] = [];
    const almacen: EstadoServicioReporte[] = [];
    const incluye: { name?: string }[] = [];
    const noincluye: { name?: string }[] = [];
    const importante: { name?: string }[] = [];
    const contenedor: { name?: string; valor?: number }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const totalSeguroCargaInterna = 0;
    // GENERALES
    /** AGRUPADO */
    const conceptos: { name?: string }[] = [];
    /** !AGRUPADO */
    const datosFlete: LineaReporte[] = [];
    const datosOrigen: LineaReporte[] = [];
    const datosLocales: LineaReporte[] = [];
    const datosAduanas: LineaReporte[] = [];
    const datosAlmacenes: LineaReporte[] = [];
    const datosGastosTerceros: LineaReporte[] = [];
    // SON LOS COSTOS
    let totalFlete = 0;
    let totalOrigen = 0;
    let totalLocales = 0;
    let totalAduanas = 0;
    let totalAlmacenes = 0;
    let totalGastosTercero = 0;
    const isFlete = opcion.listCostos.some((v) => v.esfleteflag == 1 && v.status == true && v.esventaflag == 1);
    const isOrigen = opcion.listCostos.some((v) => v.esorigenflag == 1 && v.status == true && v.esventaflag == 1);

    const isLocal = opcion.listCostos.some((v) => v.eslocalflag == 1 && v.status == true && v.esventaflag == 1);
    const isAduana = opcion.listCostos.some((v) => v.esaduanaflag == 1 && v.status == true && v.esventaflag == 1);
    const isAlmacen = opcion.listCostos.some((v) => v.esalmacenflag == 1 && v.status == true && v.esventaflag == 1);
    const isGastosTercero = opcion.listCostos.some(
      (v) => v.esgastostercerosflag == 1 && v.status == true && v.esventaflag == 1
    );
    // ----------------------------------------------------------------
    /* contenedor*/

    datosPrincipales.value.containers!.forEach((element) => {
      contenedor.push({
        name: element.description,
        valor: element.cantidad,
      });
    });

    /** incluye - no incluye */
    listServices.value.forEach((element) => {
      if (element.status == 1) {
        incluye.push({
          name: element.service,
        });
      }
      if (element.status != 1) {
        noincluye.push({
          name: element.service,
        });
      }
    });

    opcion.listNotasQuote
      .filter((v) => v.estado == 1 && v.statusincluye == 1)
      .forEach((element) => {
        incluye.push({ name: element.descripcion });
      });

    opcion.listNotasQuote
      .filter((v) => v.estado == 1 && v.statusnoincluye == 1)
      .forEach((element) => {
        noincluye.push({ name: element.descripcion });
      });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ExisteSeguro = opcion.listCostos.some((v) => v.code_cost == 15 && v.status == 1 && v.esventaflag == 1);
    /* FLETE - LOCAL - ADUANA - ALMACEN - SERVICIOS SIEMPRE VENTAFLAG == 0*/
    listServices.value.forEach((element) => {
      if (element.codebegend == "OR") {
        flete.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
      if (element.codebegend == "FL") {
        locales.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
      if (element.codebegend == "DE") {
        aduana.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
      if (element.codebegend == "OP") {
        almacen.push({
          name: element.service,
          estado: element.status == 1 || element.status == true ? "SI" : "NO",
        });
      }
    });

    opcion.listNotasQuote
      .filter((v) => v.estado == 1 && !v.statusincluye && !v.statusnoincluye)
      .forEach((element) => {
        importante.push({ name: element.descripcion });
      });
    totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcion.listCostos);

    /* IMPUESTOS */
    if (listServices.value.some((v) => v.code_service == 15 && v.status == 1)) {
      const codeCalc = ["05", "06", "07", "08", "09", "10", "11", "12"];
      opcion.listImpuestos
        .filter((v) => codeCalc.includes(v.codigo as string))
        .forEach((element) => {
          imp.push({
            type: element.codigo,
            name: element.descripcion,
            percentage: element.codigo01,
            valor: calcularImpuestos({
              impuestos: opcion.listImpuestos,
              item: element,
              totalFlete: totalFleteVentas,
              datosPrincipales: datosPrincipales.value,
            }),
            // miMixin.methods.currencyFormat(element.valor),
          });

          // console.log("valor", element.valor);
          totalImpuesto += parseFloat(
            calcularImpuestos({
              impuestos: opcion.listImpuestos,
              item: element,
              totalFlete: totalFleteVentas,
              datosPrincipales: datosPrincipales.value,
            })
          );
        });
    }

    if (tipo == "AGRUPADO") {
      opcion.listCostos
        .filter((v) => v.status == 1 && v.esventaflag == 1)
        .forEach((element) => {
          if (element.esfleteflag == 1) {
            datosFlete.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : 0
            ) {
              totalFlete +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalFlete += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.esorigenflag == 1) {
            datosOrigen.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : 0
            ) {
              totalOrigen +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalOrigen += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.eslocalflag == 1) {
            datosLocales.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              totalLocales +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalLocales += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.esaduanaflag == 1) {
            datosAduanas.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              totalAduanas +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalAduanas += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }

          if (element.esalmacenflag == 1) {
            datosAlmacenes.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              totalAlmacenes +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalAlmacenes += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.esgastostercerosflag == 1) {
            datosGastosTerceros.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              totalGastosTercero +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalGastosTercero += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
        });
      if (isFlete == true && isImport) {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isOrigen == true) {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esorigenflag == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isLocal == true) {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.eslocalflag == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isAduana == true) {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esaduanaflag == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isFlete == true && !isImport) {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esfleteflag == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isAlmacen == true) {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esalmacenflag == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
      if (isGastosTercero == true) {
        opcion.listCostos
          .filter((v) => v.status == 1 && v.esgastostercerosflag == 1 && v.esventaflag == 1)
          .forEach((element) => {
            if (conceptos.filter((v) => v.name == element.nameservice)) {
              conceptos.push({
                name: element.nameservice,
              });
            }
          });
      }
    }
    if (tipo == "DETALLE") {
      opcion.listCostos
        .filter((v) => v.status == 1 && v.esventaflag == 1)
        .forEach((element) => {
          if (element.esfleteflag == 1) {
            if (
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              datosFlete.push({
                name: element.nameservice,
                valor: currencyFormat(
                  (listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number)
                ),
              });
              totalFlete +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              datosFlete.push({
                name: element.nameservice,
                valor: currencyFormat(
                  calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  )
                ),
              });
              totalFlete += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.esorigenflag == 1) {
            if (
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              datosOrigen.push({
                name: element.nameservice,
                valor: currencyFormat(
                  (listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number)
                ),
              });
              totalOrigen +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              datosOrigen.push({
                name: element.nameservice,
                valor: currencyFormat(
                  calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  )
                ),
              });
              totalOrigen += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }

          if (element.eslocalflag == 1) {
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              datosLocales.push({
                name: element.nameservice,
                valor: currencyFormat(
                  ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                    : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number)
                ),
              });
              totalLocales +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              datosLocales.push({
                name: element.nameservice,
                valor: currencyFormat(
                  calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  )
                ),
              });
              totalLocales += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }

          if (element.esaduanaflag == 1) {
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              datosAduanas.push({
                name: element.nameservice,
                valor: currencyFormat(
                  ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                    : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number)
                ),
              });
              totalAduanas +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              datosAduanas.push({
                name: element.nameservice,
                valor: currencyFormat(
                  calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  )
                ),
              });
              totalAduanas += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }

          if (element.esalmacenflag == 1) {
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              datosAlmacenes.push({
                name: element.nameservice,
                valor: currencyFormat(
                  ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                    : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number)
                ),
              });
              totalAlmacenes +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              datosAlmacenes.push({
                name: element.nameservice,
                valor: currencyFormat(
                  calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  )
                ),
              });
              totalAlmacenes += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.esgastostercerosflag == 1) {
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              datosGastosTerceros.push({
                name: element.nameservice,
                valor: currencyFormat(
                  ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                    : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number)
                ),
              });
              totalGastosTercero +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              datosGastosTerceros.push({
                name: element.nameservice,
                valor: currencyFormat(
                  calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  )
                ),
              });
              totalGastosTercero += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
        });
    }
    if (tipo == "TOTAL") {
      opcion.listCostos
        .filter((v) => v.status == 1 && v.esventaflag == 1)
        .forEach((element) => {
          if (element.esfleteflag == 1) {
            datosFlete.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              totalFlete +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalFlete += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.esorigenflag == 1) {
            datosOrigen.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              totalOrigen +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalOrigen += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }

          if (element.eslocalflag == 1) {
            datosLocales.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              totalLocales +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalLocales += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }

          if (element.esaduanaflag == 1) {
            datosAduanas.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              totalAduanas +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalAduanas += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }

          if (element.esalmacenflag == 1) {
            datosAlmacenes.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              totalAlmacenes +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalAlmacenes += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
          if (element.esgastostercerosflag == 1) {
            datosGastosTerceros.push({
              name: element.nameservice,
              valor: "",
            });
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
            ) {
              totalGastosTercero +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              totalGastosTercero += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
          }
        });
    }
    let totalImpuestosIGV = 0;
    // ----------------------------------------------------------------

    if (isImport) {
      totalImpuestosIGV =
        ((parseFloat(String(isLocal == true ? totalLocales : 0)) +
          parseFloat(String(isAduana == true ? totalAduanas : 0)) +
          parseFloat(String(isAlmacen == true ? totalAlmacenes : 0)) +
          parseFloat(String(isGastosTercero == true ? totalGastosTercero : 0))) *
          (useEnterprisesStore().impuesto.impuesto as number)) /
        100;
    } else {
      totalImpuestosIGV =
        ((parseFloat(String(isOrigen == true ? totalOrigen : 0)) +
          parseFloat(String(isLocal == true ? totalLocales : 0)) +
          parseFloat(String(isAduana == true ? totalAduanas : 0)) +
          parseFloat(String(isGastosTercero == true ? totalGastosTercero : 0))) *
          (useEnterprisesStore().impuesto.impuesto as number)) /
        100;
    }

    // console.log(opcion.date_end);
    // console.log(opcion.tiempo_transito);
    // ----------------------------------------------------------------
    let totalServicios = 0;
    totalServicios =
      (isFlete == true ? totalFlete : 0) +
      (isOrigen == true ? totalOrigen : 0) +
      (isLocal == true ? totalLocales : 0) +
      (isAduana == true ? totalAduanas : 0) +
      (isAlmacen == true ? totalAlmacenes : 0) +
      (isGastosTercero == true ? totalGastosTercero : 0);
    /* GENERAR */
    const data = {
      nombre_impuesto: useEnterprisesStore().impuesto.nombre_impuesto,
      impuesto:
        listServices.value.filter((v) => v.code_service == 15).length > 0
          ? listServices.value.filter((v) => v.code_service == 15)[0]!.status == true ||
            listServices.value.filter((v) => v.code_service == 15)[0]!.status == 1
            ? imp
            : []
          : [],
      esunica: opcionCostos.value.filter((v) => v.selected).length == 1,
      url_logo: sessionUser().path,
      TipoCostos: TipoCostos,
      index: nro_propuesta,
      isImport: isImport,
      id_branch: sessionBranchId(),
      code: nro_quote.value,
      business_name: datosEmpresa.value[0]!.business_name ? datosEmpresa.value[0]!.business_name : "",
      nameEmpresa: sessionSucursal().trade_name,
      address: datosEmpresa.value[0]!.address,
      iso: datosEmpresa.value[0]!.iso_pais,
      iso_pais: datosEmpresa.value[0]!.iso_pais,
      document: datosEmpresa.value[0]!.document,
      phone: datosEmpresa.value[0]!.phone,
      pais: datosEmpresa.value[0]!.pais,
      tipo: tipo,
      cliente: datosPrincipales.value.nombre,
      slogancliente: datosPrincipales.value.slogan ? datosPrincipales.value.slogan : "",
      fechafin: opcion.date_end,
      tiempoTransito: opcion.tiempo_transito,
      origen:
        listPortBegin.value.filter((v) => v.id_port == datosPrincipales.value.idorigen).length > 0
          ? listPortBegin.value.filter((v) => v.id_port == datosPrincipales.value.idorigen)[0]!.name
          : "",
      destino:
        listPortEnd.value.filter((v) => v.id_port == datosPrincipales.value.iddestino).length > 0
          ? listPortEnd.value.filter((v) => v.id_port == datosPrincipales.value.iddestino)[0]!.name
          : "",

      flete: flete,
      almacen: almacen,
      aduana: aduana,
      local: locales,
      totalImpuesto: currencyFormat(parseFloat(String(totalImpuesto)).toFixed(2)),
      incluye: incluye,
      noincluye: noincluye,
      importante: importante,
      contenedor: contenedor,
      conceptos: conceptos,
      numerobultos: datosPrincipales.value.numerobultos,
      peso: datosPrincipales.value.peso,
      volumen: datosPrincipales.value.volumen,
      sentido: listModality.value.filter((v) => v.id == datosPrincipales.value.idsentido)[0]!.name,
      embarque: listShipment.value.filter(
        (v) =>
          v.id ==
          ((datosPrincipales.value.idtipocarga as TipoCarga).id
            ? (datosPrincipales.value.idtipocarga as TipoCarga).id
            : datosPrincipales.value.idtipocarga)
      )[0]!.embarque,
      icoterm: listIncoterms.value.filter((v) => v.id == datosPrincipales.value.idincoterms)[0]!.name,
      //
      datosFlete: isFlete == true ? datosFlete : [],
      datosOrigen: isOrigen == true ? datosOrigen : [],
      datosLocales: isLocal == true ? datosLocales : [],
      datosAduanas: isAduana == true ? datosAduanas : [],
      datosAlmacenes: isAlmacen == true ? datosAlmacenes : [],
      datosGastosTerceros: isGastosTercero == true ? datosGastosTerceros : [],

      totalImpuestosIGV: currencyFormat(totalImpuestosIGV),
      //
      totalFlete: isFlete == true ? currencyFormat(totalFlete) : currencyFormat(0),
      totalOrigen: isOrigen == true ? currencyFormat(totalOrigen) : currencyFormat(0),
      totalLocales: isLocal == true ? currencyFormat(totalLocales) : currencyFormat(0),
      totalAduanas: isAduana == true ? currencyFormat(totalAduanas) : currencyFormat(0),
      totalAlmacenes: isAlmacen == true ? currencyFormat(totalAlmacenes) : currencyFormat(0),
      totalGastosTercero: isGastosTercero == true ? currencyFormat(totalGastosTercero) : currencyFormat(0),
      totalServicios: currencyFormat(totalServicios),

      total: currencyFormat(
        parseFloat(String(totalServicios)) + parseFloat(String(totalImpuesto)) + parseFloat(String(totalImpuestosIGV))
      ),
      amount: datosPrincipales.value.amount,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    await axios
      // @ts-expect-error Kept: the headers object goes in as the request config, as before.
      .post<RespuestaArchivo>(import.meta.env.VITE_URL_MAIN + "quote_preview_totales", data, headers)
      .then((response) => {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });

        window.open(
          `${import.meta.env.VITE_URL_MAIN}${response.data.path}`,
          // "",
          "_blank"
        );
      })
      .catch((e) => console.log(e));
  }
  async function getInstructivoIdAduana({ id: id }: { id: number | string }): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getInstructivoIdAduana/" + id,
      headers: headers,
      data: data,
    };
    await axios<ApiResponse<InstructivoCotizacion[]>>(config)
      .then(function (response) {
        setInstructivo(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  function generaInstructivoAduana(): void {
    // -------------------------------------------------------
    listServiciosInstructivo.value = [];

    listServices.value.forEach((element) => {
      listServiciosInstructivo.value!.push({
        name: element.service,
        status: element.status == true ? "SI" : "NO",
      });
    });

    vendedor.value = listEjecutivo.value.filter((v) => v.id_entitie == datosPrincipales.value.id_pricing)[0]!.name;

    // console.log(state.opcionCostos)
    GenerarIngresosInstrictivo(tiporeporte.value);
    GenerarCostosInstrictivo(tiporeporte.value);
    GenerarImpInstructivo();
  }
  async function generaInstructivoparaguardataAduana(): Promise<void> {
    listIngresosInstructivoAprobar.value = [];
    const isImport = listModality.value.some((v) => v.id == datosPrincipales.value.idsentido && v.code == "I");
    let totalFleteVentas = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const igvIngresos = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const totalImpuestosIGV = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const montoIngresos = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const totalIngresos = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const igvCostos = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const montoCostos = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const totalCostos = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sentido = listInstructivo.value[0]!.sentido;
    console.log("state.id_pricing", datosPrincipales.value.id_pricing);
    vendedor.value = listEjecutivo.value.filter((v) => v.id_entitie == datosPrincipales.value.id_pricing)[0]!.name;

    vendedor.value = listEjecutivo.value.filter((v) => v.id_entitie == datosPrincipales.value.id_pricing)[0]!.name;

    // Usa for...of para iterar sobre las opciones de manera asíncrona
    for (const opcion of opcionCostos.value.filter((v) => !!v.selected)) {
      // Estas variables deben inicializarse dentro del bucle si son específicas para cada opción
      let igvIngresosOpcion = 0; // Renombradas para evitar confusión con las variables globales
      let totalImpuestosIGVOpcion = 0;
      let montoIngresosOpcion = 0;
      let totalIngresosOpcion = 0;
      let igvCostosOpcion = 0;
      let montoCostosOpcion = 0;
      let totalCostosOpcion = 0;
      let dataIngresos: LineaInstructivo[] = [];
      let dataCostos: LineaInstructivo[] = [];

      // Aquí es donde esperas la Promesa
      totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcion.listCostos);

      opcion.listCostos
        .filter((v) => v.esventaflag == 1 && v.status == 1)
        .forEach((element) => {
          let orden = 1;
          let name = "";

          let montoDetails = 0;
          const codePorcentaje = [5, 13, 14];
          if (
            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
              ? listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && !codePorcentaje.includes(v.code as number)
                )
              : false
          ) {
            montoDetails +=
              ((listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "N",
                datosPrincipales.value.volumen,
                datosPrincipales.value.peso,
                datosPrincipales.value.containers,
                datosPrincipales.value.amount
              ) as number);
          } else {
            montoDetails += calcularValor(
              datosPrincipales.value.amount,
              totalFleteVentas,
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                : "",
              listMultiplicador.value.some(
                (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
              )
                ? listMultiplicador.value.some(
                    (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }

          // Creando el agrupamiento
          if (element.esfleteflag == 1 && isImport) {
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "FL")[0]!.name : "";
            orden = 1;
          }
          if (element.esorigenflag == 1) {
            if (!isImport) {
              totalImpuestosIGVOpcion += parseFloat(String(montoDetails));
            }
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "OR")[0]!.name : "";
            orden = 2;
          }
          if (element.eslocalflag == 1) {
            totalImpuestosIGVOpcion += parseFloat(String(montoDetails));
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "LO")[0]!.name : "";
            orden = 3;
          }
          if (element.esaduanaflag == 1) {
            totalImpuestosIGVOpcion += parseFloat(String(montoDetails));
            orden = 4;
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "AD")[0]!.name : "";
          }
          if (element.esfleteflag == 1 && !isImport) {
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "FL")[0]!.name : "";
            orden = 5;
          }
          if (element.esalmacenflag == 1) {
            if (isImport) {
              totalImpuestosIGVOpcion += parseFloat(String(montoDetails));
            }
            orden = 6;
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "AL")[0]!.name : "";
          }
          dataIngresos.push({
            descripcion: name,
            service: element.nameservice,
            valor: montoDetails,
            orden: orden,
            igv: 0,
            total: montoDetails,
          });

          igvIngresosOpcion += parseFloat(String(0));
          montoIngresosOpcion += parseFloat(String(montoDetails));
          totalIngresosOpcion += parseFloat(String(montoDetails));
        });

      opcion.listCostos
        .filter((v) => v.esopcionflag == 1 && v.status == 1)
        .forEach((element) => {
          let orden = 1;
          let name = "";
          // Creando el agrupamiento
          if (element.esfleteflag == 1 && isImport) {
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "FL")[0]!.name : "";
            orden = 1;
          }
          if (element.esorigenflag == 1) {
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "OR")[0]!.name : "";
            orden = 2;
          }
          if (element.eslocalflag == 1) {
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "LO")[0]!.name : "";
            orden = 3;
          }
          if (element.esaduanaflag == 1) {
            orden = 4;
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "AD")[0]!.name : "";
          }
          if (element.esfleteflag == 1 && !isImport) {
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "FL")[0]!.name : "";
            orden = 5;
          }
          if (element.esalmacenflag == 1) {
            orden = 6;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            name = listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "AL")[0]!.name : "";
          }

          let montoDetails = 0;
          if (
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
              : false
          ) {
            montoDetails +=
              ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "N",
                datosPrincipales.value.volumen,
                datosPrincipales.value.peso,
                datosPrincipales.value.containers,
                datosPrincipales.value.amount
              ) as number);
          } else {
            montoDetails += calcularValor(
              datosPrincipales.value.amount,
              totalFleteVentas,
              listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                : "",
              listMultiplicador.value.some(
                (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
              )
                ? listMultiplicador.value.some(
                    (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
          dataCostos.push({
            proveedor: useAppStore().provedores.filter((v: ProveedorPricing) => v.id == element.id_proveedor)[0]!
              .namelong,
            service: element.nameservice,
            valor: montoDetails,
            orden: orden,
            igv: 0,
            total: montoDetails,
            id: useAppStore().provedores.filter((v: ProveedorPricing) => v.id == element.id_proveedor)[0]!.id,
          });
          igvCostosOpcion += 0;
          montoCostosOpcion += parseFloat(String(montoDetails));
          totalCostosOpcion += parseFloat(String(montoDetails));
        });

      // @ts-expect-error Kept: equal rows make the comparator return undefined, as before.
      dataIngresos = dataIngresos.sort((a, b) => {
        if ((a.orden as number) < (b.orden as number)) return -1;
        if ((a.orden as number) > (b.orden as number)) return 1;
      });
      // ------------------------------------------------ dataIngresos
      const resultIngresos = [];
      let currentProviderIngresos = null;
      let subvalorIngresos = 0;
      let subtotalIngresos = 0;
      let subigvIngresos = 0;

      for (const item of dataIngresos) {
        if (currentProviderIngresos === null) {
          currentProviderIngresos = item.descripcion;
          subvalorIngresos += item.valor as number;
          subtotalIngresos += item.total as number;
          subigvIngresos += 0;
        } else if (currentProviderIngresos === item.descripcion) {
          subvalorIngresos += item.valor as number;
          subtotalIngresos += item.total as number;
          subigvIngresos += 0;
        } else {
          // Agregar la fila de subtotal
          resultIngresos.push({
            descripcion: "SubTotal",
            service: "",
            valor: subvalorIngresos,
            igv: 0,
            total: subtotalIngresos,
          });

          // Reiniciar para el nuevo proveedor
          currentProviderIngresos = item.descripcion;
          subvalorIngresos = item.valor as number;
          subtotalIngresos = item.total as number;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          subigvIngresos = 0;
        }

        // Agregar el elemento actual
        resultIngresos.push(item);
      }
      resultIngresos.push({
        descripcion: "SubTotal",
        service: "",
        valor: subvalorIngresos,
        igv: 0,
        total: subtotalIngresos,
      });
      dataIngresos = resultIngresos;

      // ------------------------------------------------
      // @ts-expect-error Kept: equal rows make the comparator return undefined, as before.
      dataCostos = dataCostos.sort((a, b) => {
        if ((a.proveedor as string) < (b.proveedor as string)) return -1;
        if ((a.proveedor as string) > (b.proveedor as string)) return 1;
      });
      //---------------------------------------------------

      const result = [];
      let id = null;
      let currentProvider = null;
      let subtotal = 0;
      let valor = 0;
      let igv = 0;
      for (const item of dataCostos) {
        if (currentProvider === null) {
          id = item.id;
          currentProvider = item.proveedor;
          valor += item.valor as number;
          subtotal += item.total as number;
          igv += 0;
        } else if (currentProvider === item.proveedor) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          id = item.id;
          valor += item.valor as number;
          subtotal += item.total as number;
          igv += 0;
        } else {
          // Agregar la fila de subtotal
          result.push({
            id: "",
            proveedor: "SubTotal",
            service: "",
            valor: valor,
            orden: 1,
            igv: 0,
            total: subtotal,
          });

          // Reiniciar para el nuevo proveedor

          currentProvider = item.proveedor;
          valor = item.valor as number;
          subtotal = item.total as number;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          igv = 0;
        }

        // Agregar el elemento actual
        result.push(item);
      }
      result.push({
        id: "",
        proveedor: "SubTotal",
        service: "",
        valor: valor,
        orden: 1,
        igv: "",
        total: subtotal,
      });
      dataCostos = result;
      //---------------------------------------------------
      const iso = sessionIsoPais();

      dataIngresos.push({
        descripcion: `TOTAL`,
        valor: parseFloat(String(montoIngresosOpcion)).toFixed(2),
        service: `Total sin ${useEnterprisesStore().impuesto.nombre_impuesto} ${currencyFormat(
          parseFloat(String(totalIngresosOpcion)).toFixed(2)
        )}      |      ${useEnterprisesStore().impuesto.nombre_impuesto}: ${currencyFormat(
          parseFloat(
            String((totalImpuestosIGVOpcion * (useEnterprisesStore().impuesto.impuesto as number)) / 100)
          ).toFixed(2)
        )} `,
        igv: parseFloat(String(igvIngresosOpcion)).toFixed(2),
        total:
          iso == 9589
            ? parseFloat(String(totalIngresosOpcion)) +
              parseFloat(String((totalImpuestosIGVOpcion * (useEnterprisesStore().impuesto.impuesto as number)) / 100))
            : parseFloat(String(totalIngresosOpcion)),
      });
      dataCostos.push({
        proveedor: "TOTAL",
        valor: parseFloat(String(montoCostosOpcion)).toFixed(2),
        igv: parseFloat(String(igvCostosOpcion)).toFixed(2),
        total: parseFloat(String(montoCostosOpcion)).toFixed(2),
      });

      listIngresosInstructivoAprobar.value.push({
        nro_propuesta: opcion.nro_propuesta,
        dataIngresos: dataIngresos,
        dataCostos: dataCostos,
        totalIngresos: totalIngresosOpcion,
        totalCostos: totalCostosOpcion,
        dataVentas: dataIngresos,
      });
    }
  }

  async function calcularTotalFleteVentaPorOpcion(data: Costo[]): Promise<number> {
    let totalFlete = 0;
    data
      .filter((v) => v.esfleteflag == 1 && v.status == 1 && v.esventaflag == 1)
      .forEach(async (element) => {
        if (isNotPorcentaje(element, element.id_multiplicador)) {
          totalFlete +=
            ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
              : 0) as number) *
            (element.costounitario as number) *
            (calcularFac(
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                : "N",
              datosPrincipales.value.volumen,
              datosPrincipales.value.peso,
              datosPrincipales.value.containers,
              datosPrincipales.value.amount
            ) as number);
        }
      });
    return totalFlete;
  }

  function isNotPorcentaje(element: Costo, id_multiplicador: Costo["id_multiplicador"]): boolean {
    const code = [5, 13, 14];

    const mul = listMultiplicador.value.some((v) => v.id == id_multiplicador && code.includes(v.code as number));

    return !mul;
  }

  function GenerarIngresosInstrictivo(tipo: string | undefined): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const iso = sessionIsoPais();
    const isImport = listModality.value.some((v) => v.id == datosPrincipales.value.idsentido && v.code == "I");
    opcionCostos.value
      .filter((v) => !!v.selected)
      .forEach(async (opcion) => {
        let totalFleteVentas = 0;
        const isFlete = opcion.listCostos.some((v) => v.esfleteflag == 1 && v.status == true);
        const isOrigen = opcion.listCostos.some((v) => v.esorigenflag == 1 && v.status == true);
        const isLocal = opcion.listCostos.some((v) => v.eslocalflag == 1 && v.status == true);
        const isAduana = opcion.listCostos.some((v) => v.esaduanaflag == 1 && v.status == true);
        const isAlmacen = opcion.listCostos.some((v) => v.esalmacenflag == 1 && v.status == true);
        const isGastosTercero = opcion.listCostos.some((v) => v.esgastostercerosflag == 1 && v.status == true);
        totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcion.listCostos);
        /** AGRUPADO */
        const conceptos: { name?: string }[] = [];
        /** !AGRUPADO */
        const datosFlete: LineaReporte[] = [];
        const datosOrigen: LineaReporte[] = [];
        const datosLocales: LineaReporte[] = [];
        const datosAduanas: LineaReporte[] = [];
        const datosAlmacenes: LineaReporte[] = [];
        const datosGastosTerceros: LineaReporte[] = [];
        // SON LOS COSTOS
        let totalFlete = 0;
        let totalOrigen = 0;
        let totalLocales = 0;
        let totalAduanas = 0;
        let totalAlmacenes = 0;
        let totalGastosTercero = 0;
        if (tipo == "AGRUPADO") {
          // state.listCostos
          opcion.listCostos
            .filter((v) => v.status == 1 && v.esventaflag == 1)
            .forEach((element) => {
              if (element.esfleteflag == 1) {
                datosFlete.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : 0
                ) {
                  totalFlete +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalFlete += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esorigenflag == 1) {
                datosOrigen.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : 0
                ) {
                  totalOrigen +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalOrigen += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.eslocalflag == 1) {
                datosLocales.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  totalLocales +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalLocales += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esaduanaflag == 1) {
                datosAduanas.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  totalAduanas +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalAduanas += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esalmacenflag == 1) {
                datosAlmacenes.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  totalAlmacenes +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalAlmacenes += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esgastostercerosflag == 1) {
                datosGastosTerceros.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  totalGastosTercero +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalGastosTercero += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
            });
          if (isFlete == true) {
            opcion.listCostos
              .filter((v) => v.status == 1 && v.esorigenflag == 1 && v.esventaflag == 1)
              .forEach((element) => {
                if (conceptos.filter((v) => v.name == element.nameservice)) {
                  conceptos.push({
                    name: element.nameservice,
                  });
                }
              });
          }

          if (isLocal == true) {
            opcion.listCostos
              .filter((v) => v.status == 1 && v.eslocalflag == 1 && v.esventaflag == 1)
              .forEach((element) => {
                if (conceptos.filter((v) => v.name == element.nameservice)) {
                  conceptos.push({
                    name: element.nameservice,
                  });
                }
              });
          }
          if (isAduana == true) {
            opcion.listCostos
              .filter((v) => v.status == 1 && v.esaduanaflag == 1 && v.esventaflag == 1)
              .forEach((element) => {
                if (conceptos.filter((v) => v.name == element.nameservice)) {
                  conceptos.push({
                    name: element.nameservice,
                  });
                }
              });
          }
          if (isAlmacen == true) {
            opcion.listCostos
              .filter((v) => v.status == 1 && v.esalmacenflag == 1 && v.esventaflag == 1)
              .forEach((element) => {
                if (conceptos.filter((v) => v.name == element.nameservice)) {
                  conceptos.push({
                    name: element.nameservice,
                  });
                }
              });
          }
          if (isGastosTercero == true) {
            opcion.listCostos
              .filter((v) => v.status == 1 && v.esgastostercerosflag == 1 && v.esventaflag == 1)
              .forEach((element) => {
                if (conceptos.filter((v) => v.name == element.nameservice)) {
                  conceptos.push({
                    name: element.nameservice,
                  });
                }
              });
          }
        }
        if (tipo == "DETALLE") {
          opcion.listCostos
            .filter((v) => v.status == 1 && v.esventaflag == 1)
            .forEach((element) => {
              if (element.esfleteflag == 1) {
                if (
                  listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  datosFlete.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      (listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number)
                    ),
                  });
                  totalFlete +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  datosFlete.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      )
                    ),
                  });
                  totalFlete += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esorigenflag == 1) {
                if (
                  listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  datosOrigen.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      (listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number)
                    ),
                  });
                  totalOrigen +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  datosOrigen.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      )
                    ),
                  });
                  totalOrigen += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }

              if (element.eslocalflag == 1) {
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  datosLocales.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                        : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number)
                    ),
                  });
                  totalLocales +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  datosLocales.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      )
                    ),
                  });
                  totalLocales += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }

              if (element.esaduanaflag == 1) {
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  datosAduanas.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                        : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number)
                    ),
                  });
                  totalAduanas +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  datosAduanas.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      )
                    ),
                  });
                  totalAduanas += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }

              if (element.esalmacenflag == 1) {
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  datosAlmacenes.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                        : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number)
                    ),
                  });
                  totalAlmacenes +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  datosAlmacenes.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      )
                    ),
                  });
                  totalAlmacenes += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esgastostercerosflag == 1) {
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  datosGastosTerceros.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                        : 0) as number) *
                        (element.costounitario as number) *
                        (calcularFac(
                          listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                            ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                            : "N",
                          datosPrincipales.value.volumen,
                          datosPrincipales.value.peso,
                          datosPrincipales.value.containers,
                          datosPrincipales.value.amount
                        ) as number)
                    ),
                  });
                  totalGastosTercero +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  datosGastosTerceros.push({
                    name: element.nameservice,
                    valor: currencyFormat(
                      calcularValor(
                        datosPrincipales.value.amount,
                        totalFleteVentas,
                        listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                          ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                          : "",
                        listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                        )
                          ? listMultiplicador.value.some(
                              (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                            )
                            ? element.cif
                            : element.seguro
                          : 0
                      )
                    ),
                  });
                  totalGastosTercero += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
            });
        }
        if (tipo == "TOTAL") {
          opcion.listCostos
            .filter((v) => v.status == 1 && v.esventaflag == 1)
            .forEach((element) => {
              if (element.esfleteflag == 1) {
                datosFlete.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  totalFlete +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalFlete += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esorigenflag == 1) {
                datosOrigen.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  totalOrigen +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalOrigen += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }

              if (element.eslocalflag == 1) {
                datosLocales.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  totalLocales +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalLocales += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }

              if (element.esaduanaflag == 1) {
                datosAduanas.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                    : false
                ) {
                  totalAduanas +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalAduanas += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }

              if (element.esalmacenflag == 1) {
                datosAlmacenes.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  totalAlmacenes +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalAlmacenes += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
              if (element.esgastostercerosflag == 1) {
                datosGastosTerceros.push({
                  name: element.nameservice,
                  valor: "",
                });
                if (
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                ) {
                  totalGastosTercero +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (calcularFac(
                      listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                        ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                        : "N",
                      datosPrincipales.value.volumen,
                      datosPrincipales.value.peso,
                      datosPrincipales.value.containers,
                      datosPrincipales.value.amount
                    ) as number);
                } else {
                  totalGastosTercero += calcularValor(
                    datosPrincipales.value.amount,
                    totalFleteVentas,
                    listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "",
                    listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                    )
                      ? listMultiplicador.value.some(
                          (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                        )
                        ? element.cif
                        : element.seguro
                      : 0
                  );
                }
              }
            });
        }
        const DatosFinalesIngresos: LineaInstructivo[] = [];
        if (tipo == "AGRUPADO") {
          DatosFinalesIngresos.push({
            descripcion: "CONCEPTOS DE INGRESOS",
            service: "",
            igv: "",
            total: "",
          });
        }
        if (datosFlete.length > 0 && isImport) {
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion:
                listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "FL")[0]!.name : "",
              service: "",
              igv: "",
              total: "",
            });
          }
          datosFlete.forEach((element) => {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: element.name,
              igv: "",
              total: element.valor,
            });
          });
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: "SubTotal",
              igv: "",
              total: currencyFormat(parseFloat(String(totalFlete)).toFixed(2)),
            });
          }
        }
        if (datosOrigen.length > 0) {
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion:
                listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "OR")[0]!.name : "",
              service: "",
              igv: "",
              total: "",
            });
          }
          datosOrigen.forEach((element) => {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: element.name,
              igv: "",
              total: element.valor,
            });
          });
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: "SubTotal",
              igv: "",
              total: currencyFormat(parseFloat(String(totalOrigen)).toFixed(2)),
            });
          }
        }
        // ------------------------------------------------
        if (datosLocales.length > 0) {
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion:
                listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "LO")[0]!.name : "",
              service: "",
              total: "",
            });
          }
          datosLocales.forEach((element) => {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: element.name,
              total: element.valor,
            });
          });
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: "SubTotal",
              total: currencyFormat(parseFloat(String(totalLocales)).toFixed(2)),
            });
          }
        }
        // ------------------------------------------------
        if (datosAduanas.length > 0) {
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion:
                listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "AD")[0]!.name : "",
              service: "",
              total: "",
            });
          }
          datosAduanas.forEach((element) => {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: element.name,
              total: element.valor,
            });
          });
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: "SubTotal",
              total: currencyFormat(parseFloat(String(totalAduanas)).toFixed(2)),
            });
          }
        }
        // ------------------------------------------------
        if (datosFlete.length > 0 && !isImport) {
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion:
                listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "FL")[0]!.name : "",
              service: "",
              igv: "",
              total: "",
            });
          }
          datosFlete.forEach((element) => {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: element.name,
              igv: "",
              total: element.valor,
            });
          });
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: "SubTotal",
              igv: "",
              total: currencyFormat(parseFloat(String(totalFlete)).toFixed(2)),
            });
          }
        }
        if (datosAlmacenes.length > 0) {
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion:
                listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "AL")[0]!.name : "",
              service: "",
              total: "",
            });
          }
          datosAlmacenes.forEach((element) => {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: element.name,
              total: element.valor,
            });
          });
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: "SubTotal",
              total: currencyFormat(parseFloat(String(totalAlmacenes)).toFixed(2)),
            });
          }
        }
        if (datosGastosTerceros.length > 0) {
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion:
                listTipoCostos.value.length > 0 ? listTipoCostos.value.filter((v) => v.codigo == "GT")[0]!.name : "",
              service: "",
              total: "",
            });
          }
          datosGastosTerceros.forEach((element) => {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: element.name,
              total: element.valor,
            });
          });
          if (tipo != "AGRUPADO") {
            DatosFinalesIngresos.push({
              descripcion: "",
              service: "SubTotal",
              total: currencyFormat(parseFloat(String(totalAlmacenes)).toFixed(2)),
            });
          }
        }
        const totalSinIGV =
          parseFloat(String(totalFlete)) +
          parseFloat(String(totalOrigen)) +
          parseFloat(String(totalLocales)) +
          parseFloat(String(totalAduanas)) +
          parseFloat(String(totalGastosTercero)) +
          parseFloat(String(totalAlmacenes));

        let igv = 0;

        if (!!isImport) {
          igv =
            ((parseFloat(String(isLocal == true ? totalLocales : 0)) +
              parseFloat(String(isAduana == true ? totalAduanas : 0)) +
              parseFloat(String(isGastosTercero == true ? totalGastosTercero : 0)) +
              parseFloat(String(isAlmacen == true ? totalAlmacenes : 0))) *
              (useEnterprisesStore().impuesto.impuesto as number)) /
            100;
        } else {
          igv =
            ((parseFloat(String(isOrigen == true ? totalOrigen : 0)) +
              parseFloat(String(isLocal == true ? totalLocales : 0)) +
              parseFloat(String(isGastosTercero == true ? totalGastosTercero : 0)) +
              parseFloat(String(isAduana == true ? totalAduanas : 0))) *
              (useEnterprisesStore().impuesto.impuesto as number)) /
            100;
        }

        DatosFinalesIngresos.push({
          descripcion: "TOTAL",
          service: `TOTAL SIN ${useEnterprisesStore().impuesto.nombre_impuesto}: ${currencyFormat(totalSinIGV)}`,
          igv: `${useEnterprisesStore().impuesto.nombre_impuesto} ${currencyFormat(parseFloat(String(igv)))}`,
          total: currencyFormat(parseFloat(String(totalSinIGV)) + parseFloat(String(igv))),
        });

        listIngresosInstructivo.value.push({
          totalIngresos: parseFloat(String(totalSinIGV)),
          opcion: DatosFinalesIngresos,
          nro_propuesta: opcion.nro_propuesta,
        });
        // state.totalIngresos = parseFloat(totalSinIGV);
        // state.listIngresosInstructivo.push(DatosFinalesIngresos);
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function GenerarCostosInstrictivo(tipo: string | undefined): Promise<void> {
    opcionCostos.value
      .filter((v) => !!v.selected)
      .forEach(async (opcion) => {
        const dataCostos: LineaInstructivo[] = [];
        const totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcion.listCostos);
        opcion.listCostos
          .filter((v) => v.esopcionflag == 1 && v.status == 1)
          .forEach((element) => {
            // ------------------------------------

            let montoDetails = 0;
            if (
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 5 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 13 &&
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code != 14
                : false
            ) {
              montoDetails +=
                ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                  : 0) as number) *
                (element.costounitario as number) *
                (calcularFac(
                  listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                    ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                    : "N",
                  datosPrincipales.value.volumen,
                  datosPrincipales.value.peso,
                  datosPrincipales.value.containers,
                  datosPrincipales.value.amount
                ) as number);
            } else {
              montoDetails += calcularValor(
                datosPrincipales.value.amount,
                totalFleteVentas,
                listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "",
                listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13 || v.code == 5)
                )
                  ? listMultiplicador.value.some(
                      (v) => v.id == element.id_multiplicador && (v.code == 14 || v.code == 13)
                    )
                    ? element.cif
                    : element.seguro
                  : 0
              );
            }
            dataCostos.push({
              proveedor: useAppStore().provedores.filter((v: ProveedorPricing) => v.id == element.id_proveedor)[0]!
                .namelong,
              service: element.nameservice,
              valor: montoDetails,
            });
          });
        let total = 0;
        const DatosFinalesCostos: LineaInstructivo[] = [];
        const proveedoresUnicos = new Set(dataCostos.map((item) => item.proveedor));

        // Convertimos el Set a un array
        const proveedores = Array.from(proveedoresUnicos);

        proveedores.forEach((proveedor) => {
          let totalPorProveedor = 0;
          DatosFinalesCostos.push({
            proveedor: proveedor,
            service: "",
            igv: "",
            total: "",
          });
          dataCostos
            .filter((v) => v.proveedor == proveedor)
            .forEach((costo) => {
              total += costo.valor as number;
              totalPorProveedor += costo.valor as number;
              DatosFinalesCostos.push({
                proveedor: "",
                service: costo.service,
                total: currencyFormat(costo.valor!),
              });
            });
          DatosFinalesCostos.push({
            proveedor: "",
            service: "SubTotal",
            igv: "",
            total: currencyFormat(totalPorProveedor),
          });
        });
        DatosFinalesCostos.push({
          proveedor: "TOTAL",
          service: "",
          igv: "",
          total: currencyFormat(total),
        });

        totalCostos.value = total;
        // state.listCostosInstructivo = DatosFinalesCostos;
        listCostosInstructivo.value.push({
          totalCostos: total,
          opcion: DatosFinalesCostos,
          nro_propuesta: opcion.nro_propuesta,
        });
      });
  }

  function GenerarImpInstructivo() {
    let totalFleteVentas = 0;
    const impuestoflag = listServices.value.some((v) => v.code_service == 15 && v.status == 1);
    if (impuestoflag) {
      let totalImpuesto = 0;
      const codeCalc = ["05", "06", "07", "08", "09", "10", "11", "12"];
      opcionCostos.value
        .filter((v) => !!v.selected)
        .forEach(async (opcion) => {
          const impuestos = [];
          await opcion.listImpuestos
            .filter((v) => codeCalc.includes(v.codigo as string))
            .forEach(async (element) => {
              totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcion.listCostos);
              impuestos.push({
                type: element.codigo,
                name: element.descripcion,
                percentage: element.codigo01 ? `${element.codigo01} %` : "0 %",
                valor: currencyFormat(
                  calcularImpuestos({
                    impuestos: opcion.listImpuestos,
                    item: element,
                    totalFlete: totalFleteVentas,
                    datosPrincipales: datosPrincipales.value,
                  })
                ),
              });

              totalImpuesto += parseFloat(
                calcularImpuestos({
                  impuestos: opcion.listImpuestos,
                  item: element,
                  totalFlete: totalFleteVentas,
                  datosPrincipales: datosPrincipales.value,
                })
              );
            });

          impuestos.push({
            type: "",
            name: "TOTAL",
            percentage: "",
            valor: currencyFormat(totalImpuesto),
          });
          totalImpuesto = 0;
          listImpuestosInstructivo.value.push({
            nro_propuesta: opcion.nro_propuesta,
            opcion: impuestos,
          });
        });
    }
    // console.log(state.listImpuestosInstructivo);
  }
  return {
    IdQuote,
    datosEmpresa,
    totalCosto,
    totalCostos,
    nro_quote,
    mensaje,
    actualizarComparativa,
    filtro,
    mostrarGuardarCostos,
    index,
    cantidadOpcionesSeleccionadas,
    tab,
    page,
    llenadoCostos,
    datosPrincipales,
    opcionCostos,
    listPortEnd,
    listPortBegin,
    preServices,
    listServices,
    preCostos,
    listTipoCostos,
    namesection,
    listMultiplicador,
    copylistServices,
    listCostos,
    listImpuestos,
    listModality,
    listShipment,
    listIncoterms,
    listQuotes,
    listQuotes2,
    listNotasQuote,
    filtroCalls,
    listIngresosInstructivoAprobar,
    listIngresosInstructivo,
    listCostosInstructivo,
    listImpuestosInstructivo,
    listInstructivo,
    listEjecutivo,
    totalVenta,
    id,
    vendedor,
    totalFlete,
    tiporeporte,
    copy_quote,
    aprobadoflag,
    fullflag,
    mostrarBtnActualizarFlag,
    listServiciosInstructivo,
    recargarCostoSeleccionados,
    cancelarLlenadoNuevaOpcion,
    actualizarCostosFlag,
    abrirModalContenedor,
    costoflag,
    actualizarNotas,
    bloquearBtnImprimir,
    ventaflag,
    reset,
    urlFolder,
    begEndList,
    errorValorMercancia,
    step,
    step2,
    step3,
    btnRegistrar,
    e1,
    fecha_inicio,
    errfecha_fin,
    errtiempo_transito,
    ListarMontosFinalesAduanaMONGODB,
    GuardaCostosFinalesAduana,
    getPersonalPricingAduana,
    aprobarCotizacionAduana,
    getServicesAduana,
    cargarListadoQuoteAduana,
    getCotizacionUnificar,
    getAduanaUnificar,
    getItemsServices,
    obtenerCostosAduana,
    getMultiplicadorAduana,
    getTipoCostosAduana,
    predataAduana,
    getModalityAduana,
    obtenerDatosEmpresaAduana,
    getPortBeginAduana,
    getPortEndAduana,
    getShipmentAduana,
    getIncotermsAduana,
    registrarAduana,
    getListQuoteAduana,
    getAdunaVer,
    actualizarQuoteAduana,
    getCargarMasterDetalleNotasCotizacionAduana,
    unificarQuoteAduana,
    actualizarAduanaRecibidoEnviado,
    guardarNotaAduana,
    getQuoteCallAduana,
    generarReporteAduana,
    getInstructivoIdAduana,
    generaInstructivoAduana,
    generaInstructivoparaguardataAduana,
  };
});
