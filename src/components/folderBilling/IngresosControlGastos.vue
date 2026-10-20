<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import moment from "moment";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useSecuritysStore } from "@/stores/securitys";
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
  DatosFacturaHouse,
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
import { sessionUser } from "@/utils/sesion";

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

const rootStore = useStore();
const route = useRoute();
const appRouter = useRouter();
const controlGastosStore = useControlGastosStore();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const housesStore = useHousesStore();
const enterprisesStore = useEnterprisesStore();
const pricingStore = usePricingStore();
const securitysStore = useSecuritysStore();
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
const id_branch = ref<number | string>("");
const obtenerDatosHouse = ref<boolean>(null as unknown as boolean);
const dialogFacturar = ref(false);
const dialogNewDebs = ref(false);
const dialogIngreso = ref(false);
const dialogDebs = ref(false);
const dialogDebsEdit = ref(false);
const loading = ref(false);
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
const masterHouses = computed(() => componentProps.master_houses as unknown as HouseIngreso[]);
const datosManuales = undefined as unknown as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let ingreso: object | undefined;
let id: number | undefined;
let datosFactura: DatosFacturaHouse;
let id_house: number | undefined;

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
async function eliminarHouseIngreso(house: HouseIngreso) {
  Swal.fire({
    icon: "question",
    title: "ADVERTENCIA",
    text: "¿Está seguro que desea eliminar todo el registro de ingresos de este expediente (house)?",
    showDenyButton: true,
    confirmButtonText: "Si",
    denyButtonText: "No",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const config = {
          method: "put",
          url:
            import.meta.env.VITE_URL_MAIN +
            "setHouseIngresosDelete/" +
            house.id_house,
          headers: {
            "Content-Type": "application/json",
          },
        };

        const response = await axios(config);

        if (response.data && response.data.status == "401") {
          Swal.fire({
            icon: "error",
            text: response.data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          });
          return;
        }

        if (response.data && response.data.statusBol) {
          Swal.fire({
            icon: "success",
            title: "REGISTRO ELIMINADO.",
          });

          await controlGastosStore.getListControlGastosHouses(route.params.id as string);
          emit("recalcularProfit");
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: error as string,
        });
      }
    }
  });
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
async function copiarMontos() {
  if ((await frmCopiar.value!.validate()).valid) {
    loadingCopiarMonto.value = true;
    await controlGastosStore.copiarCGingresos({
      ...ingresos.value,
      tipocambio: ingresos.value.tipocambio || 1,
    });
    await controlGastosStore.getListControlGastosHouses(route.params.id as string);
    dialogCopiar.value = false;
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
  obtenerDatos();
  dialogFacturar.value = true;
}
async function nuevoControlGasto(house: HouseIngreso) {
  house.id_master = route.params.id as string;
  await controlGastosStore.setControl(house as HouseIngreso & { id_master: string | number });
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  rootStore.state.spiner = false;
}
function obtenerMoneda() {
  const monedas = [...rootStore.state.itemsCoinsList];
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
    if (decimales > 2) {
      tipocambio.value = parseFloat(String(tipocambio.value)).toFixed(2);
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
    await axios(config)
      .then(async function () {
        dialogNewDebs.value = false;
        dialogDebs.value = false;
        await controlGastosStore.getListControlGastosHouses(route.params.id as string);

        cleandData();

        // vm.dialogDebs = true;
        Swal.fire({
          icon: "success",
          title: "Pago Cargado",
          text: "El pago ha sido cargado correctamente",
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  loading.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function listControlGasto() {
  rootStore.state.spiner = true;
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  rootStore.state.spiner = false;
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
  await axios(config)
    .then(async function () {
      await controlGastosStore.getListControlGastosHouses(route.params.id as string);
      dialogDebs.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
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
  await controlGastosStore.actualizarIngresos(data);
  await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  statusBtn.value = 1;
  dialogIngreso.value = false;
  emit("recalcularProfit");
}
async function delIngreso(item: IngresoDetalle, house: HouseIngreso) {
  const deuda = getDeudaActual(house);
  if ((house.total_total_op_ingresos as number) > (deuda as number)) {
    Swal.fire({
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
    }).then(async (respuesta) => {
      if (respuesta.isConfirmed) {
        let val = true;
        let msg = "";

        await Swal.fire({
          title: "Ingrese sus datos Administrador",
          html:
            '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
            '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Aceptar",
          cancelButtonText: "Cancelar",
          preConfirm: () => {
            const input1 = (
              document.getElementById("swal-input1") as HTMLInputElement
            ).value.trim();
            const input2 = (
              document.getElementById("swal-input2") as HTMLInputElement
            ).value.trim();
            if (!input1 || !input2) {
              Swal.showValidationMessage(
                "Por favor, complete ambos campos",
              );
              return false;
            }
            return { usuario: input1, clave: input2 };
          },
        }).then(async (result) => {
          if (!result.isConfirmed) {
            val = false;
            msg = "Operación cancelada";

            return;
          }

          if (result.value) {
            const res = await securitysStore.validarUsuarioAdmin({
              usuario: result.value.usuario,
              clave: result.value.clave,
            });

            if (res && res.estadoflag) {
              val = true;
            } else {
              val = false;
              msg = res?.mensaje || "Credenciales incorrectas";
            }
          } else {
            val = false;
            msg = "Debe ingresar las credenciales";
          }
        });

        if (!val) {
          await Swal.fire({
            icon: "error",
            title: "No autorizado",
            text: msg,
            confirmButtonColor: "#0878dc",
          });

          return false;
        }

        await continuarEliminar(item.id);
      }
    });
  } else {
    continuarEliminar(item.id);
  }
}
async function continuarEliminar(id: number | undefined) {
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
      await controlGastosStore.eliminarIngreso(data);
      await controlGastosStore.getListControlGastosHouses(route.params.id as string);
      emit("recalcularProfit");
    }
  });
}
async function setIngresos() {
  if (!(await frmIngreso.value!.validate()).valid) {
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
    id_user: sessionUser().id,
    tipo_pago: ingresos.value.opcion,
    numero: ingresos.value.numero,
    fecha: ingresos.value.fecha,
    id_master: route.params.id as string,
  };
  await controlGastosStore.guardarIngresos(data);
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
    await axios(config)
      .then(function () {
        cleandData();

        // vm.dialogDebs = true;
        Swal.fire({
          icon: "success",
          title: "Pago Cargado",
          text: "El pago ha sido cargado correctamente",
        }).then(async (result) => {
          if (result.isConfirmed) {
            dialogDebsEdit.value = false;
            dialogDebs.value = false;
            await controlGastosStore.getListControlGastosHouses(route.params.id as string);
          }
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
async function obtenerDatos() {
  obtenerDatosHouse.value = true;
  datosFactura = [] as unknown as DatosFacturaHouse;
  const config = {
    method: "get",
    url: `${import.meta.env.VITE_URL_MAIN}data_factura/${house.value.id_house}/${id_branch.value}`,

    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config).then(function (response) {
    if (response.data.statusBol == true) {
      datosFactura = response.data.data[0];
    }
  });
  obtenerDatosHouse.value = false;
}
async function generarDocumento() {
  // return
  errorCoin.value = "";
  if (!id_coins.value) {
    errorCoin.value = "Seleccione una moneda";
    coinSelect.value!.focus();
    return;
  }
  const monedas = [...rootStore.state.itemsCoinsList];
  const monedaSeleccionada = monedas.find((v) => v.id === id_coins.value);
  if (monedaSeleccionada) {
    datosFactura.coins = monedaSeleccionada.symbol;
  }
  datosFactura.details = selected.value.map((element) => {
    return {
      concepto: element.concepto,
      id_orders: element.id_orders,
      monto: element.montoopcuentabanco,
      igv: element.igvopcuentabanco,
      total: element.totalopcuentabanco,
    };
  });
  id_house = selected.value[0]!.id_house;
  let total = 0;
  let total_igv = 0;
  let total_monto = 0;

  selected.value.forEach((element) => {
    total = parseFloat(String(total)) + parseFloat(String(element.total_op));
    total_igv = parseFloat(String(total_igv)) + parseFloat(String(element.igv_op));
    total_monto = parseFloat(String(total_monto)) + parseFloat(String(element.monto_op));
  });

  datosFactura.total = parseFloat(String(total)).toFixed(2);
  datosFactura.url_logo = sessionUser().path;
  datosFactura.total_igv = parseFloat(String(total_igv)).toFixed(2);
  datosFactura.total_monto = parseFloat(String(total_monto)).toFixed(2);
  datosFactura.nombreProforma = nombreProforma.value;
  obtenerDatosHouse.value = true;
  datosFactura.impuesto =
    enterprisesStore.impuesto.nombre_impuesto;
  const data = datosFactura;
  // console.log(vm.datosFactura);
  // return;
  const config = {
    method: "post",
    url: `${import.meta.env.VITE_URL_MAIN}generar_factura`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  const res = await axios(config).then(function (response) {
    return response;
  });

  if (res.data.statusBol == true) {
    registrarFactura(res.data);
    dialogFacturar.value = false;
    nombreProforma.value = "PROFORMA";
    obtenerDatosHouse.value = false;
  }
}
async function registrarFactura(data: { nro_factura: string; path: string }) {
  const dataFactura = {
    id_house: id_house,
    id_coins: id_coins.value,
    nro_factura: data.nro_factura,
    url_documento: import.meta.env.VITE_URL_MAIN + data.path,
    total_monto: datosFactura.total_monto,
    total_igv: datosFactura.total_igv,
    total: datosFactura.total,
    id_correlativo: selected.value[0]!.id_correlativo,
    details: selected.value,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "registrar_factura",
    headers: {
      "Content-Type": "application/json",
    },
    data: dataFactura,
  };
  await axios(config);
  window.open(import.meta.env.VITE_URL_MAIN + data.path, "_blank");
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
      rootStore.state.spiner = true;
      await Promise.all([
        housesStore.getFacturasFiscales(house.value),
        controlGastosStore.getListControlGastosHouses(route.params.id as string),
      ]);
      rootStore.state.spiner = false;
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
            rootStore.state.spiner = true;
            await Promise.all([
              housesStore.getFacturasFiscales(house.value),
              controlGastosStore.getListControlGastosHouses(route.params.id as string),
            ]);
            isDataTableLoading.value = false;
            rootStore.state.spiner = false;
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
  const targetLabel = rootStore.state.itemsMasterList.find(
    (x: ExpedienteItem) => x.id === selectedNuevoExpediente.value,
  ).code_master;
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
          "No se pudo reasignar el expediente. Se requiere soporte de backend.",
      });
    }
  } catch (error) {
    console.error(error);
    await Swal.fire({
      icon: "info",
      text: "Endpoint para reasignar house a otro master no disponible. Front listo; requerirá habilitar API (PUT reasignar_house).",
    });
  }
}
async function eliminarFactura(item: number) {
  dialogFacturaEmitidas.value = false;
  let val = false;
  let msg = "";

  await Swal.fire({
    title: "Ingrese sus datos Administrador",
    html:
      '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
      '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    focusConfirm: false,
    didOpen: () => {
      // Aquí forzamos el foco manualmente
      document.getElementById("swal-input1")!.focus();
    },
    preConfirm: () => {
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value;
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value;

      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }

      return {
        usuario: input1,
        clave: input2,
      };
    },
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      const res = await securitysStore.validarUsuarioAdmin(result.value);
      val = res!.estadoflag === true;
      msg = res!.mensaje;
    }
  });

  if (!val) {
    if (msg) {
      await Swal.fire({ icon: "error", text: msg });
    }
    return;
  }

  // Si pasa la validación, anula la factura
  const datos = { id: item };
  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "anular_factura",
    headers: {
      "Content-Type": "application/json",
    },
    data: datos,
  };

  try {
    const response = await axios(config);
    console.log(response);
    await Swal.fire(
      "¡Anulada!",
      "Factura anulada correctamente.",
      "success",
    );
    await controlGastosStore.getListControlGastosHouses(route.params.id as string);
  } catch (error) {
    console.error(error);
    Swal.fire(
      "Error",
      "Ocurrió un problema al anular la factura.",
      "error",
    );
  }
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

onMounted(async () => {
  id_branch.value = Number(route.params.id_branch);
  setTimeout(() => {
    headersFacturas.value[2]!.title =
      enterprisesStore.impuesto.nombre_impuesto!;
    headersFacturas.value[4]!.title =
      enterprisesStore.impuesto.nombre_impuesto!;
    mostrarImpuesto.value =
      enterprisesStore.impuesto.mostrarimpuesto;
    if (!mostrarImpuesto.value) {
      headersFacturas.value.splice(2, 1);
      headersFacturas.value.splice(4, 1);
    }
  }, 2000);
});
</script>

<template>
  <v-container fluid>
    <h3>
      Ingresos (Venta al cliente) Pricing:
      {{ formatUsd(ingreso_pr) }} / ------- Operaciones:
      {{ formatUsd(ingreso_op) }}
    </h3>
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
          <v-table density="compact">
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
                <td>{{ houseIngreso.consigner }} - {{ houseIngreso.correlativo }}</td>
                <td>
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
                    v-if="!houseIngreso.ruta_cotizacion"
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

                <td>{{ houseIngreso.total_total_pr_ingresos }}</td>
                <td>{{ houseIngreso.total_total_op_ingresos }}</td>
                <td>{{ getDeudaActual(houseIngreso) }}</td>
                <td v-if="editable">
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
                  <v-tooltip
                    location="bottom"
                    color="error"
                    v-if="bloquearCopiarMontos(houseIngreso.ingresos)"
                  >
                    <template #activator="{ props }">
                      <!-- @vue-expect-error the original passes the income rows where the house is expected -->
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
                <td v-if="editable">
                  <v-btn
                    v-if="houseIngreso.id_orders"
                    color="indigo"
                    size="small"
                    class="mb-1"
                    @click.stop="abrirModalCambiarExpediente(houseIngreso)"
                    :loading="flagCambiarExpediente"
                  >
                    Cambiar expediente
                  </v-btn>
                  <v-btn
                    v-if="houseIngreso.id_orders"
                    color="red-darken-1"
                    size="small"
                    @click.stop="eliminarHouseIngreso(houseIngreso)"
                  >
                    Eliminar
                  </v-btn>
                </td>
                <td>
                  <v-icon
                    :disabled="!houseIngreso.tienefactura"
                    color="info"
                    @click.stop="verProformas(houseIngreso)"
                  >
                    mdi-eye
                  </v-icon>
                </td>
                <td v-if="editable">
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
                    v-if="houseIngreso.id_orders"
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
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
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
                <td>{{ item.concepto }}</td>
                <td style="background: #d6f4ff">
                  {{ parseFloat(String(item.monto_pr)).toFixed(2) }}
                </td>
                <td
                  style="background: #d6f4ff"
                  v-if="mostrarImpuesto"
                >
                  {{ parseFloat(String(item.igv_pr)).toFixed(2) }}
                </td>
                <td style="background: #d6f4ff">
                  {{ parseFloat(String(item.total_pr)).toFixed(2) }}
                </td>
                <td style="background: #ffd6d6">
                  {{ parseFloat(String(item.monto_op)).toFixed(2) }}
                </td>
                <td
                  style="background: #ffd6d6"
                  v-if="mostrarImpuesto"
                >
                  {{ parseFloat(String(item.igv_op)).toFixed(2) }}
                </td>
                <td style="background: #ffd6d6">
                  {{ parseFloat(String(item.total_op)).toFixed(2) }}
                </td>
                <!-- Monto Op Cuenta Banco -->
                <td
                  style="background: #d8ffde"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  {{ parseFloat(String(item.montoopcuentabanco)).toFixed(2) }}
                  {{ item.acronym }}
                </td>
                <!-- IGV Op Cuenta Banco -->
                <td
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
                  style="background: #d8ffde"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  {{ parseFloat(String(item.totalopcuentabanco)).toFixed(2) }}
                  {{ item.acronym }}
                </td>
                <!-- Tipo Cambio Cuenta Banco -->
                <td
                  style="background: #d8ffde"
                  v-if="mostrarMontoOperativos(houseIngreso.ingresos)"
                >
                  {{ item.tipocambio == 1 ? "No Aplica" : item.tipocambio }}
                </td>
                <td>
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
                <td v-if="editable">
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
                    v-if="item.pagado == 0"
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
                    :items="rootStore.state.itemsCoinsList"
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
                        rootStore.state.itemsCoinsList.find(
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
                v-if="item.status == 1"
                @click="editarDebs(item)"
              >
                mdi-pencil
              </v-icon>
              <v-icon
                class="btn_add mr-2"
                size="small"
                color="red"
                v-if="item.status == 1"
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
                    :items="rootStore.state.itemsCoinsList"
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
                    :items="rootStore.state.itemsDataBanksList"
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
                    :items="rootStore.state.itemsDataBanksList"
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
                    :items="rootStore.state.itemsCoinsList"
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
                  <!-- @vue-expect-error the original calls _uploadFile without a file and compares payfile with an array literal -->
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
                    :items="rootStore.state.itemsCoinsList"
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
                <v-col
                  cols="8"
                  v-if="rootStore.state.branchs.length > 1"
                >
                  <v-autocomplete
                    :items="rootStore.state.branchs"
                    item-title="trade_name"
                    item-value="id"
                    label="Sucursal"
                    placeholder="Seleccione una sucursal"
                    v-model="id_branch"
                    @update:model-value="obtenerDatos()"
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
            :disabled="id_branch == '' || selected.length == 0"
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
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Facturas y Proformas Fiscales de {{ house.consigner }}
          <v-spacer />
          <v-btn
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
              >
                <v-icon
                  class="btn_add mr-2"
                  size="large"
                  color="grey"
                  @click="openDoc(item.path!)"
                >
                  mdi-eye
                </v-icon>
              </v-btn>
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                variant="text"
                icon
                size="small"
              >
                <v-icon
                  class="btn_add mr-2"
                  size="large"
                  color="red"
                  @click="eliminarProformaFiscal(item.id)"
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
    >
      <v-card>
        <v-card-title primary-title>
          <h2>Proformas Activas</h2>
        </v-card-title>

        <v-card-text class="px-5">
          <v-table width="100%">
            <thead>
              <th>#</th>
              <th>Nro Factura</th>
              <th>Doc. Ref.</th>
              <th>Monto</th>
              <th>IGV</th>
              <th>Total</th>
              <th />
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
              rootStore.state.itemsMasterList.filter(
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
    >
      <v-card>
        <v-card-title primary-title>
          COPIAR COSTOS {{ ingresos.consigner }} - {{ ingresos.correlativo }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCopiar">
            <v-autocomplete
              :items="rootStore.state.itemsCoinsList"
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
                rootStore.state.itemsCoinsList.some(
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
            @click="dialogCopiar = !dialogCopiar"
          >
            CANCELAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
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
