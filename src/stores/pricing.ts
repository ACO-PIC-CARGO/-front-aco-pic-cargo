import { defineStore } from "pinia";
import { ref } from "vue";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useAduanaStore } from "@/stores/aduana";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useFilesStore } from "@/stores/files";
import { useHousesStore } from "@/stores/houses";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { ApiResponse } from "@/types/api";
import type { Begend, Marketing, Modalidad } from "@/types/catalogos";
import type {
  AprobacionCotizacion,
  ArchivoDrive,
  CambioIncoterms,
  ClienteCotizacion,
  Costo,
  CostoServicioDetalle,
  CotizacionCopiada,
  CotizacionDetalle,
  CotizacionHouse,
  CotizacionListado,
  DatosInstructivoManual,
  DatosPrevisualizacion,
  DatosPrincipales,
  EjecutivoCotizacion,
  EmpresaCotizacion,
  EstadoCotizacion,
  EstadoServicioReporte,
  FiltroCotizaciones,
  FiltroPuertos,
  FiltrosReporte,
  Impuesto,
  ImpuestoReporte,
  Incoterm,
  IngresoInstructivoAprobar,
  LineaInstructivo,
  LineaReporte,
  InstructivoCotizacion,
  LlamadaCotizacion,
  MasterAprobado,
  Multiplicador,
  Nota,
  Numerico,
  OpcionCosto,
  OpcionesReporte,
  OpcionInstructivo,
  ParametrosTextoWhatsapp,
  Puerto,
  RespuestaArchivo,
  RespuestaRegistroCotizacion,
  ResumenEstadoCotizacion,
  RolModulo,
  RolModuloCotizacion,
  Servicio,
  ServicioInstructivo,
  ServicioPredeterminado,
  TextoWhatsappCotizacion,
  TipoCarga,
} from "@/types/cotizacion";
import type { TipoCostoConfig } from "@/types/empresas";
import type { ProveedorPricing, TipoTransaccion } from "@/types/entidades";
import {
  calcularImpuestos,
  calcularValor,
  currencyFormat,
  formatImp,
  formatearContainer,
  formatearNotas,
  formatearServicios,
} from "@/utils/cotizacion";
import { quoteFilterDatesAtAppLoad } from "@/utils/appLoad";
import { sessionBranchId, sessionIsoPais, sessionSucursal, sessionUser, sessionUserIdOrEmpty } from "@/utils/sesion";

