<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useDisplay } from "vuetify";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import moment from "moment";
import axios from "@/api/http";
import Swal from "sweetalert2";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import ArrastraYSolarComponent2 from "../comun/ArrastraYSolarComponentFile.vue";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { useHousesStore } from "@/stores/houses";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
import { useControlGastosStore } from "@/stores/controlGastos";
import type { ArchivoInicial } from "@/types/archivos";
import type { ControlGastoHouse } from "@/types/finanzas";
import type {
  DatosInstructivoManual,
  DeudaClienteHouse,
  DocumentoQuote,
  ExpedienteItem,
  FacturaEmitida,
  HouseIngreso,
  IngresoDetalle,
  IngresoForm,
  MonedaItem,
  Monto,
  ProformaFiscalForm,
} from "@/types/billingEntries";
import type { ApiResponse } from "@/types/api";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import { usePermissions } from "@/composables/usePermissions";
import type { AdminCredentials } from "@/types/seguridad";
import { askAdminCredentials, withAuthorization } from "@/utils/adminCredentials";
import CargarPagoClienteDialog from "./CargarPagoClienteDialog.vue";
import SoportesCobroDialog from "./SoportesCobroDialog.vue";
import type { SoporteDeSolicitud } from "./SoportesCobroDialog.vue";
import SolicitudCobroVerDialog from "./SolicitudCobroVerDialog.vue";
import {
  avisarIngresoBancosCobro,
  faltaRegistrarCobro,
  filasPorSoporte,
  montoCobrado,
  montoCobro,
  useSolicitudCobro,
} from "@/composables/useSolicitudCobro";
import type { DestinoPagoCliente, SolicitudCobro, SoporteCobro } from "@/types/solicitudCobro";
import { shortDate } from "@/utils/dates";
import { useSolicitudesMasterStore } from "@/stores/solicitudesMaster";

const componentProps = withDefaults(
  defineProps<{
    prFlag?: boolean;
    opFlag?: boolean;
    // eslint-disable-next-line vue/prop-name-casing
    ingreso_pr?: number;
    // eslint-disable-next-line vue/prop-name-casing
    ingreso_op?: number;
    editable?: boolean;
    // eslint-disable-next-line vue/prop-name-casing
    master_houses?: ControlGastoHouse[];
  }>(),
  {
    prFlag: false,
    opFlag: false,
    ingreso_pr: 0,
    ingreso_op: 0,
    editable: true,
    master_houses: undefined,
  },
);
const emit = defineEmits<{
  recalcularProfit: [];
}>();

const appStore = useAppStore();
// celular: diálogos grandes a pantalla completa
const { smAndDown } = useDisplay();
const { can } = usePermissions();
const route = useRoute();
const appRouter = useRouter();
const controlGastosStore = useControlGastosStore();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const housesStore = useHousesStore();
const enterprisesStore = useEnterprisesStore();
const pricingStore = usePricingStore();
const frmCopiar = useTemplateRef("frmCopiar");
const frmIngreso = useTemplateRef("frmIngreso");
const frmNuevoAbono = useTemplateRef("frmNuevoAbono");
const coinSelect = useTemplateRef("coinSelect");

const statusBtn = ref(1);
const dialogCopiar = ref(false);
const loadingFile = ref(false);
const loadingCopiarMonto = ref(false);
const listaDocumentosQuote = ref<DocumentoQuote[]>([
  {
    key: "cotizacion",
    label: "COTIZACIÓN DE VENTAS",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "facturaCommercial",
    label: "FACTURA COMERCIAL",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "listaEmpaque",
    label: "LISTA DE EMPAQUE",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "proforma",
    label: "PROFORMA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "fichaTecnica",
    label: "FICHA TÉCNICA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "soportePagoAlibaba",
    label: "SOPORTE DE PAGO DE ALIBABA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "soporteTransferenciaInternacional",
    label: "SOPORTE DE TRANSFERENCIA INTERNACIONAL",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "otros",
    label: "OTROS",
    flag: false,
    file: null,
    editable: true,
  },
  // {
  //   key: "agregarOtros",
  //   label: "AGREGAR OTROS",
  //   flag: false,
  //   file: null,
  //   editable: true,
  // },
]);
const dialogCargarArchivoCotizacion = ref(false);
const flagCambiarExpediente = ref(false);
const stepProforma = ref(1);
const firstCompleteProforma = ref(false);
const errorCoin = ref("");
const dialogFacturaEmitidas = ref(false);
const lstFacturasEmitidas = ref<FacturaEmitida[]>([]);
const nombreProforma = ref("PROFORMA");
const openedPanel = ref(null);
const payfile = ref([] as unknown as File);
const date = ref("");
const number = ref("");
const monto = ref<Monto>("");
const tipocambio = ref<Monto | undefined>("");
const id_banks = ref("");
const id_cuenta_pic = ref("");
const id_coins = ref<number | string | null | undefined>("");
const monto_abonado = ref<Monto | undefined>("");
const comentario = ref("");
const errfile = ref("");
const sufmoneda = ref<string | undefined>("");
const msgfile = ref("");
const obtenerDatosHouse = ref<boolean>(null as unknown as boolean);
const dialogFacturar = ref(false);
const dialogNewDebs = ref(false);
const dialogIngreso = ref(false);
const dialogDebs = ref(false);
const dialogDebsEdit = ref(false);
const loading = ref(false);
const savingIngreso = ref(false);
const boolFile = ref(false);
const house = ref({
  debscliente: [],
} as unknown as HouseIngreso);
const ingresos = ref<IngresoForm>({
  id: null,
  concepto: "",
  statusCalcula: false,
  opcion: null,
  numero: "",
  fecha: moment(new Date()).format("YYYY-MM-DD"),
  monto_op: 0,
  igv_op: 0,
  total_op: 0,
  monto_pr: 0,
  igv_pr: 0,
  total_pr: 0,
  id_coins: "",
  tipocambio: 1,
});
const headersdebs = [
  {
    title: "Documento",
    align: "start",
    sortable: false,
    key: "name",
  },
  {
    title: "Fecha",
    key: "date",
  },
  {
    title: "Monto En Dolares",
    key: "monto_letra",
  },
  {
    title: "Monto en Destino",
    key: "monto_destino",
  },
  {
    title: "Tipo Moneda En Destino.",
    key: "symbol_destino",
  },
  {
    title: "Comentario del Usuario.",
    key: "comentario_usuario",
  },
  {
    title: "Comentario de Admin.",
    key: "comentario_admin",
  },
  {
    title: "Status",
    key: "status",
  },
  {
    title: "Ver",
    key: "accion",
  },
] as const;
const headersFacturas = ref([
  { title: "Concepto", key: "concepto" },
  // { text: "Monto Pr", value: "monto_pr" },
  // { text: "IGV Pr", value: "igv_pr" },
  // { text: "Total Pr", value: "total_pr" },
  // { text: "Monto Op", value: "monto_op" },
  // { text: "IGV Op", value: "igv_op" },
  // { text: "Total Op", value: "total_op" },
  { title: "Monto Op", key: "montoopcuentabanco" },
  { title: "IGV Op.", key: "igvopcuentabanco" },
  { title: "Total Op", key: "totalopcuentabanco" },
  { title: "Tipo Cambio", key: "tipocambio" },
]);
const conceptos = ref<IngresoDetalle[]>([]);
const selected = ref<IngresoDetalle[]>([]);
const isDataTableLoading = ref(false);
const dialogFacturasFiscales = ref(false);
const dialogProformaFiscal = ref(false);
const headersFacturasFiscales = [
  { title: "Nombre", key: "originalname" },
  { title: "Fecha", key: "fecha" },
  { title: "Ver", key: "path" },
  { title: "Acción", key: "action" },
] as const;
const proformaFiscal = ref<ProformaFiscalForm>({
  id_consigner: "",
  nameconsigner: "",
  tipo_pago: "1",
  nro_factura: "",
  fecha: moment().format("YYYY-MM-DD"),
  archivo: "",
  id_master: "",
  id_correlativo: "",
});
const mostrarImpuesto = ref<boolean | undefined>(true);
const dialogCambiarExpediente = ref(false);
const selectedNuevoExpediente = ref<number | null>(null);
const listaDocumentos = ref<DocumentoQuote[]>([]);
const datosinstructivomanual = ref<DatosInstructivoManual>({});
const id_quote = ref<number | null>(null);

let payPath: number | string | undefined;
const warnIfRefused = (response: ApiResponse) => {
  if (response.estadoflag) return false;
  Swal.fire({ icon: response.tipomensaje === "TMSGERR" ? "error" : "warning", text: response.mensaje });
  return true;
};
const masterHouses = computed(() => componentProps.master_houses as unknown as HouseIngreso[]);
const datosManuales = undefined as unknown as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let ingreso: object | undefined;
let id: number | undefined;