export const usePricingStore = defineStore("pricing", () => {
  const {
    calcularFac,
    calcularTotalFleteVentaPorOpcion: calcularTotalFleteVenta,
    formatearCostos,
    formatearCostosEditar,
  } = useCotizacionCalculos();
  const search = ref<string>("");
  const totalregistro = ref<number>(1);
  const limit = ref<number>(10);
  const pagina = ref<number>(1);
  const dataCliente = ref<ClienteCotizacion>({});
  const step = ref<number>(1);
  const id_master = ref<number | string | null>("");
  const nro_exp = ref<string | null>("");
  const preServices = ref<ServicioPredeterminado[]>([]);
  const preCostos = ref<Costo[]>([]);
  const itemsDataRoleList = ref<unknown[]>([]);
  const listadoResumen = ref<ResumenEstadoCotizacion[]>([]);
  const listadoFilesDrive = ref<ArchivoDrive[]>([]);
  const selectedFile = ref<ArchivoDrive[]>([]);
  const actualizarCostosFlag = ref(true);
  const costoflag = ref(false);
  const impuestoflag = ref(false);
  const mostrarBtnActualizarFlag = ref(true);
  const bloquearBtnImprimir = ref(true);
  const vendedor = ref("");
  const aprobadoflag = ref(false);
  const totalIngresos = ref(0);
  const totalCostos = ref(0);
  const totalIngresosAprobar = ref<unknown[]>([]);
  const totalCostosAprobar = ref<unknown[]>([]);
  const tiporeporte = ref("");
  const abrirModalContenedor = ref(false);
  const index = ref(0);
  const cantidadOpcionesSeleccionadas = ref(0);
  const tab = ref(1);
  const llenadoCostos = ref(true);
  const actualizarComparativa = ref(false);
  const mostrarGuardarCostos = ref(false);
  const actualizarNotas = ref(false);
  const cancelarLlenadoNuevaOpcion = ref(false);
  const recargarCostoSeleccionados = ref(false);
  const reCalcularOpciones = ref(false);
  const reset = ref(false);
  const namesection = ref<TipoCostoConfig[]>([]);
  const page = ref(1);
  const nombre_cotizacion = ref("");
  const filtro = ref<FiltroCotizaciones>({
    fechainicio: quoteFilterDatesAtAppLoad.fechainicio,
    fechafin: quoteFilterDatesAtAppLoad.fechafin,
    tipopdf: 1,
  });
  const filtroCalls = ref<FiltroCotizaciones>({
    fechainicio: quoteFilterDatesAtAppLoad.fechainicio,
    fechafin: quoteFilterDatesAtAppLoad.fechafin,
    tipopdf: 1,
  });
  const ventaflag = ref(false);
  const dataQuote = ref<CotizacionHouse | [] | null>(null);
  const filtrarQuoteFlag = ref(false);
  const filtrarCallsFlag = ref(false);
  const btnRegistrar = ref(false);
  const step2 = ref(false);
  const step3 = ref(false);
  const errfecha_fin = ref("");
  const errtiempo_transito = ref("");
  const id = ref<number | string>("");
  const nro_quote = ref("");
  const urlFolder = ref("");
  const mensaje = ref("");
  const copy_quote = ref<CotizacionDetalle | null>(null);
  const copylistServices = ref<Servicio[] | null>(null);
  const copylistCostos = ref<Costo[] | null>(null);
  const copydatosPrincipales = ref<DatosPrincipales>({});
  const datosPrincipales = ref<DatosPrincipales>({
    id_percepcionaduana: "",
    id_marketing: "",
    id_status: "",
    id_proveedor: "",
    id_vendedor: sessionUserIdOrEmpty(),
    id_pricing: sessionUserIdOrEmpty(),
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
    datosInstructivoManual: null,
    esindividualflag: true,
    esgrupalflag: false,
  });
  const opcionCostos = ref<OpcionCosto[]>([
    {
      nro_propuesta: 1,
      date_end: moment().add(7, "days").format("YYYY-MM-DD"),
      tiempo_transito: 35,
      listCostos: [],
      listImpuestos: [],
      listNotasQuote: [],
      selected: false,
    },
  ]);
  const datosEmpresa = ref<EmpresaCotizacion[]>([]);
  const listQuotes = ref<CotizacionListado[]>([]);
  const listCall = ref<LlamadaCotizacion[]>([]);
  const listMarketing = ref<Marketing[]>([]);
  const listQuoteStatus = ref<EstadoCotizacion[]>([]);
  const listEjecutivo = ref<EjecutivoCotizacion[]>([]);
  const listModality = ref<Modalidad[]>([]);
  const listShipment = ref<TipoCarga[]>([]);
  const listIncoterms = ref<Incoterm[]>([]);
  const listPortBegin = ref<Puerto[]>([]);
  const listPortEnd = ref<Puerto[]>([]);
  const listServices = ref<Servicio[]>([]);
  const listCostos = ref<Costo[]>([]);
  const listMultiplicador = ref<Multiplicador[]>([]);
  const listRoles = ref<RolModuloCotizacion[]>([]);
  const errorValorMercancia = ref("");
  const totalFlete = ref(0);
  const listNotasQuote = ref<Nota[]>([]);
  const totalCosto = ref(0);
  const totalVenta = ref(0);
  const listImpuestos = ref<Impuesto[]>([]);
  const listInstructivo = ref<InstructivoCotizacion[]>([]);
  const listRecibidoCotizacion = ref<TipoTransaccion[]>([]);
  const listEnviadoCliente = ref<TipoTransaccion[]>([]);
  const listIngresosInstructivoAprobar = ref<IngresoInstructivoAprobar[]>([]);
  const listCostosInstructivoAprobar = ref<unknown[]>([]);
  const listServiciosInstructivo = ref<ServicioInstructivo[]>([]);
  const listImpuestosInstructivoAprobar = ref<unknown[]>([]);
  const listTipoCostos = ref<TipoCostoConfig[]>([]);
  const listIngresosInstructivo = ref<OpcionInstructivo[]>([]);
  const listCostosInstructivo = ref<OpcionInstructivo[]>([]);
  const listImpuestosInstructivo = ref<OpcionInstructivo[]>([]);
  const textWhatsapp = ref<TextoWhatsappCotizacion[]>([]);
  const e1 = ref(1);
  const filtroSeleccionado = ref<unknown[]>([]);
  const begEndList = ref<Begend[]>();
  const fullflag = ref<boolean | number>();

  function SET_RESET(): void {
    preServices.value = [];
    preCostos.value = [];
    itemsDataRoleList.value = [];
    listadoResumen.value = [];
    actualizarCostosFlag.value = true;
    costoflag.value = false;
    impuestoflag.value = false;
    mostrarBtnActualizarFlag.value = true;
    bloquearBtnImprimir.value = true;
    vendedor.value = "";
    aprobadoflag.value = false;
    totalIngresos.value = 0;
    totalCostos.value = 0;
    totalIngresosAprobar.value = [];
    totalCostosAprobar.value = [];
    tiporeporte.value = "";
    abrirModalContenedor.value = false;
    index.value = 0;
    cantidadOpcionesSeleccionadas.value = 0;
    tab.value = 1;
    llenadoCostos.value = true;
    actualizarComparativa.value = false;
    mostrarGuardarCostos.value = false;
    actualizarNotas.value = false;
    cancelarLlenadoNuevaOpcion.value = false;
    recargarCostoSeleccionados.value = false;
    reCalcularOpciones.value = false;
    reset.value = false;
    namesection.value = [];
    page.value = 1;
    // state.filtro = {
    //   id_marketing: "",
    //   id_status: "",
    //   id_entities: "",
    //   id_modality: "",
    //   id_shipment: "",
    //   id_incoterm: "",
    //   fechainicio: "",
    //   fechafin: "",
    //   id_pricing : '',
    //   estado: "activo",
    // };
    ventaflag.value = false;
    dataQuote.value = null;
    filtrarQuoteFlag.value = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (filtrarCallsFlag.value = false),
      (btnRegistrar.value = false),
      (step2.value = false),
      (step3.value = false),
      (errfecha_fin.value = ""),
      (errtiempo_transito.value = ""),
      (id.value = ""),
      (nro_quote.value = ""),
      (urlFolder.value = ""),
      (mensaje.value = ""),
      (copy_quote.value = null);
    copylistServices.value = null;
    copylistCostos.value = null;
    copydatosPrincipales.value = {};
    datosPrincipales.value = {
      id_percepcionaduana: "",
      id_marketing: "",
      id_status: "",
      id_vendedor: sessionUserIdOrEmpty(),
      id_pricing: sessionUserIdOrEmpty(),
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
      esindividualflag: true,
      esgrupalflag: false,
    };
    opcionCostos.value = [
      {
        nro_propuesta: 1,
        date_end: moment().add(7, "days").format("YYYY-MM-DD"),
        tiempo_transito: 35,
        listCostos: [],
        listImpuestos: [],
        listNotasQuote: [],
        selected: false,
      },
    ];
    datosEmpresa.value = [];
    listQuotes.value = [];
    listCall.value = [];
    listMarketing.value = [];
    listQuoteStatus.value = [];
    listEjecutivo.value = [];
    listModality.value = [];
    listShipment.value = [];
    listIncoterms.value = [];
    listPortBegin.value = [];
    listPortEnd.value = [];
    listServices.value = [];
    listCostos.value = [];
    listMultiplicador.value = [];
    listRoles.value = [];
    errorValorMercancia.value = "";
    totalFlete.value = 0;
    listNotasQuote.value = [];
    totalCosto.value = 0;
    totalVenta.value = 0;
    listImpuestos.value = [];
    listInstructivo.value = [];
    listRecibidoCotizacion.value = [];
    listEnviadoCliente.value = [];
    listIngresosInstructivoAprobar.value = [];
    listCostosInstructivoAprobar.value = [];
    listServiciosInstructivo.value = [];
    listImpuestosInstructivoAprobar.value = [];
    listTipoCostos.value = [];
    listIngresosInstructivo.value = [];
    listCostosInstructivo.value = [];
    listImpuestosInstructivo.value = [];
    e1.value = 1;
    step.value = 1;
  }
  function SET_QUOTE(): void {
    opcionCostos.value = [
      {
        nro_propuesta: 1,
        date_end: "",
        tiempo_transito: 0,
        listCostos: [],
        listImpuestos: [],
        listNotasQuote: [],
        selected: false,
      },
    ];
    listServices.value = [];
    listCostos.value = [];
    btnRegistrar.value = false;
    step2.value = false;
    step3.value = false;
    datosPrincipales.value = {
      id_marketing: "",
      id_status: "",
      id_vendedor: sessionUserIdOrEmpty(),
      id_pricing: sessionUserIdOrEmpty(),
      cif: "",
      contacto: "",
      descripcionMercancia: "",

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
    };
  }
  function SET_LIST_QUOTES(data: CotizacionListado[]): void {
    listQuotes.value = (data || []).map((item, index) => ({
      ...item,
      rowId: item.rowId || (item.id ? `${item.id}_${index}` : `quote_${index}`),
    }));
    // state.totalregistro = data[0].totalregistro
    //   ? Number(Math.ceil(data[0].totalregistro / state.limit))
    //   : 10;
  }
  function SET_LIST_CALLS(data: LlamadaCotizacion[]): void {
    listCall.value = (data || []).map((item, index) => ({
      ...item,
      rowId: item.rowId || (item.id ? `${item.id}_${index}` : `call_${index}`),
    }));
  }
  function SET_LIST_MARKETING(data: Marketing[]): void {
    const sorted = (data || []).slice().sort(function (a, b) {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    listMarketing.value = sorted;
  }

  function setListQuotes(data: CotizacionListado[]): void {
    SET_LIST_QUOTES(data);
    useAduanaStore().listQuotes = data;
  }
  function setPreCostos(data: Costo[]): void {
    preCostos.value = data;
    useAduanaStore().preCostos = data;
  }
  function setPreServices(data: ServicioPredeterminado[]): void {
    preServices.value = data;
    useAduanaStore().preServices = data;
  }
  function setCargarImpuestos(data: Impuesto[]): void {
    listImpuestos.value = data;
    useAduanaStore().listImpuestos = data;
  }
  function setCargarNotasCotizacion(data: Nota[]): void {
    listNotasQuote.value = data;
    useAduanaStore().listNotasQuote = data;
  }
  function setListCostes(data: Costo[]): void {
    listCostos.value = data;
    useAduanaStore().listCostos = data;
  }
  function setListEjecutivo(data: EjecutivoCotizacion[]): void {
    listEjecutivo.value = data;
    useAduanaStore().listEjecutivo = data;
  }
  function setListIncoterms(data: Incoterm[]): void {
    listIncoterms.value = data;
    useAduanaStore().listIncoterms = data;
  }
  function setListModality(data: Modalidad[]): void {
    listModality.value = data;
    useAduanaStore().listModality = data;
  }
  function setListPortBegin(data: Puerto[]): void {
    listPortBegin.value = data;
    useAduanaStore().listPortBegin = data;
  }
  function setListPortEnd(data: Puerto[]): void {
    listPortEnd.value = data;
    useAduanaStore().listPortEnd = data;
  }
  function setListServices(data: Servicio[]): void {
    listServices.value = data;
    copylistServices.value = data;
    const aduana = useAduanaStore();
    aduana.listServices = data;
    aduana.copylistServices = data;
  }
  function setListShipment(data: TipoCarga[]): void {
    listShipment.value = data;
    useAduanaStore().listShipment = data;
  }
  function setMultiplicador(data: Multiplicador[]): void {
    listMultiplicador.value = data;
    // configEmpresa keeps its own copy of the multiplier list.
    useConfigEmpresaStore().lstMultiplicador = data;
    useAduanaStore().listMultiplicador = data;
  }
  function setTipoCostos(data: TipoCostoConfig[]): void {
    listTipoCostos.value = data;
    namesection.value = data;
    // configEmpresa keeps its own copy of the cost type list.
    useConfigEmpresaStore().listTipoCostos = data;
    const aduana = useAduanaStore();
    aduana.listTipoCostos = data;
    aduana.namesection = data;
  }
  function setInstructivo(data: InstructivoCotizacion[]): void {
    listInstructivo.value = data;
    useAduanaStore().listInstructivo = data;
  }

  function resetQuoteNew(): void {
    SET_QUOTE();
  }
  async function setEmisionPdf(): Promise<void> {
    const datos = {
      id: id.value,
    };
    const config = {
      method: "put",
      url: `${import.meta.env.VITE_URL_MAIN}set_emision-pdf`,
      data: datos,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios<ApiResponse>(config)
      .then((response) => {
        console.log(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }
  async function quotePreviewInstructivoManual(datos: DatosInstructivoManual): Promise<void> {
    const config = {
      method: "put",
      url: `${import.meta.env.VITE_URL_MAIN}quote_preview_instructivo_manual`,
      data: datos,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<RespuestaArchivo>(config).then((response) => {
      if (!datos.guardarFlag) {
        window.open(
          `${import.meta.env.VITE_URL_MAIN}${response.data.path}`,
          // "",
          "_blank"
        );
      }
    });
  }
  async function guardarDatosInstructivo(datos: DatosInstructivoManual): Promise<void> {
    const config = {
      method: "put",
      url: `${import.meta.env.VITE_URL_MAIN}actualizar_datos_instructivo_manual`,
      data: datos,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse>(config).then((response) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = response.data;
    });
  }
  async function obtenerRoles(): Promise<void> {
    itemsDataRoleList.value = useAppStore().itemsDataRoleList;
  }
  async function ListarMontosFinalesQuoteMONGODB(): Promise<void> {
    try {
      const config = {
        method: "get",
        url: `${import.meta.env.VITE_URL_MAIN}listar_montos_finales_quote`,
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
          code: v.expediente,
        }));

        setListQuotes(quotes);
      }
    } catch (error) {
      console.error("Error al listar montos finales quote:", error);
    }
  }
  async function getServices(): Promise<void> {
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}obtener_servicio_pricing`,
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
  async function getResumenPorEstado(): Promise<void> {
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}resumen_por_estado`,
      params: {
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ResumenEstadoCotizacion[]>>(config).then((response) => {
      const data = response.data;
      if (data.estadoflag) {
        sessionStorage.setItem("auth-token", data.token!);

        listadoResumen.value = data.data;
      }
    });
  }
  async function getListQuote(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getQuoteList`,
      params: {
        ...filtro.value,
        search: search.value,
        limit: limit.value,
        pagina: pagina.value,
        id_branch: sessionBranchId(),
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionListado[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          const rows = data.data.map((elemento, index) => {
            return {
              ...elemento,
              index,
              rowId: elemento.id ? `${elemento.id}_${index}` : `quote_${index}`,
            };
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
  async function getTipoCostos(): Promise<void> {
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
  async function getQuoteNoAsignadoHouse(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `quote_cargar_noasignadoshouse?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<CotizacionListado[]> & { estado?: boolean }>(config)
      .then(function (response) {
        const data = response.data;
        if (!!data.estado) {
          setListQuotes(data.data);
        } else {
          setListQuotes([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getQuoteDataNoAsignadaHouse({ id_quote = 0 }: { id_quote?: number | string }): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `quote_data_house?id_quote=${id_quote}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionHouse[]>>(config)
      .then(function (response) {
        const data = response.data;
        if (!!data.estadoflag) {
          dataQuote.value = data.data[0]!;
        } else {
          dataQuote.value = [];
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function getQuoteCall(filtro?: unknown): Promise<void> {
    const header = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listado_llamadas`,
      headers: header,
      params: filtroCalls.value,
    };
    await axios<ApiResponse<LlamadaCotizacion[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          const newData = data.data.map((item, index) => ({
            ...item,
            rowId: `${item.id}_${index}`, // Evita duplicados combinando el ID con el índice
          }));
          SET_LIST_CALLS(newData);
        } else {
          SET_LIST_CALLS([]);
          // Swal.fire({
          //   icon: "error",
          //   text: data.mensaje,
          //   allowOutsideClick: false,
          //   allowEscapeKey: false,
          //   allowEnterKey: false,
          // }).then((resSwal) => {
          //   if (resSwal.isConfirmed && data.status == "401") {
          //     router.push({ name: "Login" });
          //     setTimeout(() => {
          //       window.location.reload();
          //     }, 10);
          //   }
          // });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getMarketingList(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getMarketingList",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<Marketing[]>>(config)
      .then(function (response) {
        SET_LIST_MARKETING(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getQuoteStatus(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getQuoteStatus",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<EstadoCotizacion[]>>(config)
      .then(function (response) {
        listQuoteStatus.value = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getModulesEntities(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getModulesEntities",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
        id_module: 6,
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
  async function getCargarEjecutivo(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "cargar_ejecutivo",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        id_branch: sessionBranchId(),
        id_module: 6,
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
  async function getPersonalPricing(): Promise<void> {
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
  async function getBegEndList(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getBegEndList",
      headers: headers,
      data: data,
    };
    await axios<ApiResponse<Begend[]>>(config)
      .then(function (response) {
        const valores = response.data.data;
        begEndList.value = valores;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getModality(): Promise<void> {
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
  async function getShipment(): Promise<void> {
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
  async function getIncoterms(): Promise<void> {
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
  async function getPortBegin({
    id_transport = 0,
    id = null,
    search = null,
    limit = 20,
  }: FiltroPuertos): Promise<void> {
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
        limit: limit,
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
  async function getPortEnd({ id_transport = 0, id = null, search = null, limit = 20 }: FiltroPuertos): Promise<void> {
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
        limit: limit,
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

  async function getItemsServices(): Promise<void> {
    const ownRequest = (async (): Promise<void> => {
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
    })();
    const aduanaRequest = useAduanaStore().getItemsServices();
    await Promise.all([ownRequest, aduanaRequest]);
  }
  async function obtenerCostosPricing(): Promise<void> {
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
  async function getItemsServicesDetails(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      id_branch: sessionBranchId(),
      id_incoterms: datosPrincipales.value.idincoterms, // 5,
      id_modality: datosPrincipales.value.idsentido, //1,
      // id_shipment: state.datosPrincipales.,//1,
      id_shipment: (datosPrincipales.value.idtipocarga as TipoCarga).id
        ? (datosPrincipales.value.idtipocarga as TipoCarga).id
        : datosPrincipales.value.idtipocarga,
      services: listServices.value.filter((v) => v.status == true),
      containers: datosPrincipales.value.containers,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getItemsServicesDetails",
      headers: headers,
      data: data,
    };

    await axios<ApiResponse<CostoServicioDetalle[]>>(config).then(function (response) {
      const costes: Costo[] = [];
      const valores = response.data.data;
      if (valores) {
        valores.forEach((element) => {
          costes.push({
            id_groupservices: element.id_groupservices,
            id_incoterms: element.id_incoterms,
            id_modality: element.id_modality,
            id_multiplicador: element.id_multiplicador ? element.id_multiplicador : "N",
            id_services: element.id_services,
            id_shipment: element.id_shipment,
            namebegend: element.namebegend,
            namegroupservice: element.namegroupservice,
            namemultiplicador: element.namemultiplicador,
            namerole: element.namerole,
            costounitario: element.price ? element.price : 0,
            id: element.id,
            id_begend: element.id_begend,
            nameservice: element.nameservice,
            status: 1,
            id_role: element.id_role,
            statedelete: 0,
            servicioFlag: 1,
            costosflag: 0,
            cif: parseFloat(String(0.35)),
            seguro: parseFloat(String(0.45)),
            id_proveedor: element.id_proveedor ? element.id_proveedor : 0,
            esopcionflag: 1,
            esventaflag: 0,
            esorigenflag: element.esorigenflag == true ? 1 : 0,
            eslocalflag: element.eslocalflag == true ? 1 : 0,
            esaduanaflag: element.esaduanaflag == true ? 1 : 0,
            esalmacenflag: element.esalmacenflag == true ? 1 : 0,
            esfleteflag: element.esfleteflag == true ? 1 : 0,
            esgastostercerosflag: element.esgastostercerosflag == true ? 1 : 0,
            code_cost: element.code_cost,
          });
        });
        valores.forEach((element) => {
          costes.push({
            id_groupservices: element.id_groupservices,
            id_incoterms: element.id_incoterms,
            id_modality: element.id_modality,
            id_multiplicador: element.id_multiplicador ? element.id_multiplicador : "N",
            id_services: element.id_services,
            id_shipment: element.id_shipment,
            namebegend: element.namebegend,
            namegroupservice: element.namegroupservice,
            namemultiplicador: element.namemultiplicador,
            namerole: element.namerole,
            costounitario: 0,
            id: element.id,
            id_begend: element.id_begend,
            nameservice: element.nameservice,
            status: 1,
            id_role: element.id_role,
            statedelete: 0,
            servicioFlag: 1,
            costosflag: 0,
            cif: parseFloat(String(0.35)),
            seguro: parseFloat(String(0.45)),
            id_proveedor: element.id_proveedor ? element.id_proveedor : 0,
            esopcionflag: 0,
            esventaflag: 1,
            esorigenflag: element.esorigenflag == true ? 1 : 0,
            eslocalflag: element.eslocalflag == true ? 1 : 0,
            esaduanaflag: element.esaduanaflag == true ? 1 : 0,
            esalmacenflag: element.esalmacenflag == true ? 1 : 0,
            esfleteflag: element.esfleteflag == true ? 1 : 0,
            esgastostercerosflag: element.esgastostercerosflag == true ? 1 : 0,
            categoria_role: element.categoria_role,
            code_cost: element.code_cost,
          });
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "ADVERTENCIA",
          text: "No existen costos, para la combinación seleccionada de Sentido,Incoterms,Tipo de Embarque y la sucursal logueada.",
        });
      }
      setListCostes(
        costes.filter(
          (v) =>
            v.esorigenflag == 1 ||
            v.eslocalflag == 1 ||
            v.esaduanaflag == 1 ||
            v.esfleteflag == 1 ||
            v.esalmacenflag == 1 ||
            v.esgastostercerosflag == 1
        )
      );
    });
  }
  async function getMultiplicador(): Promise<void> {
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
            ...element,
            value: element.id,
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
  async function getModuleRole(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = JSON.stringify({
      id_module: 6,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getModuleRole",
      headers: headers,
      data: data,
    };
    await axios<ApiResponse<RolModulo[]>>(config)
      .then(function (response) {
        const valores: RolModuloCotizacion[] = [];
        response.data.data.forEach((element) => {
          valores.push({
            id: element.id,
            value: element.id_role,
            text: element.name,
            id_role: element.id_role,
          });
        });
        listRoles.value = valores;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getCargarMasterDetalleNotasCotizacion(): Promise<void> {
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
  async function getImpuestos(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_impuesto?id_branch=${sessionBranchId()}`,
      headers: headers,
    };
    await axios<ApiResponse<Impuesto[]>>(config).then((response) => {
      const data = response.data;
      if (data.estadoflag == true) {
        setCargarImpuestos(response.data.data);
      } else {
        Swal.fire({
          icon: "error",
          text: data.mensaje,
        });
        setCargarImpuestos([]);
      }
    });
  }
  async function registrarQuote({ fullflag = true }: { fullflag?: boolean }): Promise<void> {
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

    const datosPrincipalesSinOpciones = { ...datosPrincipales.value };
    delete datosPrincipalesSinOpciones.opcioncostos;

    const data = {
      ...datosPrincipalesSinOpciones,
      tiporeporte: tiporeporte.value ? tiporeporte.value : "TOTAL",
      fullflag: fullflag,
      idtipocarga: (datosPrincipales.value.idtipocarga as TipoCarga).id
        ? (datosPrincipales.value.idtipocarga as TipoCarga).id
        : datosPrincipales.value.idtipocarga,
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
      descripcionMercancia: datosPrincipales.value.descripcioncarga ? datosPrincipales.value.descripcioncarga : "",
      ventascasillerodetalles: [],
      opcionCostos: opciones,
      id_branch: sessionBranchId(),
    };
    //  console.log(data.costocotizacion);
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setQuote",
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
  async function registrarQuotePorCambioIncoterms(newData: CambioIncoterms): Promise<void> {
    const imp = newData.listServices.filter((v) => v.code_service == "15" && v.status == true);
    const isFCL = listShipment.value.some(
      (v) =>
        v.id ==
          ((datosPrincipales.value.idtipocarga as TipoCarga).id
            ? (datosPrincipales.value.idtipocarga as TipoCarga).id
            : datosPrincipales.value.idtipocarga) && v.code == "FCL"
    );
    const opciones: unknown[] = [];
    await newData.opcionCostos.forEach(async (opcionCosto) => {
      const costocotizacion = formatearCostos({
        costos: opcionCosto.listCostos,
        services: newData.listServices,
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
      fullflag: true,
      esindividualflag: datosPrincipales.value.esindividualflag,
      esgrupalflag: datosPrincipales.value.esgrupalflag,
      id_marketing: datosPrincipales.value.id_marketing,
      statusquote: datosPrincipales.value.id_status,
      idVendedor: datosPrincipales.value.id_vendedor,
      id_proveedor: datosPrincipales.value.id_proveedor,
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
        services: newData.listServices,
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
      url: import.meta.env.VITE_URL_MAIN + "setQuote",
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
  async function copiarQuote({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fullflag = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: idCopia = null,
  }: {
    fullflag?: boolean;
    id?: unknown;
  }): Promise<void> {
    const data = {
      id: datosPrincipales.value.id,
      id_town: datosPrincipales.value.id_town,
    };
    //  console.log(data.costocotizacion);
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "copiar_cotizacion",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    // let vm = this;
    await axios<ApiResponse<CotizacionCopiada[]>>(config).then(async (response) => {
      id.value = response.data.data[0]!.insertid;
      nro_quote.value = response.data.data[0]!.nro_quote;
      mensaje.value = response.data.data[0]!.mensaje;
      tiporeporte.value = "";
    });
  }
  async function crearCarpetaOneDrive({
    nro_quote = "",
    nombre = "",
  }: {
    nro_quote?: string;
    nombre?: string;
  }): Promise<string | null> {
    const folder = nro_quote + "-" + nombre;
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `crear-carpeta-cotizacion?nombrecotizacion=${folder}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await axios<ApiResponse<string>>(config);
      // IMPORTANTE: Debes retornar el valor para que 'urlGenerada' tenga contenido
      return response.data.data;
    } catch (error) {
      console.error("Error en crearCarpetaOneDrive:", error);
      return null; // Retornamos null para manejar el error en la siguiente etapa
    }
  }
  async function actualizarURLEnElQuote({
    id = "",
    url = "",
  }: {
    id?: number | string;
    url?: string | null;
  }): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_quote_folderonedrive`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios<ApiResponse>(config).then(async (response) => {
      return response.data.data;
    });
  }
  async function getQuote({ id: idQuote }: { id: number | string }): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getQuoteId?id=${idQuote}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionDetalle[]>>(config).then(async (response) => {
      const res = response.data.data[0]!;
      copy_quote.value = res;
      id.value = res.id;
      dataCliente.value = res.cliente[0]!;
      nro_quote.value = res.quote;
      id_master.value = res.id_master;
      datosPrincipales.value = {
        ...res,
        nameStatusQuote: res.namestatusquote,
        descripcioncarga: res.descripcionmercancia,
        id_status: res.statusquote,
        amount: res.monto,
      };
      nro_exp.value = res.nro_exp;
      listServices.value = res.servicios;
      copylistServices.value = res.servicios;

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

      aprobadoflag.value = res.aprobadoflag;
      fullflag.value = res.fullflag;
      tiporeporte.value = res.tiporeporte;

      mostrarBtnActualizarFlag.value = !(res.statusmain == 0 || res.aprobadoflag == true);
      Promise.all([
        GetArchivos(res.url_folderonedrive),
        getTextoWhatsapp({
          id_shipment: res.idtipocarga,
          id_quote: res.id,
          id_containers: res.containers!
            .map((v) => {
              return v.id_containers;
            })
            .join(","),
        }),
      ]);
    });
  }
  async function getCotzacionCalculadora(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `calc/ver_cotizacion`,
      params: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<CotizacionDetalle[]>>(config).then(async (response) => {
      const res = response.data.data[0]!;
      copy_quote.value = res;
      id.value = res.id;

      datosPrincipales.value = {
        ...res,
        idorigen: Number(res.idorigen),
        iddestino: Number(res.iddestino),
        idsentido: Number(res.idsentido),
        idtipocarga: Number(res.idtipocarga),
        idincoterms: Number(res.idincoterms),
        id_percepcionaduana: res.id_percepcionaduana,
        // nameStatusQuote: res.namestatusquote,
        descripcioncarga: res.descripcionmercancia,
        // id_status: res.statusquote,
        amount: res.monto,
      };
      // state.nro_exp = res.nro_exp;
      listServices.value = res.servicios;
      copylistServices.value = res.servicios;

      // --------------------------------------------------------------
      opcionCostos.value = [];
      res.opcioncostos.forEach((element) => {
        opcionCostos.value.push({
          // id: element.id,
          nro_propuesta: element.nro_propuesta,
          date_end: element.date_end,
          tiempo_transito: element.tiempo_transito,
          listCostos: element.listcostos,
          listImpuestos: element.listimpuestos,
          // listNotasQuote: element.listnotasquote,
          selected: element.selected,
        } as OpcionCosto);
      });

      //   // --------------------------------------------------------------

      //   state.aprobadoflag = res.aprobadoflag;
      //   state.fullflag = res.fullflag;
      //   state.tiporeporte = res.tiporeporte;

      //   state.mostrarBtnActualizarFlag = !(
      //     res.statusmain == 0 || res.aprobadoflag == true
      //   );
      //   Promise.all([
      //     dispatch("GetArchivos", res.url_folderonedrive),
      //     dispatch("getTextoWhatsapp", {
      //       id_shipment: res.idtipocarga,
      //       id_quote: res.id,
      //       id_containers: res.containers
      //         .map((v) => {
      //           return v.id_containers;
      //         })
      //         .join(","),
      //     }),
      //   ]);
    });
  }
  async function getInstructivoId({ id: id }: { id: number | string }): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getInstructivoId/" + id,
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
  async function obtenerDatosEmpresa(): Promise<void> {
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
  async function generarReporte({
    tipo = "",
    nro_propuesta = 1,
    guardarFlag = false,
    enviarWspCliente = false,
    textWhatsapp = "",
    pdfflag = false,
    linkflag = false,
    tipoCotizacion = "individual",
    fecha_salida = "",
    nombre_cliente = "",
    fecha_max = "",
    nombrePdfEnviarCliente = "",
  }: OpcionesReporte): Promise<void> {
    console.log("sssssssssssssssss");
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
    // state.nombre_cotizacion = getNombreCotizacion(opcion.listNotasQuote);

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

    // Agregar TIEMPO DE TRÁNSITO mostrando los días en el nombre y conservando estado SI/NO
    if (opcion && opcion.tiempo_transito) {
      const diasTxt = String(opcion.tiempo_transito) + " " + (Number(opcion.tiempo_transito) === 1 ? "día" : "días");
      locales.push({
        name: "TIEMPO DE TRÁNSITO: " + diasTxt,
        estado: "SI",
      });
    }

    opcion.listNotasQuote
      .filter((v) => v.estado == 1)
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
          let factorCalculado = calcularFac(
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
              : "N",
            datosPrincipales.value.volumen,
            datosPrincipales.value.peso,
            datosPrincipales.value.containers,
            datosPrincipales.value.amount
          );

          if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
            if ((factorCalculado as number) < 1) {
              factorCalculado = 1;
            }
          }

          const valorMultiplicador =
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
              : 0;

          let operacionFinal = (valorMultiplicador as number) * (element.costounitario as number) * (factorCalculado as number);

          if (element.considerarvalorminimoflag) {
            if (element.costounitario != 0) {
              operacionFinal =
                Number(element.minimo || 0) > Number(operacionFinal) ? Number(element.minimo) : operacionFinal;
            }
          }

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
              totalFlete += operacionFinal;
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
              totalOrigen += operacionFinal;
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
              totalLocales += operacionFinal;
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
              totalAduanas += operacionFinal;
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
              totalAlmacenes += operacionFinal;
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
              totalGastosTercero += operacionFinal;
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
          let factorCalculado = calcularFac(
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
              : "N",
            datosPrincipales.value.volumen,
            datosPrincipales.value.peso,
            datosPrincipales.value.containers,
            datosPrincipales.value.amount
          );

          if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
            if ((factorCalculado as number) < 1) {
              factorCalculado = 1;
            }
          }

          const valorMultiplicador =
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
              : 0;

          let operacionFinal = (valorMultiplicador as number) * (element.costounitario as number) * (factorCalculado as number);

          if (element.considerarvalorminimoflag) {
            if (element.costounitario != 0) {
              operacionFinal =
                Number(element.minimo || 0) > Number(operacionFinal) ? Number(element.minimo) : operacionFinal;
            }
          }
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
                valor: currencyFormat(operacionFinal),
              });
              totalFlete += operacionFinal;
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
                valor: currencyFormat(operacionFinal),
              });
              totalOrigen += operacionFinal;
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
                valor: currencyFormat(operacionFinal),
              });
              totalLocales += operacionFinal;
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
                valor: currencyFormat(operacionFinal),
              });
              totalAduanas += operacionFinal;
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
                valor: currencyFormat(operacionFinal),
              });
              totalAlmacenes += operacionFinal;
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
                valor: currencyFormat(operacionFinal),
              });
              totalGastosTercero += operacionFinal;
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
          let factorCalculado = calcularFac(
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
              : "N",
            datosPrincipales.value.volumen,
            datosPrincipales.value.peso,
            datosPrincipales.value.containers,
            datosPrincipales.value.amount
          );
          if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
            if ((factorCalculado as number) < 1) {
              factorCalculado = 1;
            }
          }

          const valorMultiplicador =
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
              : 0;

          let operacionFinal = (valorMultiplicador as number) * (element.costounitario as number) * (factorCalculado as number);

          if (element.considerarvalorminimoflag) {
            if (element.costounitario != 0) {
              operacionFinal =
                Number(element.minimo || 0) > Number(operacionFinal) ? Number(element.minimo) : operacionFinal;
            }
          }

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
              totalFlete += operacionFinal;
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
              totalOrigen += operacionFinal;
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
              totalLocales += operacionFinal;
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
              totalAduanas += operacionFinal;
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
              totalAlmacenes += operacionFinal;
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
              totalGastosTercero += operacionFinal;
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
    // ----------------------AQUI------------------------------------------

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
    /* GENERAR ---------------------------------*/
    const shipment = listShipment.value.find((v) => v.id == datosPrincipales.value.idtipocarga);

    if (!nombrePdfEnviarCliente) {
      nombrePdfEnviarCliente = "COTIZACION_";
      if (!!enviarWspCliente) {
        if (!!datosPrincipales.value.esindividualflag) {
          console.log("esindividualflag");
          nombrePdfEnviarCliente += "INDIVIDUAL";
        }
        if (!!datosPrincipales.value.esgrupalflag) {
          console.log("esgrupalflag");
          nombrePdfEnviarCliente += "GRUPAL";
        }

        const shipment = listShipment.value.find((v) => v.id == datosPrincipales.value.idtipocarga);
        if (shipment!.code == "FCL") {
          nombrePdfEnviarCliente = contenedor
            .map((v) => {
              return "_" + v.valor + "x" + v.name;
            })
            .join("_");
        }
        if (shipment!.code == "LCL") {
          nombrePdfEnviarCliente += "_CONSOLIDADOS";
        }
        nombrePdfEnviarCliente += "_" + limpiarNombre(datosPrincipales.value.nombre!);
      }
    }
    const data = {
      tipoCotizacion: tipoCotizacion,
      nombre_asesor: sessionUser().nombrecompleto,
      fecha_salida: fecha_salida,
      nombre_cliente: nombre_cliente,
      fecha_max: fecha_max,
      enviarWspCliente: enviarWspCliente,
      textWhatsapp: textWhatsapp,
      nombrePdfEnviarCliente: nombrePdfEnviarCliente,
      pdfflag: pdfflag,
      linkflag: linkflag,
      isFCL: shipment!.code == "FCL",
      guardarFlag: guardarFlag,
      url_folderonedrive: datosPrincipales.value.url_folderonedrive,
      nombre_cotizacion: nombre_cotizacion.value,
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
      pais: datosEmpresa.value[0]!.pais,
      document: datosEmpresa.value[0]!.document,
      phone: datosEmpresa.value[0]!.phone,
      tipo: tipo,
      cliente: datosPrincipales.value.nombre,
      telefonoCliente: datosPrincipales.value.telefono,
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

      total: currencyFormat(parseFloat(String(totalServicios)) + parseFloat(String(totalImpuesto)) + parseFloat(String(totalImpuestosIGV))),
      amount: datosPrincipales.value.amount,
    };

    const headers = {
      "Content-Type": "application/json",
    };
    await axios
      // @ts-expect-error the headers object goes in as the request config.
      .post<RespuestaArchivo>(import.meta.env.VITE_URL_MAIN + "quote_preview_totales", data, headers)
      .then((response) => {
        if (!enviarWspCliente) {
          Swal.fire({
            icon: "success",
            title: "PDF Generado",
            text: guardarFlag ? "Se ha guardado los archivos correctamente." : "El PDF se descargará automaticamente",
            showConfirmButton: true,
          });
          if (!guardarFlag) {
            window.open(
              `${import.meta.env.VITE_URL_MAIN}${response.data.path}`,
              // "",
              "_blank"
            );
          }
        } else {
          const res = response.data;
          if (res.estadoflag) {
            Swal.fire({
              icon: "success",
              title: "Mensaje Enviado",
              showConfirmButton: true,
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Ocurrió un error. Comuníquese con el administrador del sistema",
              showConfirmButton: true,
            });
            console.error(res.error);
          }
        }
      })
      .catch((e) => console.log(e));
  }
  async function imprimiReporteListado({
    filtroSeleccionado = {},
    filtroCabecera = {},
  }: FiltrosReporte): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      filtro: { ...filtro.value },
      filtroSeleccionado: filtroSeleccionado,
      filtroCabecera: filtroCabecera,
    };
    let timerInterval;
    Swal.fire({
      icon: "info",
      title: "Generando  PDF",
      text: "El PDF se descargará automaticamente",
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: null as unknown as number,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((res) => {
      if (res.dismiss) {
        clearInterval(timerInterval);
      }
    });

    await axios
      // @ts-expect-error the headers object goes in as the request config.
      .post<RespuestaArchivo>(import.meta.env.VITE_URL_MAIN + "export_list_quote", data, headers)
      .then((response) => {
        if (response.data.estadoflag) {
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
        } else {
          Swal.close();
          Swal.fire({
            icon: "warning",
            text: "Ocurrió un error al generar el PDF, por favor comuníquese con el administrador del sistema",
            showConfirmButton: true,
          });
        }
      })
      .catch((e) => console.log(e));
  }
  async function exportarExcelListadoQuote(): Promise<void> {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer" as const,
    };
    const data = {
      filtro: {
        ...filtro.value,
        search: search.value,
        limit: limit.value,
        pagina: pagina.value,
        id_branch: sessionBranchId(),
      },
      id_branch: sessionBranchId(),
    };

    const url = import.meta.env.VITE_URL_MAIN + "export_list_quote_xls";
    await axios.post<ArrayBuffer>(url, data, headers).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // let name = this.uuidv4();
      link.setAttribute("download", `Reporte de Cotizaciones ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      // this.previewFlag = false;
      // this.generandoFlag = false;
    });
  }
  async function imprimirMercadeo(): Promise<void> {
    const filtros = {
      id_entities: filtro.value.id_entities ? filtro.value.id_entities : "",
      id_marketing: filtro.value.id_marketing ? filtro.value.id_marketing : "",
      id_status: filtro.value.id_status ? filtro.value.id_status : "",
      id_modality: filtro.value.id_modality ? filtro.value.id_modality : "",
      id_shipment: filtro.value.id_shipment ? filtro.value.id_shipment : "",
      id_incoterm: filtro.value.id_incoterm ? filtro.value.id_incoterm : "",
      fechainicio: filtro.value.fechainicio ? filtro.value.fechainicio : "",
      fechafin: filtro.value.fechafin ? filtro.value.fechafin : "",
      estado: filtro.value.estado == "activo" ? "1" : filtro.value.estado == "eliminado" ? "0" : "",
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const headers = {
      "Content-Type": "application/json",
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = {
      filtro: filtros,
      id_branch: sessionBranchId(),
    };
    let timerInterval;
    Swal.fire({
      icon: "info",
      title: "Generando  PDF",
      text: "El PDF se descargará automaticamente",
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: null as unknown as number,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((res) => {
      if (res.dismiss) {
        clearInterval(timerInterval);
      }
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "listado_cotizacion_mercadeo",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
        filtro: filtros,
      },
    };

    await axios<RespuestaArchivo>(config)
      .then((response) => {
        Swal.fire({
          icon: "success",
          title: "PDF Generado",
          text: "El PDF se descargará automaticamente",
          showConfirmButton: true,
        });
        if (response.data.estadoflag == true) {
          window.open(
            `${import.meta.env.VITE_URL_MAIN}${response.data.path}`,
            // "",
            "_blank"
          );
        } else {
          Swal.fire({
            icon: "warning",
            title: "Advertencia",
            text: response.data.msg,
          });
        }
      })
      .catch((e) => console.log(e));
  }
  async function imprimiReporteListadoCalls({
    filtroSeleccionado = {},
    filtroCabecera = {},
  }: FiltrosReporte): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      filtro: { ...filtroCalls.value },
      filtroSeleccionado: filtroSeleccionado,
      filtroCabecera: filtroCabecera,
    };
    let timerInterval;
    Swal.fire({
      icon: "info",
      title: "Generando  PDF",
      text: "El PDF se descargará automaticamente",
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: null as unknown as number,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((res) => {
      if (res.dismiss) {
        clearInterval(timerInterval);
      }
    });
    await axios
      // @ts-expect-error the headers object goes in as the request config.
      .post<RespuestaArchivo>(import.meta.env.VITE_URL_MAIN + "reporte_llamadas_export", data, headers)
      .then((response) => {
        if (response.data.estadoflag) {
          Swal.fire({
            icon: "success",
            title: "PDF Generado",
            text: "El PDF se descargará automaticamente",
            showConfirmButton: true,
          });
          console.log("data", response.data);
          window.open(
            `${import.meta.env.VITE_URL_MAIN}${response.data.path}`,
            // "",
            "_blank"
          );
        } else {
          Swal.close();
          Swal.fire({
            icon: "warning",
            text: "Ocurrió un error al generar el PDF, por favor comuníquese con el administrador del sistema",
            showConfirmButton: true,
          });
        }
      })
      .catch((e) => console.log(e));
  }

  async function getListRecibidoCotizacion(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_recibido?id_branch=${sessionBranchId()}`,
      headers: headers,
    };
    axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      if (data.estadoflag == true) {
        listRecibidoCotizacion.value = response.data.data;
      } else {
        // Swal.fire({
        //   icon: "error",
        //   text: data.mensaje,
        // });
        listRecibidoCotizacion.value = [];
      }
    });
  }
  async function getListEnviadoCliente(): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `cargar_master_detalle_enviado?id_branch=${sessionBranchId()}`,
      headers: headers,
    };
    axios<ApiResponse<TipoTransaccion[]>>(config).then((response) => {
      const data = response.data;
      if (data.estadoflag == true) {
        listEnviadoCliente.value = response.data.data;
      } else {
        // Swal.fire({
        //   icon: "error",
        //   text: data.mensaje,
        // });
        listEnviadoCliente.value = [];
      }
    });
  }
  async function actualizarQuoteRecibidoEnviado(data: Record<string, unknown>): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `update_quote_recibido_enviado`,
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
  async function guardarNotaQuote(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setCalls",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config).catch(function (error) {
      console.error(error);
    });
  }
  async function updateQuote(): Promise<void> {
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
    const datosPrincipalesSinOpciones = { ...datosPrincipales.value };
    delete datosPrincipalesSinOpciones.opcioncostos;

    const data = {
      ...datosPrincipalesSinOpciones,
      tiporeporte: tiporeporte.value ? tiporeporte.value : "TOTAL",
      id_quote: id.value,
      fullflag: true,
      idtipocarga: (datosPrincipales.value.idtipocarga as TipoCarga).id
        ? (datosPrincipales.value.idtipocarga as TipoCarga).id
        : datosPrincipales.value.idtipocarga,
      contenedores: formatearContainer({
        containers: datosPrincipales.value.containers!,
      }),
      serviciocotizacion: formatearServicios({
        services: listServices.value,
      }),
      descripcionMercancia: datosPrincipales.value.descripcioncarga ? datosPrincipales.value.descripcioncarga : "",
      opcionCostos: opciones,
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "putQuote",
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
  async function eliminarRegistro(id: number | string): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `delQuote`,
      headers: headers,
      data: { id: id },
    };
    axios<ApiResponse>(config).then((response) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = response.data;
    });
  }

  async function predata({ tipo = "" }: { tipo?: string }): Promise<DatosPrevisualizacion> {
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
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  let factorCalculado = calcularFac(
                    listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "N",
                    datosPrincipales.value.volumen,
                    datosPrincipales.value.peso,
                    datosPrincipales.value.containers,
                    datosPrincipales.value.amount
                  );

                  if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
                    if ((factorCalculado as number) < 1) {
                      factorCalculado = 1;
                    }
                  }

                  const valorMultiplicador =
                    listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0;

                  let operacionFinal = (valorMultiplicador as number) * (element.costounitario as number) * (factorCalculado as number);

                  if (element.considerarvalorminimoflag) {
                    if (element.costounitario != 0) {
                      operacionFinal =
                        Number(element.minimo || 0) > Number(operacionFinal) ? Number(element.minimo) : operacionFinal;
                    }
                  }

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
                      totalFlete += operacionFinal;
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
                      totalOrigen += operacionFinal;
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
                      totalLocales += operacionFinal;
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
                      totalAduanas += operacionFinal;
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
                      totalAlmacenes += operacionFinal;
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
                      totalGastosTercero += operacionFinal;
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
                  let factorCalculado = calcularFac(
                    listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "N",
                    datosPrincipales.value.volumen,
                    datosPrincipales.value.peso,
                    datosPrincipales.value.containers,
                    datosPrincipales.value.amount
                  );

                  if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
                    if ((factorCalculado as number) < 1) {
                      factorCalculado = 1;
                    }
                  }

                  const valorMultiplicador =
                    listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0;

                  let operacionFinal = (valorMultiplicador as number) * (element.costounitario as number) * (factorCalculado as number);

                  if (element.considerarvalorminimoflag) {
                    if (element.costounitario != 0) {
                      operacionFinal =
                        Number(element.minimo || 0) > Number(operacionFinal) ? Number(element.minimo) : operacionFinal;
                    }
                  }
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
                        valor: currencyFormat(operacionFinal),
                      });
                      totalFlete += operacionFinal;
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
                        valor: currencyFormat(operacionFinal),
                      });
                      totalOrigen += operacionFinal;
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
                        valor: currencyFormat(operacionFinal),
                      });
                      totalLocales += operacionFinal;
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
                        valor: currencyFormat(operacionFinal),
                      });
                      totalAduanas += operacionFinal;
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
                        valor: currencyFormat(operacionFinal),
                      });
                      totalAlmacenes += operacionFinal;
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
                        valor: currencyFormat(operacionFinal),
                      });
                      totalGastosTercero += operacionFinal;
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
              opcionCosto.listCostos
                .filter((v) => v.status == 1 && v.esventaflag == 1)
                .forEach((element) => {
                  let factorCalculado = calcularFac(
                    listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                      : "N",
                    datosPrincipales.value.volumen,
                    datosPrincipales.value.peso,
                    datosPrincipales.value.containers,
                    datosPrincipales.value.amount
                  );
                  if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
                    if ((factorCalculado as number) < 1) {
                      factorCalculado = 1;
                    }
                  }

                  const valorMultiplicador =
                    listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0;

                  let operacionFinal = (valorMultiplicador as number) * (element.costounitario as number) * (factorCalculado as number);

                  if (element.considerarvalorminimoflag) {
                    if (element.costounitario != 0) {
                      operacionFinal =
                        Number(element.minimo || 0) > Number(operacionFinal) ? Number(element.minimo) : operacionFinal;
                    }
                  }

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
                      totalFlete += operacionFinal;
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
                      totalOrigen += operacionFinal;
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
                      totalLocales += operacionFinal;
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
                      totalAduanas += operacionFinal;
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
                      totalAlmacenes += operacionFinal;
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
                      totalGastosTercero += operacionFinal;
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
              parseFloat(String(totalServicios)) + parseFloat(String(totalImpuesto)) + parseFloat(String(totalImpuestosIGV))
            );

            OpcionesSelecciondas.push({
              nro_propuesta: opcionCosto.nro_propuesta,
              date_end: opcionCosto.date_end,
              tiempo_transito: opcionCosto.tiempo_transito,
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
  function validarCosto(): boolean {
    let val = true;
    const cost = listCostos.value.filter((v) => v.esopcionflag == 1);
    cost.forEach((element) => {
      const res = validateCost({ costo: element });
      if (res == false) {
        val = false;
        element.error = "El costo que tiene un valor 0.00.";
      } else {
        element.error = "";
      }
    });
    return val;
  }
  function validateCost({ costo }: { costo: Costo }): boolean {
    const service = listServices.value.filter((v) => v.status == 1);
    const multiplocadores = listMultiplicador.value.filter((v) => {
      return comienzaNoConCaracter(v.text as string, "%");
    });
    const idMultiplicador = multiplocadores.map((v) => v.id);
    const idServices = service.map((v) => v.id_groupservices);
    if (
      !(
        idMultiplicador.includes(costo.id_multiplicador) &&
        idServices.includes(costo.id_groupservices) &&
        costo.costounitario == 0
      )
    ) {
      return true;
    } else {
      return false;
    }
  }
  async function aprobarCotizacion(dataParaAprobar: AprobacionCotizacion): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "aprobar_cotizacion",
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": dataParaAprobar.IdempotencyKey,
      },
      data: dataParaAprobar,
    };
    await axios<ApiResponse<MasterAprobado[]>>(config).then(async (res) => {
      const data = res.data;
      const name = data.data[0]!.code_master + " - " + datosPrincipales.value.nombre;
      const id_branch = sessionBranchId();
      const id_branchs = ["1", "2", 1, 2];
      if (dataParaAprobar.nuevoexpediente == true && id_branchs.includes(id_branch)) {
        Promise.all([
          useHousesStore().guardarCarpetaHouse({
            nroMaster: name,
            id: data.data[0]!.id_master,
            idSelectedFile: selectedFile.value.map((v) => v.id),
          }),

          useControlGastosStore().imprimirGuardarControlDetallado({
            guardarEnCarpeta: false,
            asociadoflag: true,
            id: data.data[0]!.id_master,
            id_branch: sessionBranchId(),
          }),
        ]);
      }

      if (dataParaAprobar.nuevoexpediente == false && id_branchs.includes(id_branch)) {
        Promise.all([
          useFilesStore().moveFileToOneDrive({
            destinationFolderUrl: dataParaAprobar.url_folderonedrive,
            nroMaster: name,
            id: data.data[0]!.id_master,
            fileIds: selectedFile.value.map((v) => v.id),
          }),
          useControlGastosStore().imprimirGuardarControlDetallado({
            guardarEnCarpeta: false,
            asociadoflag: true,
            id: data.data[0]!.id_master,
            id_branch: sessionBranchId(),
          }),
        ]);
      }
      Swal.fire({
        icon: data.estadoflag == true ? "success" : "error",
        title: "Aviso",
        text: res.data.mensaje,
        timerProgressBar: true,
        allowOutsideClick: false,
        confirmButtonText: "Ir al control de gastos",
        // cancelButtonText: "Enviar Correos",
        denyButtonText: "Ahora continuaremos con los Email.",
        // showCancelButton: true,
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
          // La ruta actual está en 'currentRoute'
          const idActual = router.currentRoute.value.params.id;

          if (idActual) {
            router.push({
              name: "verQuote",
              params: { id: idActual, step: 5 },
            });

            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            console.warn("No se encontró el ID en la ruta actual");
          }
        }
      });
    });
  }
  function comienzaNoConCaracter(nombre: string, caracter: string): boolean {
    return nombre.charAt(0).toUpperCase() !== caracter.toUpperCase();
  }
  function comienzaConCaracter(nombre: string, caracter: string): boolean {
    return nombre.charAt(0).toUpperCase() === caracter.toUpperCase();
  }
  function generaInstructivo(): void {
    // -------------------------------------------------------
    listServiciosInstructivo.value = [];

    (listServices.value || []).filter(Boolean).forEach((element) => {
      listServiciosInstructivo.value.push({
        name: element.service,
        status: element.status == true ? "SI" : "NO",
      });
    });

    vendedor.value =
      (listEjecutivo.value || []).find((v) => v.id_entitie == datosPrincipales.value.id_pricing)?.name || "";
    // console.log(state.opcionCostos)
    GenerarIngresosInstrictivo(tiporeporte.value);
    GenerarCostosInstrictivo(tiporeporte.value);
    GenerarImpInstructivo();
  }
  async function generaInstructivoparaguardata(): Promise<void> {
    listIngresosInstructivoAprobar.value = [];

    if (!Array.isArray(listInstructivo.value) || !listInstructivo.value[0]!) {
      // Swal.fire({
      //   icon: "error",
      //   title: "Ocurrió un error",
      //   text: "No se encontraron los datos del instructivo para generar los costos.",
      //   showConfirmButton: true,
      // });
      return;
    }

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
    vendedor.value = listEjecutivo.value.find((v) => v.id_entitie == datosPrincipales.value.id_pricing)?.name || "";

    const opcionesSeleccionadas = opcionCostos.value.filter((v) => !!v.selected);

    for (const opcion of opcionesSeleccionadas) {
      let igvIngresos = 0;
      let totalImpuestosIGV = 0;
      let montoIngresos = 0;
      let totalIngresos = 0;
      let igvCostos = 0;
      let montoCostos = 0;
      let totalCostos = 0;
      let dataIngresos: LineaInstructivo[] = [];
      let dataCostos: LineaInstructivo[] = [];
      totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcion.listCostos);
      opcion.listCostos
        .filter((v) => v.esventaflag == 1 && v.status == 1)
        .forEach((element) => {
          const excluirIgv = [5, 15].includes(Number(element.code_cost));
          let orden = 1;
          let name = "";

          let factor = calcularFac(
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
              : "N",
            datosPrincipales.value.volumen,
            datosPrincipales.value.peso,
            datosPrincipales.value.containers,
            datosPrincipales.value.amount
          );
          if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
            if ((factor as number) < 1) {
              factor = 1;
            }
          }
          // ------------------------------------

          let montoDetails = 0;
          const codePorcentaje = [5, 13, 14];
          if (
            listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
              ? listMultiplicador.value.some(
                  (v) => v.id == element.id_multiplicador && !codePorcentaje.includes((v.code as number))
                )
              : false
          ) {
            montoDetails +=
              ((listMultiplicador.value.some((v) => v.id == element.id_multiplicador)
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (factor as number);
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
                : 0,
              (element.minimo as number)
            );
          }
          montoDetails = aplicarMinimoCosto(element, montoDetails);

          // Creando el agrupamiento
          if (element.esfleteflag == 1 && isImport) {
            name = obtenerNombreTipoCosto("FL");
            orden = 1;
          }
          if (element.esorigenflag == 1) {
            if (!isImport && !excluirIgv) {
              totalImpuestosIGV += parseFloat(String(montoDetails));
            }
            name = obtenerNombreTipoCosto("OR");
            orden = 2;
          }
          if (element.eslocalflag == 1) {
            //
            if (!excluirIgv) {
              totalImpuestosIGV += parseFloat(String(montoDetails));
            }
            name = obtenerNombreTipoCosto("LO");
            orden = 3;
          }
          if (element.esaduanaflag == 1) {
            if (!excluirIgv) {
              totalImpuestosIGV += parseFloat(String(montoDetails));
            }
            orden = 4;
            name = obtenerNombreTipoCosto("AD");
          }
          if (element.esfleteflag == 1 && !isImport) {
            name = obtenerNombreTipoCosto("FL");
            orden = 5;
          }
          if (element.esalmacenflag == 1) {
            if (isImport && !excluirIgv) {
              totalImpuestosIGV += parseFloat(String(montoDetails));
            }
            orden = 6;
            name = obtenerNombreTipoCosto("AL");
          }

          if (element.esgastostercerosflag == 1) {
            if (isImport && !excluirIgv) {
              totalImpuestosIGV += parseFloat(String(montoDetails));
            }
            orden = 7;
            name = obtenerNombreTipoCosto("GT");
          }

          let igv = 0;
          if (!excluirIgv && isImport) {
            if (
              element.eslocalflag == 1 ||
              element.esaduanaflag == 1 ||
              element.esalmacenflag == 1 ||
              element.esgastostercerosflag == 1
            ) {
              igv = parseFloat(String((montoDetails * (useEnterprisesStore().impuesto.impuesto as number)) / 100));
            }
          } else if (!excluirIgv) {
            if (
              element.esorigenflag == 1 ||
              element.eslocalflag == 1 ||
              element.esaduanaflag == 1 ||
              element.esalmacenflag == 1 ||
              element.esgastostercerosflag == 1
            ) {
              igv = parseFloat(String((montoDetails * (useEnterprisesStore().impuesto.impuesto as number)) / 100));
            }
          }

          dataIngresos.push({
            descripcion: name,
            service: element.nameservice,
            valor: montoDetails,
            orden: orden,
            igv: parseFloat(String(igv)).toFixed(2),
            total: parseFloat(String(montoDetails + igv)).toFixed(2),
          });

          igvIngresos += parseFloat(String(0));
          montoIngresos += parseFloat(String(montoDetails));
          totalIngresos += parseFloat(String(montoDetails));
        });

      opcion.listCostos
        .filter((v) => v.esopcionflag == 1 && v.status == 1)
        .forEach((element) => {
          const excluirIgv = [5, 15].includes(Number(element.code_cost));
          let orden = 1;
          let name = "";
          let factor = calcularFac(
            listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
              ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
              : "N",
            datosPrincipales.value.volumen,
            datosPrincipales.value.peso,
            datosPrincipales.value.containers,
            datosPrincipales.value.amount
          );
          if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
            if ((factor as number) < 1) {
              factor = 1;
            }
          }
          // Creando el agrupamiento
          if (element.esfleteflag == 1 && isImport) {
            name = obtenerNombreTipoCosto("FL");
            orden = 1;
          }
          if (element.esorigenflag == 1) {
            name = obtenerNombreTipoCosto("OR");
            orden = 2;
          }
          if (element.eslocalflag == 1) {
            // totalImpuestosIGV += montoDetails;
            name = obtenerNombreTipoCosto("LO");
            orden = 3;
          }
          if (element.esaduanaflag == 1) {
            // totalImpuestosIGV += montoDetails;
            orden = 4;
            name = obtenerNombreTipoCosto("AD");
          }
          if (element.esfleteflag == 1 && !isImport) {
            name = obtenerNombreTipoCosto("FL");
            orden = 5;
          }
          if (element.esalmacenflag == 1) {
            // totalImpuestosIGV += montoDetails;
            orden = 6;
            name = obtenerNombreTipoCosto("AL");
          }
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
              (factor as number);
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
                : 0,
              (element.minimo as number)
            );
          }
          montoDetails = aplicarMinimoCosto(element, montoDetails);
          const proveedorEncontrado = useAppStore().provedores.find((v: ProveedorPricing) => v.id == element.id_proveedor);

          if (element.esgastostercerosflag == 1) {
            if (isImport && !excluirIgv) {
              totalImpuestosIGV += parseFloat(String(montoDetails));
            }
            orden = 7;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            name = obtenerNombreTipoCosto("GT");
          }

          let igv = 0;
          if (!excluirIgv && isImport) {
            if (
              element.eslocalflag == 1 ||
              element.esaduanaflag == 1 ||
              element.esalmacenflag == 1 ||
              element.esgastostercerosflag == 1
            ) {
              igv = parseFloat(String((montoDetails * (useEnterprisesStore().impuesto.impuesto as number)) / 100));
            }
          } else if (!excluirIgv) {
            if (
              element.esorigenflag == 1 ||
              element.eslocalflag == 1 ||
              element.esaduanaflag == 1 ||
              element.esalmacenflag == 1 ||
              element.esgastostercerosflag == 1
            ) {
              igv = parseFloat(String((montoDetails * (useEnterprisesStore().impuesto.impuesto as number)) / 100));
            }
          }

          dataCostos.push({
            proveedor: proveedorEncontrado ? proveedorEncontrado.namelong : "",
            service: element.nameservice,
            valor: montoDetails,
            orden: orden,
            igv: parseFloat(String(igv)),
            total: parseFloat(String(montoDetails + igv)).toFixed(2),
            id: proveedorEncontrado ? proveedorEncontrado.id : null,
          });
          igvCostos += igv;
          montoCostos += parseFloat(String(montoDetails));
          totalCostos += parseFloat(String(montoDetails));
        });

      // @ts-expect-error equal rows make the comparator return undefined.
      dataIngresos = dataIngresos.sort((a, b) => {
        if ((a.orden as number) < (b.orden as number)) return -1;
        if ((a.orden as number) > (b.orden as number)) return 1;
      });
      // ------------------------------------------------ dataIngresos
      const resultIngresos: LineaInstructivo[] = [];
      let currentProviderIngresos: string | null | undefined = null;
      let subvalorIngresos = 0;
      let subtotalIngresos: number | string = 0;
      let subigvIngresos = 0;

      for (const item of dataIngresos) {
        if (currentProviderIngresos === null) {
          currentProviderIngresos = item.descripcion;
          subvalorIngresos += item.valor as number;
          subtotalIngresos += item.total as string;
          subigvIngresos += 0;
        } else if (currentProviderIngresos === item.descripcion) {
          subvalorIngresos += item.valor as number;
          subtotalIngresos += item.total as string;
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
          subtotalIngresos = item.total!;
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
      // @ts-expect-error equal rows make the comparator return undefined.
      dataCostos = dataCostos.sort((a, b) => {
        if ((a.proveedor as string) < (b.proveedor as string)) return -1;
        if ((a.proveedor as string) > (b.proveedor as string)) return 1;
      });
      //---------------------------------------------------

      const result: LineaInstructivo[] = [];
      let id: Numerico = null;
      let currentProvider: string | null | undefined = null;
      let subtotal: number | string = 0;
      let valor = 0;
      let igv = 0;
      for (const item of dataCostos) {
        if (currentProvider === null) {
          id = item.id;
          currentProvider = item.proveedor;
          valor += item.valor as number;
          subtotal += item.total as string;
          igv += item.igv as number;
        } else if (currentProvider === item.proveedor) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          id = item.id;
          valor += item.valor as number;
          subtotal += item.total as string;
          igv += item.igv as number;
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
          subtotal = item.total!;
          // @ts-expect-error subtracts the running IGV from the row object (NaN).
          igv = item - igv;
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
      // console.log('totalImpuestosIGV',totalImpuestosIGV);
      dataIngresos.push({
        descripcion: `TOTAL`,
        valor: parseFloat(String(montoIngresos)).toFixed(2),
        service: `Total sin ${useEnterprisesStore().impuesto.nombre_impuesto} ${currencyFormat(
          parseFloat(String(totalIngresos)).toFixed(2)
        )}     |      ${useEnterprisesStore().impuesto.nombre_impuesto}: ${currencyFormat(
          parseFloat(String((totalImpuestosIGV * (useEnterprisesStore().impuesto.impuesto as number)) / 100)).toFixed(2)
        )} `,
        igv: parseFloat(String(igvIngresos)).toFixed(2),
        total:
          iso == 9589
            ? parseFloat(String(totalIngresos)) +
              parseFloat(String((totalImpuestosIGV * (useEnterprisesStore().impuesto.impuesto as number)) / 100))
            : parseFloat(String(totalIngresos)),
      });
      dataCostos.push({
        proveedor: "TOTAL",
        valor: parseFloat(String(montoCostos)).toFixed(2),
        igv: parseFloat(String(igvCostos)).toFixed(2),
        total: parseFloat(String(montoCostos)).toFixed(2),
      });
      //
      listIngresosInstructivoAprobar.value.push({
        nro_propuesta: opcion.nro_propuesta,
        dataIngresos: dataIngresos,
        dataCostos: dataCostos,
        totalIngresos: totalIngresos,
        totalCostos: totalCostos,
        dataVentas: dataIngresos,
      });
      // state.listCostosInstructivoAprobar.push({
      // });
      // state.totalIngresosAprobar.push({
      //   nro_propuesta: opcion.nro_propuesta,
      // });
      // state.totalCostosAprobar.push({
      //   nro_propuesta: opcion.nro_propuesta,
      // });
    }

    //
  }
  async function imprimirInstructivoQuote(dataQuote: { nro_propuesta?: number }): Promise<void> {
    const opcionIngresosInstructivo = listIngresosInstructivo.value.filter(
      (v) => v.nro_propuesta == dataQuote.nro_propuesta
    )[0]!.opcion;
    const opcionCostosInstructivo = listCostosInstructivo.value.filter(
      (v) => v.nro_propuesta == dataQuote.nro_propuesta
    )[0]!.opcion;
    const opcionImpuestosInstructivo = listImpuestosInstructivo.value.filter(
      (v) => v.nro_propuesta == dataQuote.nro_propuesta
    )[0]!.opcion;
    const tipoimportacionaduana = datosPrincipales.value.id_percepcionaduana
      ? useMasterusuariosStore().lstPercepcionAduana.length > 0
        ? useMasterusuariosStore().lstPercepcionAduana.filter(
            (v) => v.id == datosPrincipales.value.id_percepcionaduana
          )[0]!.descripcion
        : ""
      : "";
    const notas = listInstructivo.value[0]!.notas;

    const data = {
      nro_propuesta: dataQuote.nro_propuesta,
      url_folderonedrive: datosPrincipales.value.url_folderonedrive,
      url_folderonedriveexp: datosPrincipales.value.url_folderonedriveexp,
      nombre_archvivo: `INSTRUCTIVO_${nro_quote.value}_${datosPrincipales.value.nombre}`,
      tipoimportacionaduana: tipoimportacionaduana,
      containers: datosPrincipales.value.containers,
      numerobultos: datosPrincipales.value.numerobultos,
      peso: datosPrincipales.value.peso,
      volumen: datosPrincipales.value.volumen,
      totalIngresos: currencyFormat(parseFloat(String(totalIngresos.value)).toFixed(2)),
      totalCostos: currencyFormat(parseFloat(String(totalCostos.value)).toFixed(2)),
      profit: currencyFormat(Number(parseFloat(String(totalIngresos.value)).toFixed(2)) - Number(parseFloat(String(totalCostos.value)).toFixed(2))),
      sucursal: sessionSucursal().trade_name,
      status: aprobadoflag.value
        ? "Aprobado"
        : listQuoteStatus.value.find((v) => v.id == datosPrincipales.value.id_status)!.name,
      code_house: listInstructivo.value[0]!.code_house ? listInstructivo.value[0]!.code_house : "",
      code_master: listInstructivo.value[0]!.code_master ? listInstructivo.value[0]!.code_master : "",
      notas: notas,
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
      listServiciosInstructivo: listServiciosInstructivo.value,
      listIngresosInstructivo: opcionIngresosInstructivo,
      listCostosInstructivo: opcionCostosInstructivo,
      listImpuestosInstructivo: opcionImpuestosInstructivo,
      aprobadoflag: aprobadoflag.value,
      url_logo: sessionUser().path,
    };
    const headers = {
      "Content-Type": "application/json",
    };
    Swal.fire({
      icon: "info",
      title: "Generando  PDF",
      text: "El PDF se descargará automaticamente",
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: null as unknown as number,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((res) => {
      if (res.dismiss) {
        // @ts-expect-error timerInterval is not declared in this action, so a dismissed alert throws a ReferenceError.
        clearInterval(timerInterval);
      }
    });

    await axios
      // @ts-expect-error the headers object goes in as the request config.
      .post<RespuestaArchivo>(import.meta.env.VITE_URL_MAIN + "quote_instructivo", data, headers)
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
      .catch((e) =>
        Swal.fire({
          icon: "error",
          title: "Ocurrió un error",
          text: e,
          showConfirmButton: true,
        })
      );
  }
  async function GuardaCostosFinalesQuote(): Promise<void> {
    if (!Array.isArray(listInstructivo.value) || !listInstructivo.value[0]!) {
      // Swal.fire({
      //   icon: "error",
      //   title: "Ocurrió un error",
      //   text: "No se encontraron los datos del instructivo para guardar los costos.",
      //   showConfirmButton: true,
      // });
      return;
    }
    await generaInstructivoparaguardata();
    const listServiciosInstructivo: ServicioInstructivo[] = [];
    listServices.value.forEach((element) => {
      listServiciosInstructivo.push({
        name: element.service,
        status: element.status == true ? "SI" : "NO",
      });
    });
    // Validación defensiva: evitar errores cuando no se pudo generar la data
    if (
      !listIngresosInstructivoAprobar.value ||
      !listIngresosInstructivoAprobar.value.length ||
      !listIngresosInstructivoAprobar.value[0]!
    ) {
      Swal.fire({
        icon: "error",
        title: "Ocurrió un error",
        text: "No se pudieron calcular los ingresos y costos del instructivo. Verifique que existan opciones seleccionadas y costos configurados.",
        showConfirmButton: true,
      });
      return;
    }
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
      // @ts-expect-error the headers object goes in as the request config.
      .post<ApiResponse>(import.meta.env.VITE_URL_MAIN + "insert_monto_finales_quote", data, headers)
      .then((response) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const res = response.data;
      })
      .catch(
        (e) => console.error(e)
        // Swal.fire({
        //   icon: "error",
        //   title: "Ocurrió un error",
        //   text: e,
        //   showConfirmButton: true,
        // }),
      );
  }

  async function setNoteQuote(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "quote_note_insert",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const res = response.data;
        Swal.fire({
          icon: res.estadoflag == true ? "info" : "error",
          title: "Aviso",
          text: res.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function GetArchivos(folderUrl?: string | null): Promise<void> {
    if (!folderUrl) {
      return;
    }
    const config = {
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}listado_files`,
      params: {
        folderUrl: folderUrl,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios<ApiResponse<ArchivoDrive[]>>(config).then((response) => {
      const data = response.data;
      if (data.estadoflag) {
        // sessionStorage.setItem("auth-token", data.token);

        listadoFilesDrive.value = data.data;
      }
    });
  }

  async function getTextoWhatsapp(params: ParametrosTextoWhatsapp): Promise<void> {
    params.id_branch = sessionBranchId();
    try {
      const config = {
        method: "get",
        url: `${import.meta.env.VITE_URL_MAIN}get_texto_whatsapp`,
        params: params,
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await axios<ApiResponse<TextoWhatsappCotizacion[]>>(config);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { estadoflag, token, data } = response.data;

      if (estadoflag) {
        textWhatsapp.value = data;
      } else {
        textWhatsapp.value = [];
      }
    } catch (error) {
      console.error("Error al listar montos finales quote:", error);
    }
  }

  async function cargarTrabajadores(data?: Record<string, unknown>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res = {};
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_trabajadores`,
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };

    await axios<ApiResponse<EjecutivoCotizacion[]>>(config)
      .then(function (response) {
        setListEjecutivo(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function obtenerNombreTipoCosto(codigo: string): string {
    const tipoCosto = (listTipoCostos.value || []).find((tipo) => tipo && tipo.codigo == codigo);
    return tipoCosto?.name || "";
  }

  function GenerarIngresosInstrictivo(tipo: string): void {
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
              let factor = calcularFac(
                listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "N",
                datosPrincipales.value.volumen,
                datosPrincipales.value.peso,
                datosPrincipales.value.containers,
                datosPrincipales.value.amount
              );
              if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
                if ((factor as number) < 1) {
                  factor = 1;
                }
              }
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
              let factor = calcularFac(
                listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "N",
                datosPrincipales.value.volumen,
                datosPrincipales.value.peso,
                datosPrincipales.value.containers,
                datosPrincipales.value.amount
              );
              if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
                if ((factor as number) < 1) {
                  factor = 1;
                }
              }
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
                        (factor as number)
                    ),
                  });
                  totalFlete +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (factor as number);
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
                          : 0,
                        (element.minimo as number)
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
                      : 0,
                    (element.minimo as number)
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
                        (factor as number)
                    ),
                  });
                  totalOrigen +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (factor as number);
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
                          : 0,
                        (element.minimo as number)
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
                      : 0,
                    (element.minimo as number)
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
                        (factor as number)
                    ),
                  });
                  totalLocales +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (factor as number);
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
                          : 0,
                        (element.minimo as number)
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
                      : 0,
                    (element.minimo as number)
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
                        (factor as number)
                    ),
                  });
                  totalAduanas +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (factor as number);
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
                          : 0,
                        (element.minimo as number)
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
                      : 0,
                    (element.minimo as number)
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
                        (factor as number)
                    ),
                  });
                  totalAlmacenes +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (factor as number);
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
                          : 0,
                        (element.minimo as number)
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
                      : 0,
                    (element.minimo as number)
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
                        (factor as number)
                    ),
                  });
                  totalGastosTercero +=
                    ((listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                      ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.valor
                      : 0) as number) *
                    (element.costounitario as number) *
                    (factor as number);
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
                          : 0,
                        (element.minimo as number)
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
                      : 0,
                    (element.minimo as number)
                  );
                }
              }
            });
        }
        if (tipo == "TOTAL") {
          opcion.listCostos
            .filter((v) => v.status == 1 && v.esventaflag == 1)
            .forEach((element) => {
              let factor = calcularFac(
                listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                  ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                  : "N",
                datosPrincipales.value.volumen,
                datosPrincipales.value.peso,
                datosPrincipales.value.containers,
                datosPrincipales.value.amount
              );
              if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
                if ((factor as number) < 1) {
                  factor = 1;
                }
              }
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
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
                    (factor as number);
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
                      : 0,
                    (element.minimo as number)
                  );
                }
              }
            });
        }
        const categoriasIngresos = [
          {
            flag: "esfleteflag",
            rows: datosFlete,
            ajustarTotal: (diferencia: number) => (totalFlete += diferencia),
          },
          {
            flag: "esorigenflag",
            rows: datosOrigen,
            ajustarTotal: (diferencia: number) => (totalOrigen += diferencia),
          },
          {
            flag: "eslocalflag",
            rows: datosLocales,
            ajustarTotal: (diferencia: number) => (totalLocales += diferencia),
          },
          {
            flag: "esaduanaflag",
            rows: datosAduanas,
            ajustarTotal: (diferencia: number) => (totalAduanas += diferencia),
          },
          {
            flag: "esalmacenflag",
            rows: datosAlmacenes,
            ajustarTotal: (diferencia: number) => (totalAlmacenes += diferencia),
          },
          {
            flag: "esgastostercerosflag",
            rows: datosGastosTerceros,
            ajustarTotal: (diferencia: number) => (totalGastosTercero += diferencia),
          },
        ];

        categoriasIngresos.forEach(({ flag, rows, ajustarTotal }) => {
          const elementosCategoria = opcion.listCostos.filter(
            (element) => element.status == 1 && element.esventaflag == 1 && element[flag] == 1
          );

          elementosCategoria.forEach((element, index) => {
            if (!element.considerarvalorminimoflag || element.costounitario == 0) {
              return;
            }

            const multiplicador = listMultiplicador.value.find((item) => item.id == element.id_multiplicador);
            if (!multiplicador || [5, 13, 14].includes(Number(multiplicador.code))) {
              return;
            }

            let factor = calcularFac(
              multiplicador.code,
              datosPrincipales.value.volumen,
              datosPrincipales.value.peso,
              datosPrincipales.value.containers,
              datosPrincipales.value.amount
            );
            if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
              factor = Math.max((factor as number), 1);
            }

            const importeCalculado = Number(multiplicador.valor || 0) * Number(element.costounitario) * (factor as number);
            const importeMinimo = aplicarMinimoCosto(element, importeCalculado);
            const diferencia = importeMinimo - importeCalculado;

            if (diferencia > 0) {
              ajustarTotal(diferencia);
              if (tipo == "DETALLE" && rows[index]) {
                rows[index].valor = currencyFormat(importeMinimo);
              }
            }
          });
        });

        const DatosFinalesIngresos = [];
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
              descripcion: obtenerNombreTipoCosto("FL"),
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
              descripcion: obtenerNombreTipoCosto("OR"),
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
              descripcion: obtenerNombreTipoCosto("LO"),
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
              descripcion: obtenerNombreTipoCosto("AD"),
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
              descripcion: obtenerNombreTipoCosto("FL"),
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
              descripcion: obtenerNombreTipoCosto("AL"),
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
              descripcion: obtenerNombreTipoCosto("GT"),
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
  async function GenerarCostosInstrictivo(tipo: string): Promise<void> {
    opcionCostos.value
      .filter((v) => !!v.selected)
      .forEach(async (opcion) => {
        const dataCostos: LineaInstructivo[] = [];
        const totalFleteVentas = await calcularTotalFleteVentaPorOpcion(opcion.listCostos);
        opcion.listCostos
          .filter((v) => v.esopcionflag == 1 && v.status == 1)
          .forEach((element) => {
            let factor = calcularFac(
              listMultiplicador.value.filter((v) => v.id == element.id_multiplicador).length > 0
                ? listMultiplicador.value.filter((v) => v.id == element.id_multiplicador)[0]!.code
                : "N",
              datosPrincipales.value.volumen,
              datosPrincipales.value.peso,
              datosPrincipales.value.containers,
              datosPrincipales.value.amount
            );
            if (element.code_cost == 4 && (datosPrincipales.value.volumen as number) < 1) {
              if ((factor as number) < 1) {
                factor = 1;
              }
            }
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
                (factor as number);
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
                  : 0,
                (element.minimo as number)
              );
            }
            const proveedor = useAppStore().provedores.find((v: ProveedorPricing) => v.id == element.id_proveedor);
            dataCostos.push({
              proveedor: proveedor ? proveedor.namelong : "",
              service: element.nameservice,
              valor: montoDetails,
            });
          });
        let total = 0;
        const DatosFinalesCostos = [];
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
  async function calcularTotalFleteVentaPorOpcion(data: Costo[]): Promise<number> {
    return calcularTotalFleteVenta({ listCostos: data });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function isNotPorcentaje(element: Costo, id_multiplicador: Costo["id_multiplicador"]): boolean {
    const code = [5, 13, 14];

    const mul = listMultiplicador.value.some((v) => v.id == id_multiplicador && code.includes((v.code as number)));

    return !mul;
  }
  return {
    search,
    totalregistro,
    limit,
    pagina,
    dataCliente,
    step,
    id_master,
    nro_exp,
    preServices,
    preCostos,
    itemsDataRoleList,
    listadoResumen,
    listadoFilesDrive,
    selectedFile,
    actualizarCostosFlag,
    costoflag,
    impuestoflag,
    mostrarBtnActualizarFlag,
    bloquearBtnImprimir,
    vendedor,
    aprobadoflag,
    totalIngresos,
    totalCostos,
    totalIngresosAprobar,
    totalCostosAprobar,
    tiporeporte,
    abrirModalContenedor,
    index,
    cantidadOpcionesSeleccionadas,
    tab,
    llenadoCostos,
    actualizarComparativa,
    mostrarGuardarCostos,
    actualizarNotas,
    cancelarLlenadoNuevaOpcion,
    recargarCostoSeleccionados,
    reCalcularOpciones,
    reset,
    namesection,
    page,
    nombre_cotizacion,
    filtro,
    filtroCalls,
    ventaflag,
    dataQuote,
    filtrarQuoteFlag,
    filtrarCallsFlag,
    btnRegistrar,
    step2,
    step3,
    errfecha_fin,
    errtiempo_transito,
    id,
    nro_quote,
    urlFolder,
    mensaje,
    copy_quote,
    copylistServices,
    copylistCostos,
    copydatosPrincipales,
    datosPrincipales,
    opcionCostos,
    datosEmpresa,
    listQuotes,
    listCall,
    listMarketing,
    listQuoteStatus,
    listEjecutivo,
    listModality,
    listShipment,
    listIncoterms,
    listPortBegin,
    listPortEnd,
    listServices,
    listCostos,
    listMultiplicador,
    listRoles,
    errorValorMercancia,
    totalFlete,
    listNotasQuote,
    totalCosto,
    totalVenta,
    listImpuestos,
    listInstructivo,
    listRecibidoCotizacion,
    listEnviadoCliente,
    listIngresosInstructivoAprobar,
    listCostosInstructivoAprobar,
    listServiciosInstructivo,
    listImpuestosInstructivoAprobar,
    listTipoCostos,
    listIngresosInstructivo,
    listCostosInstructivo,
    listImpuestosInstructivo,
    textWhatsapp,
    e1,
    filtroSeleccionado,
    begEndList,
    fullflag,
    SET_RESET,
    SET_LIST_QUOTES,
    SET_LIST_CALLS,
    SET_LIST_MARKETING,
    resetQuoteNew,
    setEmisionPdf,
    quotePreviewInstructivoManual,
    guardarDatosInstructivo,
    obtenerRoles,
    ListarMontosFinalesQuoteMONGODB,
    getServices,
    getResumenPorEstado,
    getListQuote,
    getTipoCostos,
    getQuoteNoAsignadoHouse,
    getQuoteDataNoAsignadaHouse,
    getQuoteCall,
    getMarketingList,
    getQuoteStatus,
    getModulesEntities,
    getCargarEjecutivo,
    getPersonalPricing,
    getBegEndList,
    getModality,
    getShipment,
    getIncoterms,
    getPortBegin,
    getPortEnd,
    getItemsServices,
    obtenerCostosPricing,
    getItemsServicesDetails,
    getMultiplicador,
    getModuleRole,
    getCargarMasterDetalleNotasCotizacion,
    getImpuestos,
    registrarQuote,
    registrarQuotePorCambioIncoterms,
    copiarQuote,
    crearCarpetaOneDrive,
    actualizarURLEnElQuote,
    getQuote,
    getCotzacionCalculadora,
    getInstructivoId,
    obtenerDatosEmpresa,
    generarReporte,
    imprimiReporteListado,
    exportarExcelListadoQuote,
    imprimirMercadeo,
    imprimiReporteListadoCalls,
    getListRecibidoCotizacion,
    getListEnviadoCliente,
    actualizarQuoteRecibidoEnviado,
    guardarNotaQuote,
    updateQuote,
    eliminarRegistro,
    predata,
    validarCosto,
    validateCost,
    aprobarCotizacion,
    comienzaNoConCaracter,
    comienzaConCaracter,
    generaInstructivo,
    generaInstructivoparaguardata,
    imprimirInstructivoQuote,
    GuardaCostosFinalesQuote,
    setNoteQuote,
    GetArchivos,
    getTextoWhatsapp,
    cargarTrabajadores,
  };
});

export function getNombreCotizacion(
  state: Pick<ReturnType<typeof usePricingStore>, "datosPrincipales" | "listShipment" | "opcionCostos" | "nombre_cotizacion">,
): string {
  // COTIZACION  Servicio *Maritimo*  Salida Semanal. *CLIENTE No 10060*
  const tipoCarga = state.datosPrincipales.idtipocarga;
  let id = null;
  if (typeof tipoCarga === "object" && tipoCarga !== null) {
    id = tipoCarga.id;
  } else {
    id = tipoCarga;
  }

  const shipment = state.listShipment.find((v) => v.id == id);

  let Servicio = "";

  switch (shipment!.code) {
    case "Aéreo":
      Servicio = "Aéreo";
      break;
    case "LCL":
      Servicio = "Maritimo Consolidado Individual";
      break;
    case "FCL":
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Servicio = "Maritimo Contenedor Completo";
      break;

    default:
      break;
  }
  let containers = "";
  const nota = state.opcionCostos?.[0]?.listNotasQuote?.[0]?.descripcion || "";
  let name = ["COTIZACION", nota, state.datosPrincipales.nombre].filter(Boolean).join(" ");
  if (shipment!.code == "FCL") {
    containers = state.datosPrincipales.containers!.map((c) => c.code).join("_");
    name = `COTIZACION ${containers} FCL ${state.datosPrincipales.nombre}`;
  }

  state.nombre_cotizacion = name;
  return name;
}

function limpiarNombre(str: string): string {
  return str
    .normalize("NFD") // Separa los acentos del carácter base
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .replace(/ñ/g, "n") // Convierte ñ a n
    .replace(/Ñ/g, "N") // Convierte Ñ a N
    .replace(/\s+/g, "_") // Convierte espacios a guion bajo
    .replace(/[^a-zA-Z0-9_]/g, ""); // Elimina cualquier otro carácter especial que sobre
}

function aplicarMinimoCosto(element: Costo, importe: number): number {
  if (element.considerarvalorminimoflag && element.costounitario != 0) {
    return Math.max(Number(element.minimo || 0), Number(importe));
  }
  return importe;
}