function abrirModalRegistroDocumentoHouse(datosInstructivoManual: DatosInstructivoManual, idQuote: number) {
  datosinstructivomanual.value = datosInstructivoManual;
  listaDocumentos.value = datosInstructivoManual.listaDocumentos
    ? datosInstructivoManual.listaDocumentos
    : listaDocumentosQuote.value;
  id_quote.value = idQuote;
  dialogCargarArchivoCotizacion.value = true;
}
function cargarArchivoDinamico(datoEmit: { archivo: unknown }, doc: DocumentoQuote) {
  doc.file = datoEmit.archivo as ArchivoInicial | null;
  doc.flag = true;
}
function eliminarArchivoDinamico(doc: DocumentoQuote) {
  doc.file = null;
  doc.flag = false;
}
async function setDatosInstructivo() {
  loadingFile.value = true;
  await pricingStore.guardarDatosInstructivo({
    id: id_quote.value,
    datosInstructivoManual: {
      ...datosManuales,
      listaDocumentos: listaDocumentos.value,
      table_allpath_list: listaDocumentos.value,
    },
  });
  loadingFile.value = false;
  dialogCargarArchivoCotizacion.value = false;
  Swal.fire({
    icon: "success",
    title: "Datos guardados correctamente.",
    text: " Se han guardado. Recargue la página para ver los cambios reflejados.",
  }).then(async () => {
    await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  });
}
function continueStep2() {
  stepProforma.value = 2;
  firstCompleteProforma.value = true;
}
function abrirCotizacion(id: number) {
  const routeData = appRouter.resolve({
    name: "verQuote",
    params: { id: id },
  });
  window.open(routeData.href, "_blank");
}
function recibirId(file: { id: unknown; archivo: unknown }) {
  console.log("aqui", file);
  payPath = file.id as number;
  payfile.value = file.archivo as File;

  msgfile.value = "Archivo procesado y vinculado correctamente.";
  errfile.value = "";
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _openDebs(houseSeleccionado: HouseIngreso) {
  house.value = houseSeleccionado;
  dialogDebs.value = true;
}
function handleNuevoIngreso(index: number, house: HouseIngreso) {
  nuevoIngreso(house);
  abrirExpandIngreso(index);
}
function formatUsd(val: Monto) {
  return `${parseFloat(String(val)).toFixed(2)} USD`;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getQuoteNumber(house: HouseIngreso) {
  return house.id_cot || "-";
}
function openDoc(path: string) {
  window.open(path, "_blank");
}
// abriModalCopiar(ingreso, bloquearCopiarMontos) {
//   this.ingreso = {};
//   if (bloquearCopiarMontos) {
//     return;
//   }

//   this.ingresos = ingreso;
//   this.dialogCopiar = true;
// },
function abriModalCopiar(house: HouseIngreso, bloquearCopiarMontos: boolean) {
  if (house.ingresos && house.ingresos.some((v) => (v.total_op as number) > 0)) {
    // Nota: en JavaScript el método correcto es .filter() en lugar de .filtro()
    const montosConMontosMayoresACero = house.ingresos.filter(
      (v) => (v.total_op as number) > 0,
    );

    // Generar las filas de la tabla dinámicamente con los datos obtenidos
    const filasHTML = montosConMontosMayoresACero
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${
        item.concepto || "COMISIÓN"
      }</td>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">$${(item.total_pr as number).toFixed(
        2,
      )}</td>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #212529;">$${(item.total_op as number).toFixed(
        2,
      )}</td>
        </tr>
      `,
      )
      .join("");

    Swal.fire({
      title: "Monto en Operaciones",
      html: `
          <p style="margin-bottom: 20px; color: #555; font-size: 14px;">
            Este concepto tiene un monto en Operaciones.<br>No se modificará.
          </p>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
              <tr style="background-color: #f1f3f5; color: #495057;">
                <th style="padding: 10px; border-bottom: 1px solid #dee2e6;">Concepto</th>
                <th style="padding: 10px; border-bottom: 1px solid #dee2e6;">Pricing</th>
                <th style="padding: 10px; border-bottom: 1px solid #dee2e6;">Operaciones</th>
              </tr>
            </thead>
            <tbody>
              ${filasHTML}
            </tbody>
          </table>
        `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0056b3",
      cancelButtonColor: "#ffffff",
      customClass: {
        cancelButton: "swal2-cancel-custom",
      },
      reverseButtons: true,
      didRender: () => {
        const cancelBtn = Swal.getCancelButton();
        if (cancelBtn) {
          cancelBtn.style.color = "#212529";
          cancelBtn.style.border = "1px solid #ced4da";
        }
      },
    }).then((respuesta) => {
      if (respuesta.isConfirmed) {
        ingreso = {};
        if (bloquearCopiarMontos) {
          return;
        }

        ingresos.value = house as unknown as IngresoForm;
        dialogCopiar.value = true;
      }
    });
  } else {
    ingreso = {};
    if (bloquearCopiarMontos) {
      return;
    }

    ingresos.value = house as unknown as IngresoForm;
    dialogCopiar.value = true;
  }
}
// un solo copiado por clic: el loading se activa antes de validar y se libera aunque falle
async function copiarMontos() {
  if (loadingCopiarMonto.value) return;
  loadingCopiarMonto.value = true;
  try {
    if (!(await frmCopiar.value!.validate()).valid) return;
    await controlGastosStore.copiarCGingresos({
      ...ingresos.value,
      tipocambio: ingresos.value.tipocambio || 1,
    });
    await controlGastosStore.getListControlGastosHouses(route.params.id as string);
    dialogCopiar.value = false;
  } finally {
    loadingCopiarMonto.value = false;
  }
}
// copiarMontosHouse(house, bloquearCopiarMontos) {
//   console.log(house);
//   if (bloquearCopiarMontos) {
//     return;
//   }
//   Swal.fire({
//     icon: "question",
//     title: "Copiar Montos de Pricing a Operaciones",
//     text: `¿Desea copiar los Montos del house ${house.code_house} Pricing a Operaciones `,
//     allowEnterKey: false,
//     allowOutsideClick: false,
//     allowEscapeKey: false,
//     showCancelButton: false,
//     showDenyButton: true,
//     confirmButtonText: "Copiar",
//     denyButtonText: "Cancelar",
//   }).then(async (res) => {
//     if (res.isConfirmed) {
//       await this.copiarCGingresos({ id_orders: house.id_orders });
//       await this.getListControlGastosHouses(this.$route.params.id);
//     }
//   });
//   // console.log(id_orders);
// },
function _newDebs() {
  loading.value = false;
  boolFile.value = false;
  payfile.value = [] as unknown as File;
  date.value = "";
  number.value = "";
  monto.value = "";
  tipocambio.value = "";
  id_banks.value = "";
  id_cuenta_pic.value = "";
  id_coins.value = "";
  monto_abonado.value = "";
  comentario.value = "";
  filesStore.payPath = null;
  dialogNewDebs.value = true;
}
function abrirExpandIngreso(index: number) {
  controlGastosStore.master_houses[index]!.isExpanded =
    controlGastosStore.master_houses[index]!.isExpanded;
}
function editIngreso(item: IngresoDetalle) {
  dialogIngreso.value = true;
  setTimeout(() => {
    frmIngreso.value!.reset();
  }, 100);
  setTimeout(() => {
    statusBtn.value = 2;
    ingresos.value = {
      ...item,
      statusCalcula: item.igv_pr != 0 || item.igv_op != 0 ? true : false,
      montoopview: item.monto_op,
      igvopview: item.igv_op,
      totalopview: item.total_op,
      // fecha: moment(new Date()).format("YYYY-MM-DD"),
      opcion: item.tipo_pago,
    } as IngresoForm;
    id_coins.value = item.id_coins;
    tipocambio.value = item.tipocambio;
    dialogIngreso.value = true;
  }, 100);
}
function abrirModalFacturar(houseSeleccionado: HouseIngreso) {
  conceptos.value = houseSeleccionado.ingresos || [];
  const simbolosUnicos = new Set(conceptos.value.map((item) => item.symbol));
  const tieneSimbolosDiferentes = simbolosUnicos.size > 1;

  if (tieneSimbolosDiferentes) {
    Swal.fire({
      icon: "error",
      html: "¡Alerta! Hay múltiples monedas en los ingresos",
    });
    return;
  }

  id_coins.value = conceptos.value[0] ? conceptos.value[0].id_coins : null;
  stepProforma.value = 1;
  house.value = houseSeleccionado;
  selected.value = [];
  dialogFacturar.value = true;
}
async function nuevoControlGasto(house: HouseIngreso) {
  await controlGastosStore.setControl(house);
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  appStore.spiner = false;
}
function obtenerMoneda() {
  const monedas = [...appStore.itemsCoinsList];
  sufmoneda.value = monedas.find(
    (v: MonedaItem) => v.id == ingresos.value.id_coins,
  )?.symbol;
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  sufmoneda.value == "USD"
    ? (tipocambio.value = 1)
    : (tipocambio.value = tipocambio.value);
}
function calcularE() {
  if (tipocambio.value) {
    const partes = tipocambio.value.toString().split(".");
    const decimales = partes[1] ? partes[1].length : 0;
    if (decimales > 4) {
      tipocambio.value = parseFloat(String(tipocambio.value)).toFixed(4);
    }
  }
  let igv = 0;
  if (ingresos.value.statusCalcula) {
    igv = (enterprisesStore.impuesto.impuesto as number) / 100;
  }

  // ------------------------------------------------------ montos

  ingresos.value.igv_pr = parseFloat(String((ingresos.value.monto_pr as number) * igv)).toFixed(
    2,
  );
  ingresos.value.igvopcuentabanco = parseFloat(
    String((ingresos.value.montoopcuentabanco as number) * igv),
  ).toFixed(2);
  ingresos.value.total_pr =
    parseFloat(String(ingresos.value.monto_pr)) +
    parseFloat(String((ingresos.value.monto_pr as number) * igv));
  // operaciones
  ingresos.value.totalopcuentabanco = parseFloat(
    String(parseFloat(String(ingresos.value.montoopcuentabanco)) +
      parseFloat(ingresos.value.igvopcuentabanco)),
  ).toFixed(2);
  // ---------------------------------------------operaciones
  ingresos.value.montoopview = parseFloat(
    String((ingresos.value.montoopcuentabanco as number) / (ingresos.value.tipocambio as number)),
  ).toFixed(2);
  ingresos.value.igvopview = parseFloat(
    String((ingresos.value.montoopview as unknown as number) * igv),
  ).toFixed(4);
  ingresos.value.totalopview = parseFloat(
    String(parseFloat(ingresos.value.montoopview) +
      parseFloat(ingresos.value.igvopview)),
  ).toFixed(4);
}
function calcularMontoDolar() {
  monto.value = parseFloat(
    String(((monto_abonado.value ? monto_abonado.value : 0) as number) / (tipocambio.value as number)),
  ).toFixed(2);
}
async function _setDebsClient() {
  calcularMontoDolar();
  loading.value = true;
  if ((await frmNuevoAbono.value!.validate()).valid) {
    Swal.fire({
      icon: "info",
      title: "Cargando pago...",
      text: "Por favor espere",
    });
    const data = {
      id_house: house.value.id_house,
      date: date.value,
      number: number.value,
      id_banks: id_banks.value,
      monto: monto.value,
      comentario_usuario: comentario.value,
      id_path: filesStore.payPath,
      id_cuenta_pic: id_cuenta_pic.value,
      tipocambio: tipocambio.value,
      id_moneda_destino: id_coins.value,
      monto_destino: monto_abonado.value,
      nro_operacion: number.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setDebsClient",

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await request(config);
    if (warnIfRefused(response)) {
      loading.value = false;
      return;
    }
    dialogNewDebs.value = false;
    dialogDebs.value = false;
    await controlGastosStore.getListControlGastosHouses(route.params.id as string);
    cleandData();
    Swal.fire({
      icon: "success",
      title: "Pago registrado",
      text: "El pago del cliente quedó registrado.",
    });
  }
  loading.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function listControlGasto() {
  appStore.spiner = true;
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  appStore.spiner = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function uploadFile() {
  msgfile.value = "";
  errfile.value = "";
  if (payfile.value) {
    loadingFile.value = true;
    await filesStore._uploadFile(payfile.value);
    loadingFile.value = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filesStore.payPath
      ? (msgfile.value = "Archivo cargado")
      : (errfile.value = "Comuniquese con el admistrador");
  } else {
    errfile.value = "Dato Requerido";
  }
}
function nuevoIngreso(houseSeleccionado: HouseIngreso) {
  statusBtn.value = 1;

  dialogIngreso.value = true;

  setTimeout(() => {
    frmIngreso.value!.reset();
    ingresos.value = {
      id_correlativo: houseSeleccionado.id_correlativo,
      id: null,
      concepto: "",
      statusCalcula: false,
      opcion: null,
      numero: "",
      fecha: moment(new Date()).format("YYYY-MM-DD"),
      monto_op: 0,
      igv_op: 0,
      total_op: 0,
      monto_pr: 0,
      igv_pr: 0,
      total_pr: 0,
      montoopview: 0,
      igvopview: 0,
      totalopview: 0,
      tipocambio: 1,
      id_orders: houseSeleccionado.id_orders,
    } as IngresoForm;
    house.value = houseSeleccionado;
  }, 500);
}
// calcular() {
//   if (this.ingresos.statusCalcula) {
//     this.ingresos.igv_op = parseFloat(
//       (this.ingresos.monto_op *
//         this.$store.state.enterprises.impuesto.impuesto) /
//         100,
//     ).toFixed(2);
//     this.ingresos.igv_pr = parseFloat(
//       (this.ingresos.monto_pr *
//         this.$store.state.enterprises.impuesto.impuesto) /
//         100,
//     ).toFixed(2);
//     this.ingresos.total_op =
//       parseFloat(this.ingresos.monto_op) + parseFloat(this.ingresos.igv_op);
//     this.ingresos.total_pr =
//       parseFloat(this.ingresos.monto_pr) + parseFloat(this.ingresos.igv_pr);
//   } else {
//     this.ingresos.igv_op = 0.0;
//     this.ingresos.igv_pr = 0.0;
//     this.ingresos.total_op =
//       parseFloat(this.ingresos.monto_op) + parseFloat(this.ingresos.igv_op);
//     this.ingresos.total_pr =
//       parseFloat(this.ingresos.monto_pr) + parseFloat(this.ingresos.igv_pr);
//   }
// },
function editarDebs(item: DeudaClienteHouse) {
  id = item.id;
  date.value = item.date;
  number.value = item.number;
  monto.value = item.monto;
  tipocambio.value = item.tipocambio;
  id_banks.value = item.id_banks;
  id_cuenta_pic.value = item.id_cuenta_pic;
  id_coins.value = item.id_moneda_destino;
  monto_abonado.value = item.monto_destino;
  comentario.value = item.comentario_usuario;
  dialogDebsEdit.value = true;
}
function cleandData() {
  date.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .substr(0, 10);
  number.value = "";
  monto.value = 0;
  comentario.value = "";
  payfile.value = [] as unknown as File;
  payPath = "";
  boolFile.value = false;
  id_cuenta_pic.value = "";
  tipocambio.value = 1;
  id_coins.value = "";
  monto_abonado.value = "";
  number.value = "";
}
async function _delDebsClient(id: number) {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "delDebsClient/" + id,

    headers: {
      "Content-Type": "application/json",
    },
  };
  if (warnIfRefused(await request(config))) return;
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  dialogDebs.value = false;
}
async function editIngresos() {
  if (!(await frmIngreso.value!.validate()).valid) {
    return;
  }

  const house = masterHouses.value.find(
    (v) =>
      v.id_house == ingresos.value.id_house &&
      v.id_correlativo == ingresos.value.id_correlativo,
  );

  if (!!house) {
    const exiteOtraMoneda = house.ingresos.some(
      (v) => v.id_coins != ingresos.value.id_coins,
    );
    if (exiteOtraMoneda) {
      Swal.fire({
        icon: "warning", // Cambiado a 'warning' porque es una restricción del sistema, no un fallo crítico.
        title: "MONEDAS SOLES DOLARES",
        html: `<b>Hay conceptos con monedas diferentes</b><br><br>Por favor chequear. NO SE CARGARÁ EL COSTO.`,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }
  }

  const data = {
    ...ingresos.value,
    code_master: route.params.code_master as string,
    tipo_pago: ingresos.value.opcion,
    // tipocambio: this.tipocambio,git status
  };
  if (!(await controlGastosStore.actualizarIngresos(data))) return;
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  statusBtn.value = 1;
  dialogIngreso.value = false;
  emit("recalcularProfit");
}
async function delIngreso(item: IngresoDetalle, house: HouseIngreso) {
  const deuda = getDeudaActual(house);
  const hasPayment = (house.total_total_op_ingresos as number) > (deuda as number);
  if (!hasPayment && can("listControlGastos", "ELIMINAR")) return continuarEliminar(item.id);
  if (hasPayment) {
    const { isConfirmed } = await Swal.fire({
      width: "430px",
      padding: "18px 22px 16px",
      background: "#ffffff",
      showCloseButton: true,

      title: "",

      html: `
            <div class="delete-modal-content">

              <!-- ILUSTRACIÓN -->
              <div class="delete-warning-icon">

                <!-- Documento -->
                <div class="delete-document">

                  <div class="delete-document-fold"></div>

                  <div class="delete-dollar">$</div>

                  <div class="delete-line line-1"></div>
                  <div class="delete-line line-2"></div>
                  <div class="delete-line line-3"></div>
                  <div class="delete-line line-4"></div>

                </div>

                <!-- Rayos -->
                <div class="delete-ray ray-1"></div>
                <div class="delete-ray ray-2"></div>
                <div class="delete-ray ray-3"></div>

                <!-- Candado -->
                <div class="delete-lock">

                  <div class="delete-lock-shackle"></div>

                  <div class="delete-lock-body">
                    <div class="delete-lock-key"></div>
                  </div>

                </div>

              </div>

              <!-- TÍTULO -->
              <div class="delete-title">
                No es posible eliminar
              </div>

              <!-- MENSAJE -->
              <div class="delete-message">
                Tiene un pago asociado en Administración.
              </div>

            </div>
          `,

      icon: false as unknown as undefined,

      showCancelButton: true,

      confirmButtonText: `
            <span class="delete-confirm-content">
              <i class="fas fa-key"></i>
              <span>Usar clave de administrador</span>
            </span>
          `,

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#0878dc",
      cancelButtonColor: "#ffffff",

      buttonsStyling: false,

      customClass: {
        popup: "swal-delete-popup",
        closeButton: "swal-delete-close",
        confirmButton: "swal-delete-confirm",
        cancelButton: "swal-delete-cancel",
      },
      reverseButtons: true,
      didOpen: () => {
        const popup = Swal.getPopup();

        if (popup) {
          popup.style.borderRadius = "26px";
          popup.style.boxShadow = "0 18px 50px rgba(15, 23, 42, 0.18)";
        }
      },
    });
    if (!isConfirmed) return;
  }
  const admin = await askAdminCredentials("Para eliminar este ingreso, escribe el usuario y la clave de un administrador.");
  if (!admin) return;
  await continuarEliminar(item.id, admin);
}
async function continuarEliminar(id: number | undefined, admin?: AdminCredentials) {
  Swal.fire({
    icon: "question",
    title: "Eliminar",
    text: "¿Desea Eliminar El registro?",
    showCancelButton: true,
    confirmButtonColor: "red",
    confirmButtonText: "Si, Eliminar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      const data = {
        code_master: route.params.code_master as string,
        id: id as number,
      };
      if (!(await controlGastosStore.eliminarIngreso(data, admin))) return;
      await controlGastosStore.getListControlGastosHouses(route.params.id as string);
      emit("recalcularProfit");
    }
  });
}
async function setIngresos() {
  if (savingIngreso.value || !(await frmIngreso.value!.validate()).valid) {
    return;
  }
  const houseExistente = masterHouses.value.find(
    (v) =>
      v.id_orders == ingresos.value.id_orders &&
      v.id_correlativo == ingresos.value.id_correlativo,
  );

  if (!!houseExistente) {
    const exiteOtraMoneda = houseExistente.ingresos.some(
      (v) => v.id_coins != ingresos.value.id_coins,
    );
    if (exiteOtraMoneda) {
      Swal.fire({
        icon: "warning", // Cambiado a 'warning' porque es una restricción del sistema, no un fallo crítico.
        title: "MONEDAS SOLES DOLARES",
        html: `<b>Hay conceptos con monedas diferentes</b><br><br>Por favor chequear. NO SE CARGARÁ EL COSTO.`,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }
  }

  const data = {
    ...ingresos.value,
    code_master: route.params.code_master as string,
    id_orders: house.value.id_orders,
    tipo_pago: ingresos.value.opcion,
    numero: ingresos.value.numero,
    fecha: ingresos.value.fecha,
    id_master: route.params.id as string,
  };
  savingIngreso.value = true;
  const saved = await controlGastosStore.guardarIngresos(data);
  savingIngreso.value = false;
  if (!saved) return;
  dialogIngreso.value = false;
  emit("recalcularProfit");
}
async function actualizar() {
  if ((await frmNuevoAbono.value!.validate()).valid) {
    Swal.fire({
      icon: "info",
      title: "Cargando pago...",
      text: "Por favor espere",
    });
    const data = {
      id_house: house.value.id_house,
      date: date.value,
      number: number.value,
      id_banks: id_banks.value,
      monto: monto.value,
      comentario_usuario: comentario.value,
      id_path: filesStore.payPath,
      id_cuenta_pic: id_cuenta_pic.value,
      tipocambio: tipocambio.value,
      id_moneda_destino: id_coins.value,
      monto_destino: monto_abonado.value,
      nro_operacion: number.value,
      id: id,
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_debs_client",

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    if (warnIfRefused(await request(config))) return;
    cleandData();
    Swal.fire({
      icon: "success",
      title: "Pago actualizado",
      text: "Los cambios del pago quedaron guardados.",
    }).then(async (result) => {
      if (result.isConfirmed) {
        dialogDebsEdit.value = false;
        dialogDebs.value = false;
        await controlGastosStore.getListControlGastosHouses(route.params.id as string);
      }
    });
  }
}
async function generarDocumento() {
  errorCoin.value = "";
  if (!id_coins.value) {
    errorCoin.value = "Seleccione una moneda";
    coinSelect.value!.focus();
    return;
  }
  const [first] = selected.value;
  obtenerDatosHouse.value = true;
  const proforma = (await request({
    method: "post",
    url: `${import.meta.env.VITE_URL_MAIN}generar_factura`,
    data: {
      id_house: first!.id_house,
      id_correlativo: first!.id_correlativo,
      id_coins: id_coins.value,
      conceptos: selected.value.map(({ id }) => id),
      nombreProforma: nombreProforma.value,
    },
  })) as ApiResponse & { path: string; nro_factura: string };
  if (warnIfRefused(proforma)) {
    obtenerDatosHouse.value = false;
    return;
  }
  await registrarFactura(proforma);
  dialogFacturar.value = false;
  nombreProforma.value = "PROFORMA";
  obtenerDatosHouse.value = false;
}
async function registrarFactura(proforma: { nro_factura: string; path: string }) {
  const [first] = selected.value;
  const response = await request({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "registrar_factura",
    data: {
      id_house: first!.id_house,
      id_coins: id_coins.value,
      id_correlativo: first!.id_correlativo,
      nro_factura: proforma.nro_factura,
      url_documento: import.meta.env.VITE_URL_MAIN + proforma.path,
      details: selected.value.map(({ id }) => ({ id })),
    },
  });
  if (warnIfRefused(response)) return;
  window.open(import.meta.env.VITE_URL_MAIN + proforma.path, "_blank");
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
}
function isBotonEmitirProformaDisabled(house: Partial<HouseIngreso> = {}) {
  let disabled = false;

  if (
    house.total_total_pr_ingresos == 0 &&
    house.total_total_op_ingresos == 0
  ) {
    disabled = !disabled;
  } else if (house.ingresos!.every((v) => v.facturado)) {
    disabled = !disabled;
  }

  return disabled;
}
function getDeudaActual(data: Partial<HouseIngreso> = {}) {
  const { total_total_op_ingresos = 0, totalpagadodolar } = data;
  const deuda =
    parseFloat(String(total_total_op_ingresos)) -
    parseFloat(String(totalpagadodolar ? totalpagadodolar : 0));

  return deuda != 0 ? deuda.toFixed(2) : 0;
}
async function abrirModalFacturasFiscales(houseSeleccionado: Partial<HouseIngreso> = {}) {
  house.value = houseSeleccionado as HouseIngreso;
  dialogFacturasFiscales.value = true;

  isDataTableLoading.value = true;
  await housesStore.getFacturasFiscales(houseSeleccionado as HouseIngreso);
  isDataTableLoading.value = false;
}
function cargarProformaFiscal() {
  boolFile.value = false;
  msgfile.value = "";
  errfile.value = "";
  proformaFiscal.value = {
    ...proformaFiscal.value,
    tipo_pago: "1",
    nro_factura: "",
    fecha: moment().format("YYYY-MM-DD"),
    archivo: filesStore.payPath,
    status: 1,
    id_house: house.value.id_house,
  };

  dialogProformaFiscal.value = true;
}
async function registrarProformaFiscal() {
  Swal.fire({
    icon: "info",
    title: "Guardando...",
    text: "Por favor, espere",
  });

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setProformaFiscal",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      ...proformaFiscal.value,
      id_correlativo: house.value.id_correlativo,
      id_path: payPath,
    },
  };

  await axios(config).then(async function (response) {
    sessionStorage.setItem("auth-token", response.data.token);

    if (response.data.estadoflag) {
      Swal.fire({
        icon: "success",
        title: "Documento Cargado",
        text: "El documento ha sido cargado correctamente",
      });
      appStore.spiner = true;
      await Promise.all([
        housesStore.getFacturasFiscales(house.value),
        controlGastosStore.getListControlGastosHouses(route.params.id as string),
      ]);
      appStore.spiner = false;
    } else {
      Swal.fire({
        icon: "error",
        text: response.data.mensaje,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      }).then((resSwal) => {
        if (resSwal.isConfirmed && response.data.status == "401") {
          // @ts-expect-error router is not imported here
          router.push({ name: "Login" });
          setTimeout(() => {
            window.location.reload();
          }, 10);
        }
      });
    }
  });

  dialogProformaFiscal.value = !dialogProformaFiscal.value;
}
async function eliminarProformaFiscal(id: number | string = "") {
  Swal.fire({
    icon: "question",
    title: "Eliminar Proforma Fiscal",
    text: "¿Desea Eliminar la Factura Fiscal?",
    denyButtonText: "Cancelar",
    confirmButtonText: "Si, Eliminar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "delProformaFiscal/" + id,
        headers: {
          "Content-Type": "application/json",
        },
      };

      await axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            Swal.fire({
              icon: "success",
              title: "Información",
              text: response.data.mensaje,
            });

            isDataTableLoading.value = true;
            appStore.spiner = true;
            await Promise.all([
              housesStore.getFacturasFiscales(house.value),
              controlGastosStore.getListControlGastosHouses(route.params.id as string),
            ]);
            isDataTableLoading.value = false;
            appStore.spiner = false;
          } else {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                // @ts-expect-error router is not imported here
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
  });
}
function activarFactura(item: IngresoDetalle) {
  item.verFactura = !item.verFactura;
}
async function verProformas(item: HouseIngreso) {
  const config = {
    method: "get",
    url: `${import.meta.env.VITE_URL_MAIN}ver_factura_house`,
    params: {
      id: item.id_house,
      id_correlativo: item.id_correlativo,
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config).then(function (response) {
    if (response.data.estadoflag) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const res = response.data.data;
      lstFacturasEmitidas.value = response.data.data;
      dialogFacturaEmitidas.value = true;
    } else {
      const res = response.data;
      console.log(res);
      Swal.fire({
        icon: "warning",
        text: res.mensaje,
      });
    }
  });
}
function abrirPdf(url: string) {
  window.open(url, "_blank");
}
async function abrirModalCambiarExpediente(houseSeleccionado: Partial<HouseIngreso> = {}) {
  house.value = houseSeleccionado as HouseIngreso;

  flagCambiarExpediente.value = true;

  selectedNuevoExpediente.value = Number(route.params.id) || null;
  dialogCambiarExpediente.value = true;
  flagCambiarExpediente.value = false;
}
async function aplicarCambioExpediente() {
  if (!house.value || !selectedNuevoExpediente.value) return;
  if (
    Number(selectedNuevoExpediente.value) === Number(route.params.id)
  ) {
    dialogCambiarExpediente.value = false;
    return;
  }
  const targetLabel = appStore.itemsMasterList.find(
    (x: ExpedienteItem) => x.id === selectedNuevoExpediente.value,
  )!.code_master;
  const res = await Swal.fire({
    icon: "question",
    title: "Confirmar cambio",
    text: `¿Desea mover el house ${house.value.code_house} (con todos sus registros) al master ${targetLabel}?`,
    showCancelButton: true,
    confirmButtonText: "Sí, cambiar",
    cancelButtonText: "Cancelar",
  });
  if (!res.isConfirmed) return;

  try {
    const payload = {
      id_orders: house.value.id_orders,
      id_house: house.value.id_house,
      id_master_origen: Number(route.params.id),
      id_master_destino: Number(selectedNuevoExpediente.value),
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "reasignar_house",
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    };
    const response = await axios(config);
    flagCambiarExpediente.value = false;
    dialogCambiarExpediente.value = false;
    await controlGastosStore.getListControlGastosHouses(route.params.id as string);
    if (response && response.data && response.data.estadoflag) {
      await Swal.fire({ icon: "success", text: "Expediente actualizado" });
      dialogCambiarExpediente.value = false;
      flagCambiarExpediente.value = true;
    } else {
      await Swal.fire({
        icon: "warning",
        text:
          (response && response.data && response.data.mensaje) ||
          "No pudimos cambiar el expediente. Intenta de nuevo en unos minutos.",
      });
    }
  } catch (error) {
    console.error(error);
    await Swal.fire({
      icon: "error",
      text: CONNECTION_ERROR_MESSAGE,
    });
  }
}
async function eliminarFactura(item: number) {
  dialogFacturaEmitidas.value = false;
  const admin = await askAdminCredentials("Para anular esta factura, escribe el usuario y la clave de un administrador.");
  if (!admin) return;

  const { value: motivo } = await Swal.fire({
    title: "Anular factura",
    input: "textarea",
    inputLabel: "Motivo de la anulación",
    inputPlaceholder: "Por ejemplo: datos del cliente errados",
    showCancelButton: true,
    confirmButtonText: "Anular factura",
    cancelButtonText: "Cancelar",
    inputValidator: (text) => (text.trim() ? null : "Escribe el motivo de la anulación."),
  });
  if (!motivo) return;

  const response = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "anular_factura",
    data: { id: item, motivo, ...withAuthorization(admin) },
  });
  if (warnIfRefused(response)) return;
  await Swal.fire({ icon: "success", title: "Factura anulada", text: response.mensaje });
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
}
function bloquearCopiarMontos(ingresos: IngresoDetalle[]) {
  return ingresos.some((v) => v.facturado);
}
function mostrarMontoOperativos(ingresos: IngresoDetalle[]) {
  const existeMonedaDiferenteADolar = ingresos.some(
    (v) => v.acronym !== "USD",
  );

  return existeMonedaDiferenteADolar;
}

// ---------- Solicitud de Cobro: Cargar Pago Cliente / Enviar a Administración ----------
// mismos datos que la sección "Solicitudes de Cobro": una sola llamada para las dos
const solicitudesMasterStore = useSolicitudesMasterStore();
const idMasterCobro = computed(() => Number(route.params.id) || 0);
const solicitudesCobro = computed<SolicitudCobro[]>(() => solicitudesMasterStore.cobros[idMasterCobro.value] ?? []);
const dialogPagoCliente = ref(false);
const destinoPagoCliente = ref<DestinoPagoCliente | null>(null);
const solicitudPagoCliente = ref<SolicitudCobro | null>(null);
// pago que se edita (null = pago nuevo); un correlativo puede tener varios pagos parciales
const soportePagoCliente = ref<SoporteCobro | null>(null);
const adminPagoCliente = ref<AdminCredentials | null>(null);

async function cargarSolicitudesCobro() {
  if (idMasterCobro.value) await solicitudesMasterStore.cargarCobros(idMasterCobro.value);
}
const cobro = useSolicitudCobro(cargarSolicitudesCobro);
const cobroProcesando = cobro.procesando;

// la solicitud abierta del correlativo. Una ya registrada en Bancos (pago parcial) se muestra solo si
// no queda deuda; si queda, lo que falta se carga en una solicitud nueva.
function solicitudCobroDe(house: HouseIngreso) {
  const delHouse = solicitudesCobro.value.filter(
    (s) => s.id_house === Number(house.id_house) && String(s.id_correlativo ?? "") === String(house.id_correlativo ?? ""),
  );
  // primero la que se sigue armando (sin confirmar); luego la confirmada pendiente de registrar en Bancos
  const abierta = delHouse.find((s) => s.codigo_estado !== "COBRADO" && s.codigo_estado !== "CONFIRMADO")
    ?? delHouse.find((s) => s.codigo_estado === "CONFIRMADO");
  if (abierta) return abierta;
  return Number(getDeudaActual(house)) > 0 ? undefined : delHouse[0];
}
// pagos cargados del correlativo que aún no tienen su ingreso en Bancos (en cualquier solicitud abierta)
function comprometidoCobro(house: HouseIngreso) {
  return solicitudesCobro.value
    .filter((s) => s.id_house === Number(house.id_house) && String(s.id_correlativo ?? "") === String(house.id_correlativo ?? ""))
    .flatMap((s) => s.soportes ?? [])
    .filter((sop) => !sop.id_pagoingreso)
    .reduce((acc, sop) => acc + Number(sop.monto || 0), 0);
}
// enviada a Administración (no borrador): se muestra la tarjeta de estado
function solicitudCobroEnviada(house: HouseIngreso) {
  const s = solicitudCobroDe(house);
  return s && s.codigo_estado !== "BORRADOR" ? s : undefined;
}
// ícono de la tarjeta según el estado (mismo diseño que la solicitud de pago de Costos)
const ICONO_ESTADO_COBRO: Record<string, string> = {
  PENADM: "mdi-email-check-outline",
  PENGER: "mdi-clock-outline",
  LISTO: "mdi-clock-outline",
  CONFIRMADO: "mdi-check-decagram-outline",
  COBRADO: "mdi-bank-check",
  RECHAZADA: "mdi-email-remove-outline",
};
// fecha con el helper de FormatFecha (DD/MMM/YYYY) y la hora
function fechaCobro(fecha: string | null) {
  return fecha ? `${shortDate(fecha.slice(0, 10))} ${fecha.slice(11, 16)}`.trim() : "";
}

// moneda de los ingresos (Op) del correlativo: la cuenta donde depositó el cliente debe ser de esa moneda
function monedaCorrelativo(house: HouseIngreso): number | null {
  const ingreso = (house.ingresos ?? []).find((i) => i.id_coins && Number(i.total_op || 0) !== 0) ?? house.ingresos?.find((i) => i.id_coins);
  return ingreso?.id_coins ? Number(ingreso.id_coins) : null;
}
// pagos cargados del correlativo y lo que falta para completar el monto a cobrar
// solicitudes del correlativo (puede haber varias: una confirmada y otra con el saldo)
function solicitudesCobroDe(house: HouseIngreso) {
  return solicitudesCobro.value.filter(
    (s) => s.id_house === Number(house.id_house) && String(s.id_correlativo ?? "") === String(house.id_correlativo ?? ""),
  );
}
// todos los pagos cargados del correlativo, cada uno con su solicitud (estado y confirmación)
function soportesCobro(house: HouseIngreso): SoporteDeSolicitud[] {
  return solicitudesCobroDe(house).flatMap((s) =>
    (s.soportes ?? []).map((sop) => ({
      ...sop,
      solicitud: {
        codigo_estado: s.codigo_estado,
        estado: s.estado,
        fecha_ingreso: s.fecha_ingreso,
        soporte_confirmacion_path: s.soporte_confirmacion_path,
        soporte_confirmacion_nombre: s.soporte_confirmacion_nombre,
        usuario_confirma: s.usuario_confirma,
        fecha_confirmacion: s.fecha_confirmacion,
        editable: true,
      },
    })),
  );
}
// pagos del correlativo que aún no tienen su ingreso en Bancos (los ya cobrados no se muestran en el resumen)
function solicitudesPendientesCobro(house: HouseIngreso) {
  return filasPorSoporte(solicitudesCobroDe(house)).filter((f) => f.codigo_estado !== "COBRADO");
}
// la confirmada que falta registrar en Bancos (puede no ser la que se está armando)
function confirmadaPorRegistrar(house: HouseIngreso) {
  return solicitudesCobroDe(house).find((s) => s.codigo_estado === "CONFIRMADO" && faltaRegistrarCobro(s));
}
// la solicitud dueña de un pago
function solicitudDeSoporte(house: HouseIngreso, soporte: SoporteCobro) {
  return solicitudesCobroDe(house).find((s) => (s.soportes ?? []).some((x) => x.codigo === soporte.codigo));
}
// saldo para cargar más pagos: la deuda actual menos lo ya cargado y aún no registrado en Bancos
function saldoCobro(house: HouseIngreso) {
  return Math.max(Math.round(((Number(getDeudaActual(house)) || 0) - comprometidoCobro(house)) * 100) / 100, 0);
}

// soporte: el pago a editar; nuevo = "Agregar otro soporte de ingreso"
async function abrirCargarPagoCliente(house: HouseIngreso, soporte: SoporteCobro | null = null, nuevo = false) {
  // editar un pago: su propia solicitud
  const abierta = (soporte ? solicitudDeSoporte(house, soporte) : null) ?? solicitudCobroDe(house) ?? null;
  if (abierta && !nuevo && avisarIngresoBancosCobro(abierta)) return;
  // pago nuevo con la solicitud ya confirmada (aún sin registrar en Bancos): va en una solicitud nueva
  // por el saldo disponible; la confirmada no se toca
  const s = nuevo && abierta?.codigo_estado === "CONFIRMADO" ? null : abierta;
  // varios pagos: se elige cuál editar en la lista de soportes
  if (s && !nuevo && !soporte) {
    const lista = s.soportes ?? [];
    if (lista.length > 1) {
      verSoportesCobro(house);
      return;
    }
    soporte = lista[0] ?? null;
  }
  if (nuevo && saldoCobro(house) <= 0) {
    Swal.fire({ icon: "info", text: "El monto ya está completo: no hace falta otro soporte de ingreso." });
    return;
  }
  adminPagoCliente.value = null;
  if (s) {
    const admin = await cobro.claveSiAprobada(s, "editarla");
    if (admin === undefined) return;
    adminPagoCliente.value = admin;
  } else if (!(Number(getDeudaActual(house)) > 0)) {
    Swal.fire({
      icon: "info",
      text: "El cliente no tiene deuda pendiente en este correlativo. Registra primero los montos de Operaciones.",
    });
    return;
  }
  destinoPagoCliente.value = {
    id_house: Number(house.id_house),
    id_correlativo: house.id_correlativo ? Number(house.id_correlativo) : null,
    cliente: house.consigner ?? "",
    correlativo: house.correlativo ?? null,
    // solicitud nueva: lo que queda después de los pagos ya cargados y sin registrar
    deuda: s ? getDeudaActual(house) : saldoCobro(house),
    id_coins: monedaCorrelativo(house),
  };
  solicitudPagoCliente.value = s;
  soportePagoCliente.value = soporte;
  dialogPagoCliente.value = true;
}

// "Ver todos los soportes de ingreso"
const dialogSoportesCobro = ref(false);
const houseSoportes = ref<HouseIngreso | null>(null);
const solicitudSoportes = computed(() => (houseSoportes.value ? solicitudCobroDe(houseSoportes.value) ?? null : null));
function verSoportesCobro(house: HouseIngreso) {
  houseSoportes.value = house;
  dialogSoportesCobro.value = true;
}
function editarSoporteCobro(soporte: SoporteCobro) {
  if (!houseSoportes.value) return;
  dialogSoportesCobro.value = false;
  abrirCargarPagoCliente(houseSoportes.value, soporte);
}
async function eliminarSoporteCobro(soporte: SoporteCobro) {
  const s = houseSoportes.value ? solicitudDeSoporte(houseSoportes.value, soporte) : undefined;
  if (!s) return;
  if (await cobro.eliminarSoporte(s, soporte) && houseSoportes.value && !soportesCobro(houseSoportes.value).length) {
    dialogSoportesCobro.value = false;
  }
}
// "Monto" del diálogo: deuda actual + lo ya registrado en Bancos (así el saldo = deuda - pagos sin registrar)
const totalSoportesCobro = computed(() => {
  if (!houseSoportes.value) return 0;
  const registrado = soportesCobro(houseSoportes.value)
    .filter((sop) => sop.id_pagoingreso)
    .reduce((acc, sop) => acc + Number(sop.monto || 0), 0);
  return Math.round(((Number(getDeudaActual(houseSoportes.value)) || 0) + registrado) * 100) / 100;
});
// el tacho: con un solo pago elimina la solicitud; con varios se elige en la lista
function eliminarPagoCobro(house: HouseIngreso) {
  const s = solicitudCobroDe(house);
  if (!s) return;
  if ((s.soportes?.length ?? 0) > 1) verSoportesCobro(house);
  else cobro.eliminar(s);
}

function enviarAdministracionCobro(house: HouseIngreso) {
  const s = solicitudCobroDe(house);
  if (!s) {
    Swal.fire({ icon: "info", text: "Primero carga el pago del cliente (voucher)." });
    return;
  }
  cobro.enviar(s);
}

// modo ver (ojito), igual que en Solicitudes de Pago
const dialogVer = ref(false);
const codigoVer = ref<string | null>(null);
function verSolicitud(s: { codigo: string }) {
  codigoVer.value = s.codigo;
  dialogVer.value = true;
}

onMounted(async () => {
  if (idMasterCobro.value) solicitudesMasterStore.asegurarCobros(idMasterCobro.value);
  const branch = String(route.params.id_branch ?? "");
  if (!enterprisesStore.impuestoCargado || (branch && enterprisesStore.impuestoBranch !== branch)) {
    await enterprisesStore.obtenerImpuestoXEmpresa(branch || null);
  }
});
// El impuesto se aplica cuando llega su configuración (antes: a los 2 s fijos; si tardaba más, se perdía)
let columnasImpuestoQuitadas = false;
watch(
  () => [enterprisesStore.impuestoCargado, enterprisesStore.impuesto] as const,
  ([cargado, impuesto]) => {
    if (!cargado) return;
    mostrarImpuesto.value = !!impuesto.mostrarimpuesto;
    if (mostrarImpuesto.value) {
      if (impuesto.nombre_impuesto && !columnasImpuestoQuitadas) {
        headersFacturas.value[2]!.title = impuesto.nombre_impuesto;
        headersFacturas.value[4]!.title = impuesto.nombre_impuesto;
      }
    } else if (!columnasImpuestoQuitadas) {
      headersFacturas.value.splice(2, 1);
      headersFacturas.value.splice(4, 1);
      columnasImpuestoQuitadas = true;
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-container fluid>
    <h3 v-if="!smAndDown">
      Ingresos (Venta al cliente) Pricing:
      {{ formatUsd(ingreso_pr) }} / ------- Operaciones:
      {{ formatUsd(ingreso_op) }}
    </h3>
    <div
      v-else
      class="cg-seccion"
    >
      <h3 class="cg-seccion__titulo">
        <v-icon color="success">
          mdi-cash-plus
        </v-icon>
        Ingresos <small>(Venta al cliente)</small>
      </h3>
      <div class="cg-seccion__totales">
        <span class="cg-total cg-total--pr">Pricing: <b>{{ formatUsd(ingreso_pr) }}</b></span>
        <span class="cg-total cg-total--op">Operaciones: <b>{{ formatUsd(ingreso_op) }}</b></span>
      </div>
    </div>
    <!-- <v-btn @click="nuevoIngreso()" color="blue" dark small>
      Nuevo Control Gastos Ingresos
    </v-btn> -->
    <v-expansion-panels
      v-model="openedPanel"
      variant="accordion"
    >
      <v-expansion-panel
        v-for="(houseIngreso, index) in masterHouses || []"
        :key="index"
        :value="houseIngreso.isExpanded"
      >
        <v-expansion-panel-title @click.stop="abrirExpandIngreso(index)">
          <template #actions>
            <v-icon @click="abrirExpandIngreso(index)">
              mdi-unfold-more-horizontal
            </v-icon>
          </template>
          <v-table
            class="tabla-resumen-ingresos cg-resp--resumen"
            density="compact"
          >
            <thead>
              <tr>
                <!-- <th width="10%">House</th> -->
                <th width="22%">
                  Consignatario
                </th>
                <th width="10%">
                  Cotización
                </th>
                <th
                  width="12%"
                  style="background: #d6f4ff"
                >
                  Total Pricing
                </th>
                <th
                  width="12%"
                  style="background: #ffd6d6"
                >
                  Total Operaciones
                </th>
                <th
                  width="12%"
                  style="background: #fff9c4"
                >
                  Total Deuda
                </th>
                <th
                  v-if="editable"
                  width="6%"
                >
                  Acción
                </th>
                <!-- <th v-if="editable" width="6%">Abonos</th> -->
                <th
                  v-if="editable"
                  width="12%"
                >
                  Envíos / Administración
                </th>
                <th
                  v-if="editable"
                  width="8%"
                >
                  Más acciones
                </th>
                <th>Ver Proformas</th>
                <th
                  v-if="editable"
                  width="8%"
                >
                  Facturas y Proformas
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <!-- <td>{{ house.code_house }} - {{ house.correlativo }}</td> -->
                <td
                  data-label="Consignatario"
                  class="cg-full cg-titulo"
                >
                  {{ houseIngreso.consigner }} - {{ houseIngreso.correlativo }}
                </td>
                <td
                  data-label="Cotización"
                  class="cg-full"
                >
                  {{ houseIngreso.quote }}
                  <v-btn
                    variant="text"
                    color="info"
                    icon
                    v-if="houseIngreso.id_quote"
                    @click="abrirCotizacion(houseIngreso.id_quote)"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>

                  <v-btn
                    variant="text"
                    color="default"
                    icon
                    v-if="houseIngreso.ruta_cotizacion"
                    @click="openDoc(houseIngreso.ruta_cotizacion)"
                  >
                    <v-icon>mdi-file</v-icon>
                  </v-btn>

                  <v-btn
                    variant="text"
                    color="default"
                    icon
                    v-if="!houseIngreso.ruta_cotizacion && can('listControlGastos', 'MODIFICAR')"
                    @click="
                      abrirModalRegistroDocumentoHouse(
                        houseIngreso.datosinstructivomanual,
                        houseIngreso.id_quote,
                      )
                    "
                  >
                    <v-icon>mdi-file-document-plus</v-icon>
                  </v-btn>
                </td>

                <td
                  data-label="Total Pricing"
                  class="cg-pr"
                >
                  {{ houseIngreso.total_total_pr_ingresos }}
                </td>
                <td
                  data-label="Total Operaciones"
                  class="cg-op"
                >
                  {{ houseIngreso.total_total_op_ingresos }}
                </td>
                <td
                  data-label="Total Deuda"
                  class="cg-deuda"
                >
                  {{ getDeudaActual(houseIngreso) }}
                </td>
                <td
                  data-label="Acción"
                  class="cg-full"
                  v-if="editable"
                >
                  <template v-if="can('listControlGastos', 'NUEVO')">
                    <v-btn
                      v-if="houseIngreso.id_orders"
                      @click.stop="handleNuevoIngreso(index, houseIngreso)"
                      color="blue"
                      size="x-small"
                    >
                      Nuevo Concepto

                      <!-- <v-icon>mdi-plus</v-icon> -->
                    </v-btn>
                    <v-btn
                      v-else
                      size="small"
                      @click="nuevoControlGasto(houseIngreso)"
                      color="green-darken-3"
                      @click.stop="abrirExpandIngreso(index)"
                    >
                      Nuevo Control de Gastos Ingresos
                    </v-btn>
                  </template>
                  <template v-if="can('listControlGastos', 'COPIAR')">
                    <v-tooltip
                      location="bottom"
                      color="error"
                      v-if="bloquearCopiarMontos(houseIngreso.ingresos)"
                    >
                      <template #activator="{ props }">
                        <!-- @vue-expect-error the click passes the income rows where a house is expected -->
                        <v-btn
                         
                          v-bind="props"
                          color="success"
                          size="x-small"
                          @click="
                            abriModalCopiar(
                              houseIngreso.ingresos,
                              bloquearCopiarMontos(houseIngreso.ingresos),
                            )
                          "
                        >
                          Copiar Montos Pr->Op
                        </v-btn>
                      </template>
                      <span>
                        No se Puede Copiar porqué ya existe Montos Facturados
                      </span>
                    </v-tooltip>
                    <v-btn
                      v-else
                      color="success"
                      size="x-small"
                      @click="
                        abriModalCopiar(
                          houseIngreso,
                          bloquearCopiarMontos(houseIngreso.ingresos),
                        )
                      "
                    >
                      Copiar Montos Pr->Op
                    </v-btn>
                  </template>
                </td>
                <!-- <td v-if="editable">
                  <v-btn
                    v-if="house.id_orders"
                    :color="house.debscliente.length > 0 ? 'green' : 'red'"
                    :dark="
                      house.total_total_pr_ingresos != 0 ||
                      house.total_total_op_ingresos != 0
                    "
                    :disabled="
                      house.total_total_pr_ingresos == 0 &&
                      house.total_total_op_ingresos == 0
                    "
                    small
                    @click="_openDebs(house)"
                    @click.stop="abrirExpandIngreso(index)"
                  >
                    CARGAR ABONOS
                  </v-btn>
                </td> -->
                <!-- Solicitud de Cobro: 1) Cargar Pago Cliente (voucher)  2) Enviar a Administración -->
                <td
                  v-if="editable"
                  data-label="Envíos / Administración"
                  class="cg-full cobro-cell"
                  @click.stop
                >
                  <!-- 2 o más solicitudes del correlativo sin registrar en Bancos: todas, solo Estado | Monto -->
                  <div
                    v-if="solicitudesPendientesCobro(houseIngreso).length >= 2"
                    class="cobreq-resumen"
                  >
                    <div
                      v-for="sol in solicitudesPendientesCobro(houseIngreso)"
                      :key="sol._key"
                      class="cobreq-resumen__fila"
                      :class="`cobreq--${sol.codigo_estado.toLowerCase()}`"
                    >
                      <span class="cobreq-resumen__estado">
                        <v-icon size="14">{{ ICONO_ESTADO_COBRO[sol.codigo_estado] ?? "mdi-email-check-outline" }}</v-icon>
                        {{ sol.estado }}
                      </span>
                      <span class="cobreq-resumen__monto">{{ montoCobro(montoCobrado(sol), sol.moneda) }}</span>
                    </div>
                  </div>
                  <!-- mismo diseño que "Solicitar a Administración" de Costos -->
                  <div
                    v-if="solicitudCobroEnviada(houseIngreso)"
                    class="cobreq-col"
                  >
                    <!-- con la lista Estado | Monto (2 o más) la tarjeta ya no se muestra -->
                    <div
                      v-if="solicitudesPendientesCobro(houseIngreso).length < 2"
                      class="cobreq"
                      :class="`cobreq--${solicitudCobroEnviada(houseIngreso)!.codigo_estado.toLowerCase()}`"
                    >
                      <button
                        type="button"
                        class="cobreq__info"
                        title="Ver solicitud de cobro"
                        @click="verSolicitud(solicitudCobroEnviada(houseIngreso)!)"
                      >
                        <span class="cobreq__badge">
                          <v-icon size="18">
                            {{ ICONO_ESTADO_COBRO[solicitudCobroEnviada(houseIngreso)!.codigo_estado] ?? "mdi-email-check-outline" }}
                          </v-icon>
                        </span>
                        <span class="cobreq__text">
                          <span class="cobreq__title">{{ solicitudCobroEnviada(houseIngreso)!.estado }}</span>
                          <span
                            class="cobreq__date"
                            :title="solicitudCobroEnviada(houseIngreso)!.codigo_estado === 'RECHAZADA' ? solicitudCobroEnviada(houseIngreso)!.motivo_rechazo ?? undefined : undefined"
                          >
                            {{
                              solicitudCobroEnviada(houseIngreso)!.codigo_estado === "RECHAZADA"
                                ? solicitudCobroEnviada(houseIngreso)!.motivo_rechazo || "Sin motivo"
                                : fechaCobro(solicitudCobroEnviada(houseIngreso)!.fechasolicitud)
                            }}
                          </span>
                        </span>
                      </button>
                      <!-- ver / editar / eliminar apilados, como en Costos -->
                      <div class="cobreq__acciones">
                        <v-btn
                          icon="mdi-eye"
                          size="x-small"
                          variant="text"
                          color="blue"
                          title="Ver solicitud de cobro"
                          aria-label="Ver solicitud de cobro"
                          @click="verSolicitud(solicitudCobroEnviada(houseIngreso)!)"
                        />
                        <v-btn
                          v-if="can('listControlGastos', 'NUEVO')"
                          icon="mdi-pencil-outline"
                          size="x-small"
                          variant="text"
                          :color="solicitudCobroEnviada(houseIngreso)!.id_pagoingreso ? 'grey' : 'primary'"
                          :title="solicitudCobroEnviada(houseIngreso)!.codigo_estado === 'RECHAZADA' ? 'Editar y enviar de nuevo' : 'Editar solicitud de cobro'"
                          aria-label="Editar solicitud de cobro"
                          @click="abrirCargarPagoCliente(houseIngreso)"
                        />
                        <v-btn
                          v-if="can('listControlGastos', 'ELIMINAR')"
                          icon="mdi-trash-can-outline"
                          size="x-small"
                          variant="text"
                          :color="solicitudCobroEnviada(houseIngreso)!.id_pagoingreso ? 'grey' : 'error'"
                          title="Eliminar solicitud de cobro"
                          aria-label="Eliminar solicitud de cobro"
                          :loading="cobroProcesando === solicitudCobroEnviada(houseIngreso)!.codigo"
                          @click="eliminarPagoCobro(houseIngreso)"
                        />
                      </div>
                    </div>
                    <v-btn
                      v-if="solicitudesPendientesCobro(houseIngreso).length < 2 && confirmadaPorRegistrar(houseIngreso) && can('registroPayForCliente', 'NUEVO')"
                      size="small"
                      variant="flat"
                      color="success"
                      prepend-icon="mdi-bank-transfer-in"
                      class="cobreq__registrar"
                      :loading="cobroProcesando === confirmadaPorRegistrar(houseIngreso)!.codigo"
                      @click="cobro.registrarEnBancos(confirmadaPorRegistrar(houseIngreso)!)"
                    >
                      REGISTRAR EN BANCO
                    </v-btn>
                    <!-- agregar otro pago: siempre, salvo cuando el monto ya está completo -->
                    <template v-if="saldoCobro(houseIngreso) > 0">
                      <v-btn
                        size="small"
                        variant="outlined"
                        color="primary"
                        prepend-icon="mdi-plus"
                        class="cobro-pasos__btn"
                        :disabled="!can('listControlGastos', 'NUEVO')"
                        @mousedown.stop
                        @click.stop="abrirCargarPagoCliente(houseIngreso, null, true)"
                      >
                        Agregar otro soporte de ingreso
                      </v-btn>
                      <div class="cobro-pasos__falta">
                        Saldo pendiente: {{ saldoCobro(houseIngreso).toFixed(2) }} {{ solicitudCobroEnviada(houseIngreso)!.moneda ?? "" }}
                      </div>
                    </template>
                    <!-- v-btn (no <button> nativo): la fila está dentro del título del panel, que también es un botón -->
                    <v-btn
                      v-if="soportesCobro(houseIngreso).length > 1"
                      variant="text"
                      size="x-small"
                      color="primary"
                      prepend-icon="mdi-folder-open-outline"
                      class="cobro-pasos__link"
                      @mousedown.stop
                      @click.stop="verSoportesCobro(houseIngreso)"
                    >
                      Ver todos los soportes de ingreso ({{ soportesCobro(houseIngreso).length }})
                    </v-btn>
                  </div>
                  <div
                    v-else
                    class="cobro-pasos"
                  >
                    <v-btn
                      size="small"
                      variant="flat"
                      :color="solicitudCobroDe(houseIngreso) ? 'green-darken-2' : 'grey'"
                      :prepend-icon="solicitudCobroDe(houseIngreso) ? 'mdi-check-circle-outline' : 'mdi-cloud-upload'"
                      class="cobro-pasos__btn"
                      :disabled="!houseIngreso.id_orders || !can('listControlGastos', 'NUEVO')"
                      :title="solicitudCobroDe(houseIngreso) ? 'Pago cargado: clic para editar' : 'Cargar el voucher del cliente (pago total o parcial)'"
                      @click="abrirCargarPagoCliente(houseIngreso)"
                    >
                      {{ solicitudCobroDe(houseIngreso) ? "Pago Cliente Cargado" : "Cargar Pago Cliente" }}
                    </v-btn>
                    <div
                      v-if="solicitudCobroDe(houseIngreso)"
                      class="cobro-pasos__extra"
                    >
                      <v-btn
                        icon="mdi-eye"
                        size="x-small"
                        variant="text"
                        color="blue"
                        title="Ver solicitud de cobro"
                        aria-label="Ver solicitud de cobro"
                        @click="verSolicitud(solicitudCobroDe(houseIngreso)!)"
                      />
                      <v-btn
                        v-if="can('listControlGastos', 'ELIMINAR')"
                        icon="mdi-trash-can-outline"
                        size="x-small"
                        variant="text"
                        color="error"
                        title="Eliminar pago cargado"
                        aria-label="Eliminar pago cargado"
                        @click="eliminarPagoCobro(houseIngreso)"
                      />
                    </div>
                    <v-btn
                      size="small"
                      variant="flat"
                      :color="solicitudCobroDe(houseIngreso) ? 'primary' : 'grey-darken-1'"
                      prepend-icon="mdi-send"
                      class="cobro-pasos__btn"
                      :disabled="!solicitudCobroDe(houseIngreso) || !can('listControlGastos', 'NUEVO')"
                      :loading="!!solicitudCobroDe(houseIngreso) && cobroProcesando === solicitudCobroDe(houseIngreso)!.codigo"
                      :title="!solicitudCobroDe(houseIngreso) ? 'Primero carga el pago del cliente'
                        : saldoCobro(houseIngreso) > 0 ? `Se envía como pago parcial (saldo pendiente ${saldoCobro(houseIngreso).toFixed(2)})` : 'Enviar a Administración'"
                      @click="enviarAdministracionCobro(houseIngreso)"
                    >
                      Enviar a Administración
                    </v-btn>
                    <!-- pagos parciales: otro soporte mientras falte; completo, solo el aviso -->
                    <template v-if="solicitudCobroDe(houseIngreso)">
                      <v-btn
                        v-if="saldoCobro(houseIngreso) > 0"
                        size="small"
                        variant="outlined"
                        color="primary"
                        prepend-icon="mdi-plus"
                        class="cobro-pasos__btn"
                        :disabled="!can('listControlGastos', 'NUEVO')"
                        @click="abrirCargarPagoCliente(houseIngreso, null, true)"
                      >
                        Agregar otro soporte de ingreso
                      </v-btn>
                      <div
                        v-else
                        class="cobro-pasos__completo"
                      >
                        <v-icon size="16">
                          mdi-check-circle
                        </v-icon>
                        Monto completo: ya puedes enviar a Administración.
                      </div>
                      <div
                        v-if="saldoCobro(houseIngreso) > 0"
                        class="cobro-pasos__falta"
                      >
                        Saldo pendiente: {{ saldoCobro(houseIngreso).toFixed(2) }} {{ solicitudCobroDe(houseIngreso)!.moneda ?? "" }}
                      </div>
                      <!-- v-btn (no <button> nativo): la fila está dentro del título del panel, que también es un botón -->
                      <v-btn
                        v-if="soportesCobro(houseIngreso).length > 1"
                        variant="text"
                        size="x-small"
                        color="primary"
                        prepend-icon="mdi-folder-open-outline"
                        class="cobro-pasos__link"
                        @mousedown.stop
                        @click.stop="verSoportesCobro(houseIngreso)"
                      >
                        Ver todos los soportes de ingreso ({{ soportesCobro(houseIngreso).length }})
                      </v-btn>
                    </template>
                  </div>
                </td>
                <td
                  data-label="Más acciones"
                  v-if="editable"
                >
                  <v-btn
                    v-if="houseIngreso.id_orders && can('listControlGastos', 'MODIFICAR')"
                    color="indigo"
                    size="small"
                    class="mb-1"
                    @click.stop="abrirModalCambiarExpediente(houseIngreso)"
                    :loading="flagCambiarExpediente"
                  >
                    Cambiar expediente
                  </v-btn>
                </td>
                <td data-label="Ver Proformas">
                  <v-icon
                    :disabled="!houseIngreso.tienefactura"
                    color="info"
                    @click.stop="verProformas(houseIngreso)"
                  >
                    mdi-eye
                  </v-icon>
                </td>
                <td
                  data-label="Facturas y Proformas"
                  class="cg-full"
                  v-if="editable"
                >
                  <v-btn
                    :color="!houseIngreso.tienefacturafiscal ? '#616161' : 'primary'"
                    size="small"
                    @click.stop="abrirModalFacturasFiscales(houseIngreso)"
                  >
                    {{
                      !houseIngreso.tienefacturafiscal
                        ? "CARGAR FACTURA FISCAL"
                        : "VER FACTURA FISCAL"
                    }}
                  </v-btn>
                  <v-btn
                    v-if="houseIngreso.id_orders && can('listControlGastos', 'NUEVO')"
                    color="pink"
                    size="small"
                    class="mt-1"
                    :disabled="isBotonEmitirProformaDisabled(houseIngreso)"
                    @click="abrirModalFacturar(houseIngreso)"
                    @click.stop="abrirExpandIngreso(index)"
                  >
                    EMITIR PROFORMA
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <!-- celular: indica que el panel tiene detalle (al tocarlo se abre / cierra) -->
          <div
            v-if="smAndDown"
            class="cg-verdetalle"
          >
            <span class="cg-verdetalle__ver"><v-icon size="18">mdi-chevron-down</v-icon> Ver detalle</span>
            <span class="cg-verdetalle__ocultar"><v-icon size="18">mdi-chevron-up</v-icon> Ocultar detalle</span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table
            density="compact"
            class="cg-resp--detalle"
          >
            <thead>
              <tr>
                <th class="text-left">
                  Descripción
                </th>
                <th
                  style="background: #d6f4ff"
                  class="text-left"
                >
                  Monto Pr
                </th>
                <th
                  style="background: #d6f4ff"
                  class="text-left"
                  v-if="mostrarImpuesto"
                >
                  {{ enterprisesStore.impuesto.nombre_impuesto }} Pr
                </th>
                <th
                  style="background: #d6f4ff"
                  class="text-left"
                >
                  Total Pr
                </th>
                <th
                  style="background: #ffd6d6"
                  class="text-left"
                >
                  Monto Op
                </th>
                <th
                  style="background: #ffd6d6"
                  class="text-left"
                  v-if="mostrarImpuesto"
                >
                  {{ enterprisesStore.impuesto.nombre_impuesto }} Op
                </th>
                <th
                  style="background: #ffd6d6"
                  class="text-left"
                >
                  Total Op
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  Monto Op Cuenta Banco
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  {{ enterprisesStore.impuesto.nombre_impuesto }} Op
                  Cuenta Banco
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  Total Op Cuenta Banco
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  Tipo Cambio Cuenta Banco
                </th>
                <th class="text-center">
                  Facturado
                </th>
                <th
                  v-if="editable"
                  class="text-left"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item of houseIngreso.ingresos"
                :key="item.id"
              >
                <td
                  data-label="Descripción"
                  class="cg-full cg-titulo"
                >
                  {{ item.concepto }}
                </td>
                <td
                  data-label="Monto Pr"
                  style="background: #d6f4ff"
                >
                  {{ parseFloat(String(item.monto_pr)).toFixed(2) }}
                </td>
                <td
                  :data-label="`${enterprisesStore.impuesto.nombre_impuesto} Pr`"
                  style="background: #d6f4ff"
                  v-if="mostrarImpuesto"
                >
                  {{ parseFloat(String(item.igv_pr)).toFixed(2) }}
                </td>
                <td
                  data-label="Total Pr"
                  style="background: #d6f4ff"
                >
                  {{ parseFloat(String(item.total_pr)).toFixed(2) }}
                </td>
                <td
                  data-label="Monto Op"
                  style="background: #ffd6d6"
                >
                  {{ parseFloat(String(item.monto_op)).toFixed(2) }}
                </td>
                <td
                  :data-label="`${enterprisesStore.impuesto.nombre_impuesto} Op`"
                  style="background: #ffd6d6"
                  v-if="mostrarImpuesto"
                >
                  {{ parseFloat(String(item.igv_op)).toFixed(2) }}
                </td>
                <td
                  data-label="Total Op"
                  style="background: #ffd6d6"
                >
                  {{ parseFloat(String(item.total_op)).toFixed(2) }}
                </td>
                <!-- Monto Op Cuenta Banco -->
                <td
                  data-label="Monto Op Cuenta Banco"
                  style="background: #d8ffde"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  {{ parseFloat(String(item.montoopcuentabanco)).toFixed(2) }}
                  {{ item.acronym }}
                </td>
                <!-- IGV Op Cuenta Banco -->
                <td
                  :data-label="`${enterprisesStore.impuesto.nombre_impuesto} Op Cuenta Banco`"
                  style="background: #d8ffde"
                  v-if="
                    mostrarImpuesto && mostrarMontoOperativos(houseIngreso.ingresos)
                  "
                >
                  {{ parseFloat(String(item.igvopcuentabanco)).toFixed(2) }}
                  {{ item.acronym }}
                </td>
                <!-- Total Op Cuenta Banco -->
                <td
                  data-label="Total Op Cuenta Banco"
                  style="background: #d8ffde"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  {{ parseFloat(String(item.totalopcuentabanco)).toFixed(2) }}
                  {{ item.acronym }}
                </td>
                <!-- Tipo Cambio Cuenta Banco -->
                <td
                  data-label="Tipo Cambio Cuenta Banco"
                  style="background: #d8ffde"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  {{ item.tipocambio == 1 ? "No Aplica" : item.tipocambio }}
                </td>
                <td data-label="Facturado">
                  <v-chip
                    class="ma-2 text-white"
                    color="orange"
                    variant="flat"
                    v-if="item.facturado == true"
                  >
                    Si
                  </v-chip>
                  <v-chip
                    class="ma-2 text-white"
                    color="green"
                    variant="flat"
                    v-else
                  >
                    No
                  </v-chip>
                  <br>

                  <span v-if="item.verFactura">
                    Nro Factura: <br>
                    {{ item.nro_factura }}
                  </span>
                </td>
                <td
                  data-label="Acciones"
                  v-if="editable"
                >
                  <v-icon
                    color="info"
                    @click="activarFactura(item)"
                    v-if="item.facturado == true && item.pagado == 0"
                  >
                    mdi-eye
                  </v-icon>
                  <v-icon
                    color="orange"
                    @click="editIngreso(item)"
                    v-if="item.pagado == 0 && can('listControlGastos', 'MODIFICAR')"
                  >
                    mdi-pencil
                  </v-icon>

                  <v-icon
                    color="red"
                    v-if="item.facturado == false && item.pagado == 0"
                    @click="delIngreso(item, houseIngreso)"
                  >
                    mdi-delete
                  </v-icon>

                  <v-chip
                    v-if="item.pagado == 1"
                    color="success"
                  >
                    Pagado
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!--  -->
    <v-dialog
      v-model="dialogIngreso"
      width="800"
      persistent
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap">
          Datos del servicio
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogIngreso = !dialogIngreso"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="frmIngreso">
              <v-row>
                <v-col
                  cols="12"
                  xl="3"
                  lg="3"
                >
                  <!-- @change="activarSeccion3" -->
                  <v-autocomplete
                    :items="controlGastosStore.listCorrelativo"
                    v-model="ingresos.id_correlativo"
                    item-title="code"
                    item-value="id"
                    label="Correlativo"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  >
                    <!-- Lo que se muestra cuando está seleccionado -->
                    <template #selection="{ item }">
                      <span class="correlativo-selection">
                        {{ item.code }}
                      </span>
                    </template>

                    <!-- Cada opción del dropdown -->
                    <template #item="{ item, props }">
                      <v-list-item
                        v-bind="props"
                        role="option"
                        class="py-3"
                      >
                        <template #title>
                          <span class="correlativo-code">
                            {{ item.code }}
                          </span>
                        </template>

                        <template
                          v-if="item.description"
                          #subtitle
                        >
                          <span class="correlativo-descripcion">
                            <v-icon
                              v-if="item.mdi_icon"
                              size="small"
                              class="mr-2"
                            >
                              {{ item.mdi_icon }}
                            </v-icon>

                            {{ item.description }}
                          </span>
                        </template>
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="ingresos.concepto"
                    label="Concepto"
                    :rules="[(v) => !!v || 'Dato es requerido']"
                  />
                </v-col>
                <v-col cols="3">
                  <v-switch
                    v-if="mostrarImpuesto"
                    v-model="ingresos.statusCalcula"
                    @update:model-value="calcularE()"
                    density="compact"
                    :label="`Calcula ${enterprisesStore.impuesto.nombre_impuesto}`"
                  />
                  <!-- <p v-else>NO HA CONFIGURADO EL IMPUESTOS A LA VENTAS. Ir al Módulo de Configuración</p> -->
                </v-col>
              </v-row>
              <v-row>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    v-model="ingresos.id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda de Banco Salida"
                    @update:model-value="obtenerMoneda()"
                    density="compact"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                  v-if="opFlag"
                >
                  <v-text-field
                    density="compact"
                    v-if="
                      ingresos.id_coins &&
                        appStore.itemsCoinsList.find(
                          (c: MonedaItem) => c.id === ingresos.id_coins,
                        )?.symbol != 'USD'
                    "
                    v-model="ingresos.tipocambio"
                    type="number"
                    label="Tipo de Cambio"
                    @update:model-value="calcularE()"
                    step="0.01"
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) => v > 1 || 'Debe ser mayor a 1',
                    ]"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    v-model="ingresos.montoopcuentabanco"
                    @keyup="calcularE()"
                    :rules="[(v) => !!v || 'Dato es requerido']"
                    type="number"
                    label="Monto"
                    :prefix="sufmoneda"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    readonly
                    v-model="ingresos.igvopcuentabanco"
                    type="number"
                    :label="`${enterprisesStore.impuesto.nombre_impuesto}`"
                    v-if="mostrarImpuesto"
                    :prefix="sufmoneda"
                  />
                  <p v-else>
                    NO HA CONFIGURADO EL IMPUESTOS A LA VENTAS. Ir al Módulo de
                    Configuración
                  </p>
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    v-model="ingresos.totalopcuentabanco"
                    type="number"
                    label="Total"
                    readonly
                    :prefix="sufmoneda"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="prFlag"
                >
                  <v-text-field
                    v-model="ingresos.monto_pr"
                    @keyup="calcularE()"
                    :rules="[(v) => !!v || 'Dato es requerido']"
                    type="number"
                    label="Monto"
                    :prefix="sufmoneda"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="prFlag && mostrarImpuesto"
                >
                  <v-text-field
                    readonly
                    v-model="ingresos.igv_pr"
                    type="number"
                    :label="`${enterprisesStore.impuesto.nombre_impuesto}`"
                    :prefix="sufmoneda"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="prFlag"
                >
                  <v-text-field
                    v-model="ingresos.total_pr"
                    type="number"
                    label="Total"
                    :prefix="sufmoneda"
                  />
                </v-col>
                <!--  -->
                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    density="compact"
                    v-model="ingresos.montoopview"
                    type="number"
                    label="Monto Operaciones (Solo lectura) "
                    suffix="USD"
                    readonly
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag && mostrarImpuesto"
                >
                  <v-text-field
                    density="compact"
                    v-model="ingresos.igvopview"
                    type="number"
                    :label="`${enterprisesStore.impuesto.nombre_impuesto} Operaciones (Solo lectura)`"
                    suffix="USD"
                    readonly
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    density="compact"
                    v-model="ingresos.totalopview"
                    type="number"
                    label="Total Operaciones (Solo lectura) "
                    suffix="USD"
                    readonly
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            v-if="statusBtn == 1"
            @click="setIngresos()"
            :loading="savingIngreso"
            :disabled="savingIngreso"
            block
            color="success"
            elevation="0"
          >
            Agregar servicio
          </v-btn>
          <v-btn
            v-if="statusBtn == 2"
            @click="editIngresos()"
            block
            color="success"
            elevation="0"
          >
            Guardar Cambios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--  -->
    <v-dialog
      max-width="90%"
      v-model="dialogDebs"
      persistent
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap">
          Abonos del cliente
          <v-spacer />

          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogDebs = !dialogDebs"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersdebs"
            :items="house.debscliente"
          >
            <template #[`item.accion`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                size="small"
                color="default"
                @click="openDoc(item.path!)"
              >
                mdi-eye
              </v-icon>
              <v-icon
                class="btn_add mr-2"
                size="small"
                color="warning"
                v-if="item.status == 1 && can('listControlGastos', 'MODIFICAR')"
                @click="editarDebs(item)"
              >
                mdi-pencil
              </v-icon>
              <v-icon
                class="btn_add mr-2"
                size="small"
                color="red"
                v-if="item.status == 1 && can('listControlGastos', 'ELIMINAR')"
                @click="_delDebsClient(item.id)"
              >
                mdi-delete
              </v-icon>
            </template>
            <template #[`item.status`]="{ item }">
              <v-chip
                block
                v-if="item.status == 2"
                size="small"
                class=""
                color="success"
                variant="outlined"
              >
                <v-icon start>
                  mdi-check
                </v-icon>
                Confirmado
              </v-chip>
              <v-chip
                block
                v-if="item.status == 1"
                size="small"
                class=""
                color="orange"
                variant="outlined"
              >
                <v-icon start>
                  mdi-warning
                </v-icon>
                Por Confirmar
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="can('listControlGastos', 'NUEVO')"
            color="primary"
            @click="_newDebs()"
          >
            CARGAR NUEVO ABONO
          </v-btn>
          <v-btn
            color="error"
            @click="dialogDebs = !dialogDebs"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      max-width="80%"
      v-model="dialogNewDebs"
      v-if="dialogNewDebs"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap">
          Cargar un Nuevo abonos
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogNewDebs = !dialogNewDebs"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form ref="frmNuevoAbono">
              <v-row density="compact">
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    label="Fecha de Operación"
                    prepend-icon="mdi-calendar"
                    type="date"
                    v-model="date"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="number"
                    label="No. Operación del Voucher"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-divider />
              <v-row>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    v-model="id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda "
                    @update:model-value="obtenerMoneda()"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                  v-if="sufmoneda != 'USD'"
                >
                  <v-text-field
                    v-model="tipocambio"
                    type="number"
                    label="Tipo de Cambio"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="calcularMontoDolar()"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="monto_abonado"
                    type="number"
                    label="Monto Ingresado al Banco"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="calcularMontoDolar()"
                    :prefix="sufmoneda"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                  v-if="sufmoneda != 'USD'"
                >
                  <v-text-field
                    v-model="monto"
                    type="number"
                    label="Monto de la Factura (Solo Lectura)"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    prefix="USD"
                    readonly
                  />
                </v-col>
              </v-row>
              <v-divider />
              <!--  -->
              <v-row>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-autocomplete
                    :items="appStore.itemsDataBanksList"
                    v-model="id_banks"
                    item-title="acronym"
                    item-value="id"
                    label="Banco Origen"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-select
                    :items="
                      (bancosStore.cuentas || []).filter(
                        (v) => v.symbol == sufmoneda,
                      )
                    "
                    v-model="id_cuenta_pic"
                    label="Cuenta Destino (PIC)"
                    item-title="label"
                    item-value="id"
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                >
                  <v-textarea
                    auto-grow
                    rows="1"
                    append-icon="mdi-comment"
                    v-model="comentario"
                    label="Comentario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col
                  md="12"
                  cols="12"
                >
                  <ArrastraYSolarComponent @id-archivo-cargado="recibirId" />
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="can('listControlGastos', 'NUEVO')"
            color="primary"
            :loading="loading"
            @click="_setDebsClient()"
          >
            GUARDAR ABONO
          </v-btn>

          <v-btn
            color="red"
            @click="dialogNewDebs = !dialogNewDebs"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      max-width="80%"
      v-model="dialogDebsEdit"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Cargar un nuevo abono
          <v-spacer />
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form ref="frmNuevoAbono">
              <v-row density="compact">
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    label="Fecha de Operación"
                    prepend-icon="mdi-calendar"
                    type="date"
                    v-model="date"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="number"
                    label="No. Operación"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="monto"
                    type="number"
                    label="Monto En Dolares"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    suffix="USD"
                    disabled
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="tipocambio"
                    type="number"
                    label="Tipo de Cambio"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="calcularMontoDolar()"
                  />
                </v-col>
              </v-row>
              <!--  -->
              <v-row>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-autocomplete
                    :items="appStore.itemsDataBanksList"
                    v-model="id_banks"
                    item-title="acronym"
                    item-value="id"
                    label="Banco Origen"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-select
                    :items="
                      (bancosStore.cuentas || []).filter(
                        (v) => v.symbol == sufmoneda,
                      )
                    "
                    v-model="id_cuenta_pic"
                    label="Cuenta Destino (PIC)"
                    item-title="label"
                    item-value="id"
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                >
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    v-model="id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda En cuenta de Banco"
                    @update:model-value="obtenerMoneda()"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="monto_abonado"
                    type="number"
                    label="Monto En cuenta de Banco"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="calcularMontoDolar()"
                    :prefix="sufmoneda"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="12"
                >
                  <v-textarea
                    rows="2"
                    v-model="comentario"
                    label="Comentario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col
                  md="12"
                  cols="12"
                >
                  <ArrastraYSolarComponent @id-archivo-cargado="recibirId" />
                </v-col>
                <v-col cols="3">
                  <!-- @vue-expect-error _uploadFile is called without a file and payfile is compared with an array literal -->
                  <v-btn
                    :disabled="boolFile || payfile == []"
                    color="blue-grey"
                    block
                    class="ma-2 text-white"
                    size="large"
                    @click="filesStore._uploadFile()"
                  >
                    Subir
                    <v-icon end>
                      mdi-cloud-upload
                    </v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            v-if="can('listControlGastos', 'MODIFICAR')"
            color="primary"
            @click="actualizar()"
          >
            GUARDAR ABONO
          </v-btn>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="red"
            @click="dialogDebsEdit = !dialogDebsEdit"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- --------------------------- -->
    <v-dialog
      v-model="dialogFacturar"
      scrollable
      persistent
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
      v-if="dialogFacturar"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          GENERAR PROFORMA
          <v-spacer />
          <v-btn
            variant="text"
            color="default"
            icon
            @click="dialogFacturar = false"
            :editable="firstCompleteProforma"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-stepper-vertical
            v-model="stepProforma"
            hide-actions
          >
            <v-stepper-vertical-item
              :value="1"
              :complete="stepProforma > 1"
              :editable="firstCompleteProforma"
              title="Descripción de la Cabecera del Documento"
            >
              <v-text-field
                v-model="nombreProforma"
                label="Nombre a Imprimir"
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
              <v-btn
                color="primary"
                @click="continueStep2"
              >
                Continue
              </v-btn>
            </v-stepper-vertical-item>

            <v-stepper-vertical-item
              :value="2"
              title="Conceptos a Facturar"
            >
              <v-row>
                <v-col cols="12">
                  <v-data-table
                    v-model="selected"
                    :headers="headersFacturas"
                    :items="conceptos.filter((v) => !v.facturado)"
                    show-select
                    item-value="id"
                    return-object
                    hide-default-footer
                    :items-per-page="-1"
                  >
                    <template #[`item.tipocambio`]="{ item }">
                      {{ item.tipocambio != 0 ? item.tipocambio : "No Aplica" }}
                    </template>
                  </v-data-table>
                </v-col>
                <v-col cols="4">
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    item-title="symbol"
                    item-value="id"
                    label="Moneda"
                    placeholder="Seleccione una moneda"
                    v-model="id_coins"
                    ref="coinSelect"
                    readonly
                    error-messages="Si necesita cambiar de moneda. Edite el/los concepto(s)"
                  />
                </v-col>
                <v-col cols="12" />
              </v-row>
            </v-stepper-vertical-item>
          </v-stepper-vertical>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="stepProforma == 2"
            color="success"
            :loading="obtenerDatosHouse"
            :disabled="selected.length == 0"
            @click="generarDocumento()"
            class="mx-1"
          >
            Generar Proforma
          </v-btn>
          <v-btn
            v-if="stepProforma == 2"
            color="warning"
            @click="stepProforma = 1"
            class="mx-1"
          >
            Volver
          </v-btn>
          <v-btn
            color="error"
            @click="dialogFacturar = !dialogFacturar"
            class="mx-1"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--FACTURAS FISCALES-->
    <v-dialog
      max-width="80%"
      v-model="dialogFacturasFiscales"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Facturas y Proformas Fiscales de {{ house.consigner }}
          <v-spacer />
          <v-btn
            v-if="can('listControlGastos', 'NUEVO')"
            variant="outlined"
            @click="cargarProformaFiscal"
            color="primary"
          >
            Cargar Nueva
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersFacturasFiscales"
            :items="housesStore.lstFacturasFiscales"
            density="compact"
            item-value="id"
            class="elevation-0"
            :loading="isDataTableLoading"
          >
            <template #[`item.originalname`]="{ item }">
              <v-icon
                v-if="item.type == 'pdf'"
                color="red"
                class="mr-2"
              >
                mdi-file-pdf-box
              </v-icon>
              <v-icon
                v-if="
                  item.type == 'png' ||
                    item.type == 'jpg' ||
                    item.type == 'jpeg'
                "
                color="blue-grey-darken-1"
                class="mr-2"
              >
                mdi-file-image
              </v-icon>
              {{
                item.tipo_pago == 1
                  ? "FACTURA"
                  : String("") || item.tipo_pago == 2
                    ? "PERFORMANCE"
                    : "OTRO"
              }}
              -
              {{ item.nro_factura }}
            </template>
            <template #[`item.path`]="{ item }">
              <v-btn
                variant="text"
                icon
                size="small"
                @click="openDoc(item.path!)"
              >
                <v-icon
                  class="btn_add mr-2"
                  size="large"
                  color="grey"
                >
                  mdi-eye
                </v-icon>
              </v-btn>
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                v-if="can('listControlGastos', 'ELIMINAR')"
                variant="text"
                icon
                size="small"
                @click="eliminarProformaFiscal(item.id)"
              >
                <v-icon
                  class="btn_add mr-2"
                  size="large"
                  color="red"
                >
                  mdi-delete
                </v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!--PROFORMA FISCAL-->
    <v-dialog
      width="80%"
      v-model="dialogProformaFiscal"
      v-if="dialogProformaFiscal"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title>
          <h3>Subir Proformas Fiscales de {{ house.consigner }}</h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row density="compact">
              <v-col
                cols="12"
                md="12"
              >
                <v-radio-group
                  v-model="proformaFiscal.tipo_pago"
                  inline
                >
                  <v-radio
                    label="Factura"
                    value="1"
                  />
                  <v-radio
                    label="Performance"
                    value="2"
                  />
                  <v-radio
                    label="Otro"
                    value="3"
                  />
                </v-radio-group>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  label="Fecha de Operación"
                  prepend-icon="mdi-calendar"
                  type="date"
                  v-model="proformaFiscal.fecha"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="proformaFiscal.nro_factura"
                  :label="`Nro de ${
                    proformaFiscal.tipo_pago == 1
                      ? 'Factura'
                      : String('') || proformaFiscal.tipo_pago == 2
                        ? 'Performance'
                        : 'Otro'
                  }`"
                />
              </v-col>
              <v-col
                md="12"
                cols="12"
              >
                <ArrastraYSolarComponent @id-archivo-cargado="recibirId" />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="registrarProformaFiscal()"
            :disabled="!filesStore.payPath"
          >
            GUARDAR
            {{
              proformaFiscal.tipo_pago == 1
                ? "Factura"
                : String("") || proformaFiscal.tipo_pago == 2
                  ? "Performance"
                  : "Otro"
            }}
          </v-btn>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="red"
            @click="dialogProformaFiscal = !dialogProformaFiscal"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogFacturaEmitidas"
      persistent
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title primary-title>
          <h2>Proformas Activas</h2>
        </v-card-title>

        <v-card-text class="px-5">
          <v-table width="100%">
            <thead>
              <tr>
                <th>#</th>
                <th>Nro Factura</th>
                <th>Doc. Ref.</th>
                <th>Monto</th>
                <th>IGV</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in lstFacturasEmitidas"
                :key="index"
              >
                <td>{{ index + 1 }}</td>
                <td style="text-align: center">
                  {{ item.nro_factura }}
                </td>
                <td style="text-align: center">
                  <v-icon
                    color="red"
                    @click="abrirPdf(item.url_documento)"
                  >
                    mdi-file-pdf-box
                  </v-icon>
                </td>
                <td style="text-align: center">
                  {{ item.total_monto }}
                </td>
                <td style="text-align: center">
                  {{ item.total_igv }}
                </td>
                <td style="text-align: center">
                  {{ item.total }}
                </td>
                <td>
                  <v-icon
                    color="red"
                    @click="eliminarFactura(item.id)"
                  >
                    mdi-delete
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-list-subheader class="blinking">
            <v-icon color="warning">
              mdi-alert
            </v-icon> PARA EDITAR , DEBES
            ELIMINAR Y VOLVER A GENERAR LA PROFORMA
          </v-list-subheader>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="error"
            @click="dialogFacturaEmitidas = !dialogFacturaEmitidas"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- CAMBIAR EXPEDIENTE (HOUSE CODE) -->
    <v-dialog
      v-model="dialogCambiarExpediente"
      max-width="500"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap">
          Cambiar expediente (House)
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogCambiarExpediente = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="
              appStore.itemsMasterList.filter(
                (v: { id: number | string }) => v.id != route.params.id,
              )
            "
            v-model="selectedNuevoExpediente"
            item-value="id"
            item-title="code_master"
            label="Seleccione nuevo expediente"
            variant="outlined"
            class="my-5"
          />
          <p class="text-body-small mb-0">
            Actual: {{ house.code_house }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="red"
            @click="dialogCambiarExpediente = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedNuevoExpediente"
            @click="aplicarCambioExpediente"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogCargarArchivoCotizacion"
      scrollable
      persistent
      max-width="40%"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap">
          Cargar Documentos de Cotización
          <v-spacer />
          <v-btn
            variant="text"
            color="default"
            icon
            @click="dialogCargarArchivoCotizacion = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-table>
            <tbody>
              <tr
                v-for="(doc, index) in listaDocumentos.filter(
                  (v) => v.key == 'cotizacion',
                )"
                :key="index"
              >
                <td width="5%">
                  <v-checkbox
                    v-model="doc.flag"
                    color="success"
                    hide-details
                  />
                </td>

                <td width="45%">
                  <div v-if="doc.editable">
                    <v-text-field
                      v-model="doc.label"
                      density="compact"
                      hide-details
                      placeholder="Nombre del documento personalizado"
                      variant="underlined"
                    />
                  </div>
                  <div v-else>
                    {{ doc.label }}
                  </div>
                </td>

                <td width="50%">
                  <ArrastraYSolarComponent2
                    :id="doc.key"
                    :archivo-inicial="doc.file"
                    @archivo-cargado="
                      (datoEmit) => cargarArchivoDinamico(datoEmit, doc)
                    "
                    @archivo-eliminado="eliminarArchivoDinamico(doc)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            color="success"
            @click="setDatosInstructivo"
            :loading="loadingFile"
          >
            Actualizar Cotización
          </v-btn>
          <v-btn
            color="primary"
            @click="dialogCargarArchivoCotizacion = false"
            class="mx-1"
            :loading="loadingFile"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogCopiar"
      scrollable
      persistent
      max-width="40%"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title primary-title>
          COPIAR COSTOS {{ ingresos.consigner }} - {{ ingresos.correlativo }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCopiar">
            <v-autocomplete
              :items="appStore.itemsCoinsList"
              v-model="ingresos.id_coins"
              item-title="acronym"
              item-value="id"
              label="Moneda de Banco Salida"
              @update:model-value="obtenerMoneda()"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-text-field
              density="compact"
              v-model="ingresos.tipocambio"
              type="number"
              label="Tipo de Cambio"
              step="0.01"
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-if="
                appStore.itemsCoinsList.some(
                  (v: MonedaItem) => v.id == ingresos.id_coins && v.acronym !== 'USD',
                )
              "
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="copiarMontos()"
            :loading="loadingCopiarMonto"
          >
            COPIAR
          </v-btn>
          <v-btn
            color="danger"
            :disabled="loadingCopiarMonto"
            @click="dialogCopiar = !dialogCopiar"
          >
            CANCELAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <SolicitudCobroVerDialog
      v-model="dialogVer"
      :codigo="codigoVer"
    />
    <CargarPagoClienteDialog
      v-model="dialogPagoCliente"
      :destino="destinoPagoCliente"
      :solicitud="solicitudPagoCliente"
      :soporte="soportePagoCliente"
      :admin="adminPagoCliente"
      @guardado="cargarSolicitudesCobro"
    />
    <SoportesCobroDialog
      v-model="dialogSoportesCobro"
      :soportes="houseSoportes ? soportesCobro(houseSoportes) : []"
      :moneda="solicitudSoportes?.moneda ?? null"
      :total="totalSoportesCobro"
      :cliente="solicitudSoportes?.cliente"
      :expediente="solicitudSoportes?.expediente"
      :correlativo="solicitudSoportes?.correlativo"
      :solicitud="solicitudSoportes"
      :editable="can('listControlGastos', 'NUEVO')"
      :eliminable="can('listControlGastos', 'ELIMINAR')"
      @editar="editarSoporteCobro"
      @eliminar="eliminarSoporteCobro"
    />
  </v-container>
</template>

<style scoped>
/* Envíos / Administración (solicitud de cobro) */
.cobro-pasos {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  min-width: 170px;
}
.cobro-pasos__btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.cobro-pasos__completo {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  background: #ecfdf3;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
}
.cobro-pasos__falta {
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
}
.cobro-pasos__link {
  height: auto !important;
  min-height: 24px;
  padding: 2px 4px !important;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0;
  text-decoration: underline;
  text-transform: none;
  white-space: normal;
}
.cobro-pasos__link :deep(.v-btn__content) {
  white-space: normal;
  text-align: center;
}
.cobro-pasos__extra {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: -2px;
}
/* varias solicitudes del correlativo: Estado | Monto */
.cobreq-resumen {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 300px;
  margin-bottom: 6px;
}
.cobreq-resumen__fila {
  --cobreq-fg: #1d4ed8;
  --cobreq-bg: #eff4ff;
  --cobreq-border: #d1defc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 10px;
  border: 1px solid var(--cobreq-border);
  border-radius: 8px;
  background: var(--cobreq-bg);
  font-size: 0.75rem;
}
.cobreq-resumen__estado {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--cobreq-fg);
  font-weight: 700;
}
.cobreq-resumen__monto {
  color: #0a1f44;
  font-weight: 800;
  white-space: nowrap;
}
/* Solicitud de cobro enviada: mismo diseño que "Solicitar a Administración" de Costos (.solreq) */
.cobreq-col {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  max-width: 300px;
}
.cobreq {
  --cobreq-fg: #1d4ed8;
  --cobreq-bg: #eff4ff;
  --cobreq-border: #d1defc;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 10px;
  border: 1px solid var(--cobreq-border);
  border-radius: 10px;
  background: var(--cobreq-bg);
}
.cobreq--penger,
.cobreq--listo {
  --cobreq-fg: #b45309;
  --cobreq-bg: #fffbeb;
  --cobreq-border: #fde68a;
}
.cobreq--confirmado,
.cobreq--cobrado {
  --cobreq-fg: #15803d;
  --cobreq-bg: #ecfdf3;
  --cobreq-border: #b7ebc9;
}
.cobreq--rechazada {
  --cobreq-fg: #c0261b;
  --cobreq-bg: #fef3f2;
  --cobreq-border: #fbd3cf;
}
.cobreq__info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 0;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}
.cobreq__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff;
  color: var(--cobreq-fg);
  box-shadow: 0 0 0 1px var(--cobreq-border);
}
.cobreq__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}
.cobreq__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--cobreq-fg);
}
.cobreq__date {
  overflow: hidden;
  margin-top: 2px;
  font-size: 0.75rem;
  color: #667085;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.cobreq__info:hover .cobreq__title,
.cobreq__info:focus-visible .cobreq__title {
  text-decoration: underline;
}
.cobreq__info:focus-visible {
  outline: 2px solid var(--cobreq-fg);
  outline-offset: 2px;
  border-radius: 6px;
}
.cobreq__acciones {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-left: 6px;
  border-left: 1px solid var(--cobreq-border);
}
.cobreq__acciones .v-btn {
  height: 24px !important;
}
.cobreq__registrar {
  font-weight: 600;
}
@media (max-width: 960px) {
  .cobreq-col {
    max-width: none;
    width: 100%;
  }
}
/* celular y tablet: los dos pasos a lo ancho de la tarjeta */
@media (max-width: 960px) {
  .cobro-pasos {
    min-width: 0;
    width: 100%;
  }
  .cobro-pasos__btn {
    min-height: 40px;
  }
}
.blinking {
  padding: 10px 20px;
  /* color: white; */
  background-color: #f3e5f5;
  animation: blinkOnOff 1s infinite;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  display: inline-block;
}

.tabla-resumen-ingresos {
  width: 100%;
}

.tabla-resumen-ingresos :deep(table) {
  width: 100%;
}

@keyframes blinkOnOff {
  0%,
  100% {
    background-color: #f3e5f5; /* prendido */
  }
  50% {
    background-color: white; /* apagado, pero aún visible */
  }
}

.correlativo-selection {
  font-size: 16px;
  font-weight: 400;
  color: #202124;
}

.correlativo-code {
  font-size: 22px !important;
  font-weight: 700 !important;
  color: #111827 !important;
  line-height: 1.2;
  margin-bottom: 5px;
}

.correlativo-descripcion {
  font-size: 16px !important;
  color: #6b7280 !important;
  display: flex;
  align-items: center;
}

.correlativo-descripcion .v-icon {
  color: #64748b;
} 
</style>
