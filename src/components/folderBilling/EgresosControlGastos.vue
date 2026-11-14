<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useRoute } from "vue-router";
import moment from "moment";
import axios from "@/api/http";
import Swal from "sweetalert2";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import FormatFecha from "../comun/FormatFecha.vue";
import { useCoinsStore } from "@/stores/coins";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useFilesStore } from "@/stores/files";
import { useMastersStore } from "@/stores/masters";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useBankStore } from "@/stores/bank";
import type { ControlGastoHouse } from "@/types/finanzas";
import type {
  CuentaBancariaForm,
  CuentaBancariaProveedor,
  EgresoDetalle,
  EgresoForm,
  EncabezadoColumna,
  ExpedienteItem,
  EgresoProveedor,
  FacturaProveedorCargada,
  GrupoCliente,
  MonedaItem,
  Monto,
  ProveedorItem,
  SolicitudPagoListada,
  TipoPagoSolicitud,
  SolicitudPagoControl,
} from "@/types/billingEntries";
import { sessionBranchId, sessionUser } from "@/utils/sesion";
import { downloadPdf } from "@/utils/pdfDownload";
import { usePermissions } from "@/composables/usePermissions";
import type { ApiResponse } from "@/types/api";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import type { AdminCredentials } from "@/types/seguridad";
import { askAdminCredentials, withAuthorization } from "@/utils/adminCredentials";

const componentProps = withDefaults(
  defineProps<{
    statusBtn?: number;
    prFlag?: boolean;
    opFlag?: boolean;
    // eslint-disable-next-line vue/prop-name-casing
    egreso_pr?: number;
    // eslint-disable-next-line vue/prop-name-casing
    egreso_op?: number;
    editable?: boolean;
    // eslint-disable-next-line vue/prop-name-casing
    master_egresos?: ControlGastoHouse[];
  }>(),
  {
    statusBtn: 0,
    prFlag: false,
    opFlag: false,
    egreso_pr: 0,
    egreso_op: 0,
    editable: true,
    master_egresos: undefined,
  },
);
const emit = defineEmits<{
  recalcularProfit: [];
  statusBtn: [status: number];
  recargarDatos: [];
  solicitudPagoRegistrada: [];
}>();

const appStore = useAppStore();
const { can } = usePermissions();
const undeclaredAppState = appStore as typeof appStore & {
  controlgastos: { master_houses: ControlGastoHouse[] };
  master_houses: ControlGastoHouse[];
};
const warnIfRefused = (response: ApiResponse) => {
  if (response.estadoflag) return false;
  Swal.fire({ icon: response.tipomensaje === "TMSGERR" ? "error" : "warning", text: response.mensaje });
  return true;
};
const route = useRoute();
const bankStore = useBankStore();
const controlGastosStore = useControlGastosStore();
const filesStore = useFilesStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();
const mastersStore = useMastersStore();
const frmMoverCosto = useTemplateRef("frmMoverCosto");
const frmEgreso = useTemplateRef("frmEgreso");
const frmPorcentajeProveedor = useTemplateRef("frmPorcentajeProveedor");
const frmCuentaBancaria = useTemplateRef("frmCuentaBancaria");
const frmCopiar = useTemplateRef("frmCopiar");

const dialogCambiarExp = ref(false);
const dialogCambiarExpediente = ref(false);
const selectedNuevoExpediente = ref<number | null>(null);
const egreso = ref({} as EgresoProveedor);
const id_masterdestino = ref<number | null>(null);
const dialogCopiar = ref(false);
const loadingPorcentaje = ref(false);
const loading = ref(false);
const dialog = ref(false);
const dialogListInvoice = ref(false);
const dialogInvoice = ref(false);
const dialogPorcentajeProveedor = ref(false);
const dialogPayment = ref(false);
const dialogSolicitudDivision = ref(false);
const dialogSolicitud = ref(false);
const checkPago = ref(false);
const checkMaster = ref(false);
const date = ref(moment().format("YYYY-MM-DD"));
const id_correlativo = ref<Monto | undefined>("");
const tipocambio = ref<Monto | undefined>(1);
const id_coins = ref<number | string | null | undefined>(null);
const sufmoneda = ref("USD");
const nameproveedor = ref<string | undefined>("");
const payfile = ref("" as unknown as File | null);
const boolFile = ref(false);
const errFile = ref("");
const msgFile = ref<string | null>("");
const nro_invoice = ref("");
const conceptos = ref("" as unknown as EgresoDetalle[]);
const codigo_master = ref<string | null | undefined>(null);
const search = ref("");
const comentarios = ref("");
const codigo_pago = ref("");
const radio = ref<number | string>(1);
const invoiceOptions = [
  { value: "1", label: "Factura Fiscal", icon: "mdi-receipt-text-outline" },
  { value: "2", label: "Proforma", icon: "mdi-file-document-outline" },
  { value: "3", label: "Otros (ej. email)", icon: "mdi-email-outline" },
];
const invTipoRef = ref<{ focus: () => void } | null>(null);
// "ALFOSAC(11960) - 0001" -> nombre, id y correlativo para la cabecera del modal
// "ALFOSAC(11960) - 0001" -> { nombre: "ALFOSAC", id: "11960", correlativo: "0001" }
function partesProveedor(texto: string, idProveedor: unknown) {
  const m = /^(.*?)\s*\((\d+)\)\s*(?:-\s*(.+))?$/.exec(texto);
  return {
    nombre: (m?.[1] ?? texto).trim(),
    id: m?.[2] ?? String(idProveedor ?? ""),
    correlativo: m?.[3]?.trim() ?? "",
  };
}
const proveedorInvoice = computed(() => partesProveedor(nameproveedor.value ?? "", egreso.value?.id_proveedor));
const monedaInvoice = computed(() => {
  const acronimo = egreso.value?.detalle?.[0]?.acronym ?? "";
  const moneda = (appStore.itemsCoinsList as (MonedaItem & { name?: string })[]).find((c) => c.acronym === acronimo);
  return [acronimo, moneda?.name].filter(Boolean).join(" - ") || "—";
});
const e1 = ref(1);
const egresos = ref<EgresoForm>({
  id: null,
  id_orders: "",
  concepto: "",
  statusCalcula: false,
  opcion: null,
  numero: "",
  fecha: moment(new Date()).format("YYYY-MM-DD"),
  monto_op: 0,
  montoopview: 0,
  igv_op: 0,
  total_op: 0,
  monto_pr: 0,
  igv_pr: 0,
  total_pr: 0,
  id_proveedor: null,
  montoopcuentabanco: 0,
  igvopcuentabanco: 0,
  totalopcuentabanco: 0,
});
const headersInvoice = [
  {
    title: "Nombre",
    key: "originalname",
  },
  {
    title: "Fecha",
    key: "date_letra",
  },
  {
    title: "Monto de la Factura",
    key: "monto",
  },
  {
    title: "Ver",
    key: "path",
  },
  {
    title: "Acción",
    key: "action",
  },
] as const;
const headersPdf = [
  {
    title: "Nombre",
    align: "start",
    sortable: false,
    key: "path",
  },
  {
    title: "Fecha Creado",
    key: "fecha_letra",
  },
  {
    title: "Hora Creado",
    key: "hora_letra",
  },
  {
    title: "Fecha de Solicitud",
    key: "fecha_sol_letra",
  },
  {
    title: "Fecha de Pago",
    key: "fecha_pago_letra",
  },
  {
    title: "Ver",
    key: "accion",
  },
  {
    title: "Status",
    key: "status",
  },
  {
    title: "Enviar",
    key: "accions",
  },
] as const;
const headersAccount = [
  { title: "Beneficiario", key: "beneficiario" },
  {
    title: "Cuenta",
    align: "start",
    sortable: false,
    key: "nameaccount",
  },
  { title: "Banco", key: "namebanks" },
  { title: "Moneda", key: "namecoins" },
  { title: "Número de cuenta", key: "accountnumber" },
] as const;
const headers = ref<EncabezadoColumna[]>([
  {
    title: "Concepto",
    align: "start",
    sortable: false,

    key: "concepto",
  },
  {
    title: "Monto",
    key: "monto",
  },
  {
    title: "IGV",
    key: "igv_op",
  },
  {
    title: "Total",
    key: "total_op",
  },
  {
    title: "Status",
    key: "pagado",
  },
]);
const itemsListInvoice = ref<FacturaProveedorCargada[]>([]);
const dataList = ref([] as unknown as boolean);
const itemsSPayment = ref<SolicitudPagoListada[]>([]);
const selectedAccount = ref<CuentaBancariaProveedor[]>([]);
const selected = ref<EgresoDetalle[]>([]);
const showSeccion2NuevoEgreso = ref(false);
const showSeccion3NuevoEgreso = ref(false);
const showSeccion4NuevoEgreso = ref(false);
const isBotonGuardarEgresoDisabled = ref(true);
const dialogCuentaBancaria = ref(false);
const loadingBotonGuardarCuentaBancaria = ref(false);
const cuentaBancaria = ref<CuentaBancariaForm>({
  id_entities: "",
  nro_cuenta: "",
  cci: "",
  id_banco: "",
  id_coins: "",
  nro_swift: "",
  id_intermediario: "",
  nro_cuenta_intermediario: "",
});
const monto_factura = ref("");
const isDataTableLoading = ref(false);
const mostrarImpuesto = ref<boolean | undefined>(true);
const clientesAbiertos = ref<Record<string, boolean>>({});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payPath: number | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let msgfile: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let errfile: string | undefined;
let TotalLocal: number | undefined;
let total: number | string | undefined;
let proveedorId: number | undefined;
let id_master: number | undefined;
let dataProveedor: EgresoProveedor | undefined;
let id_tipotransaccion: number | string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let itemsInvoice: unknown;
let paymentsProvider: EgresoProveedor | undefined;
// openPaymentFile is not defined in this component, so the template call throws
const openPaymentFile = undefined as unknown as (path?: string) => void;
const masterEgresos = computed(() => componentProps.master_egresos as unknown as EgresoProveedor[]);
const ingreso_pr = undefined as unknown as number;
const ingreso_op = undefined as unknown as number;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let nameproveedorLocal: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadingFile: boolean | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let ingreso: object | undefined;

const getNameModalNuevoEditar = computed(() => {
  if (egresos.value && egresos.value.id) {
    return "EDITAR REGISTRO COSTO";
  }
  return "REGISTRO DE NUEVO COSTO";
});
const listHouses = computed(() => {
  const houses = [
    {
      consigner: "COSTO ASOCIADO AL MASTER",
      id_orders: null,
    },
    ...controlGastosStore.master_houses,
  ];
  return houses;
});
const nombreCodigoPago = computed(() => {
  const shipment =
    (controlGastosStore.listControlGastos[0] &&
      controlGastosStore.listControlGastos[0]
        .master_shipment) ||
    "";
  let codigoPago = "";
  switch (shipment) {
    case "LCL":
      codigoPago = "Coloader";
      break;

    case "FCL":
      codigoPago = "Naviera";
      break;

    case "Aéreo":
      codigoPago = "Linea Aerea";
      break;

    default:
      break;
  }
  return codigoPago;
});

function mostrarBotonCambiarExpAsociado(item: EgresoProveedor) {
  return !item.detalle.some((v) => !!v.consigner);
}
function abrirModalCambiarExpediente(item: EgresoProveedor) {
  egreso.value = item;
  dialogCambiarExpediente.value = true;
}
async function aplicarCambioExpediente() {
  loading.value = true;
  await mastersStore.CambiarExpedienteAsociadoAMaster({
    id_master: egreso.value.id_master,
    id_proveedor: egreso.value.id_proveedor,
    id_correlativo: egreso.value.id_correlativo,
    id_nuevo_master: selectedNuevoExpediente.value,
  });
  loading.value = false;
  dialogCambiarExpediente.value = false;
  emit("recargarDatos");
}
function mostrarColumnaMonedaDiferenteDolar(item: EgresoProveedor) {
  if (item.detalle.some((v) => v.acronym !== "USD")) {
    return true;
  }
  return false;
}
function recibirId(file: { id: unknown; archivo: unknown }) {
  // @ts-expect-error the emitted payload has id, not inserid
  payPath = file.inserid;
  payfile.value = file.archivo as File | null;

  msgfile = "Archivo procesado y vinculado correctamente.";
  errfile = "";
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalCambiarExp(item: EgresoProveedor) {
  egreso.value = item;
  dialogCambiarExp.value = true;
  nextTick(() => {
    frmMoverCosto.value!.reset();
  });
}
async function functionMoverCostos() {
  const id_controlgastos = egreso.value.detalle.map((v) => {
    return v.id;
  });
  if ((await frmMoverCosto.value!.validate()).valid) {
    const data = {
      id_masterorigen: egreso.value.id_master,
      id_proveedor: egreso.value.id_proveedor,
      id_masterdestino: id_masterdestino.value,
      id_correlativo: egreso.value.id_correlativo,
      id_controlgastos: id_controlgastos.join(","),
    };
    loading.value = true;
    await mastersStore.moverCostos(data);
    loading.value = false;
    dialogCambiarExp.value = false;
    await controlGastosStore.getListControlGastosMaster(route.params.id as string);
  }
}
function clienteKey(egreso: EgresoProveedor, grupo: GrupoCliente) {
  const base = egreso.id_proveedor || egreso.id_master || "";
  const id_house = grupo.id_house || "";
  const code_house = grupo.code_house || "";
  const consigner = grupo.consigner || "";
  return `${base}-${id_house}-${code_house}-${consigner}`;
}
function toggleCliente(egreso: EgresoProveedor, grupo: GrupoCliente) {
  const key = clienteKey(egreso, grupo);
  clientesAbiertos.value[key] = !clientesAbiertos.value[key];
}
function isClienteAbierto(egreso: EgresoProveedor, grupo: GrupoCliente) {
  const key = clienteKey(egreso, grupo);
  return !!clientesAbiertos.value[key];
}
function groupDetallePorCliente(detalle: EgresoDetalle[]) {
  if (!detalle || !Array.isArray(detalle)) {
    return [];
  }

  const gruposMap = new Map<string, GrupoCliente & { items: EgresoDetalle[] }>();

  const masterHouses = controlGastosStore.master_houses || [];

  detalle.forEach((item) => {
    const id_house = item.id_house || null;
    const code_house = item.code_house || "";
    let consigner = item.consigner
      ? item.consigner
      : "Costo Global del Expediente";

    // Si no tenemos consigner en el detalle pero sí tenemos id_house,
    // intentamos obtenerlo desde master_houses.
    if (!consigner && id_house !== null && id_house !== undefined) {
      const house = masterHouses.find(
        (h) => h.id_house == id_house || h.id == id_house,
      );
      if (house && house.consigner) {
        consigner = house.consigner as string;
      }
    }

    // clave estable: si hay id_house se usa, si no, combina consigner+code_house
    const key =
      id_house !== null && id_house !== undefined
        ? `house-${id_house}`
        : `client-${consigner}-${code_house}`;

    if (!gruposMap.has(key)) {
      gruposMap.set(key, {
        id_house,
        code_house,
        consigner,
        items: [],
      });
    }

    gruposMap.get(key)!.items.push(item);
  });

  const grupos = Array.from(gruposMap.values());
  return grupos;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirExpandEgreso(index: number) {}
function abrirModalCuentaBancaria() {
  dialogCuentaBancaria.value = true;
}
function nuevoEngreso(item: Partial<EgresoProveedor> = {}) {
  isBotonGuardarEgresoDisabled.value = false;

  egresos.value.id = null;
  egresos.value.id_orders = null;
  egresos.value.concepto = "";
  egresos.value.statusCalcula = false;
  egresos.value.opcion = null;
  egresos.value.pagado = 0;
  egresos.value.numero = "";
  egresos.value.fecha = moment(new Date()).format("YYYY-MM-DD");
  egresos.value.monto_op = 0;
  egresos.value.igv_op = 0;
  egresos.value.total_op = 0;
  egresos.value.monto_pr = 0;
  egresos.value.igv_pr = 0;
  egresos.value.total_pr = 0;
  id_correlativo.value =
    Object.keys(item).length > 0 ? item.id_correlativo : 1;
  egresos.value.id_proveedor =
    Object.keys(item).length > 0 ? item.id_proveedor! : null;
  egresos.value.montoopcuentabanco = 0;
  egresos.value.igvopcuentabanco = 0;
  egresos.value.totalopcuentabanco = 0;
  emit("statusBtn", 1);
  id_coins.value = null;
  tipocambio.value = 1;
  showSeccion2NuevoEgreso.value = false;
  showSeccion3NuevoEgreso.value = false;
  showSeccion4NuevoEgreso.value = false;
  isBotonGuardarEgresoDisabled.value = true;
  dialog.value = !dialog.value;
  setTimeout(() => {
    frmEgreso.value!.resetValidation();
  }, 100);
}
function obtenerMoneda() {
  if (
    typeof id_coins.value !== "undefined" &&
    id_coins.value !== "" &&
    id_coins.value !== null
  ) {
    const monedaSeleccionada = appStore.itemsCoinsList.find(
      (v: MonedaItem) => v.id == id_coins.value,
    );

    if (monedaSeleccionada) {
      sufmoneda.value = monedaSeleccionada.symbol;
      tipocambio.value = sufmoneda.value === "USD" ? 1 : tipocambio.value;
    } else {
      console.warn("No se encontró la moneda con id:", id_coins.value);
    }
  }
}
function calcularE() {
  if (tipocambio.value) {
    const partes = tipocambio.value.toString().split(".");
    const decimales = partes[1] ? partes[1].length : 0;
    if (decimales > 4) {
      tipocambio.value = parseFloat(String(tipocambio.value)).toFixed(4);
    }
  }

  if (egresos.value.statusCalcula) {
    // pricing
    egresos.value.igv_pr = parseFloat(
      String(((egresos.value.monto_pr as number) *
        (enterprisesStore.impuesto.impuesto as number)) /
        100),
    ).toFixed(2);
    egresos.value.total_pr =
      parseFloat(String(egresos.value.monto_pr)) + parseFloat(egresos.value.igv_pr);
    // op
    egresos.value.igvopcuentabanco = parseFloat(
      String(((egresos.value.montoopcuentabanco as number) *
        (enterprisesStore.impuesto.impuesto as number)) /
        100),
    ).toFixed(2);
    egresos.value.totalopcuentabanco = parseFloat(
      String(parseFloat(String(egresos.value.montoopcuentabanco)) +
        parseFloat(
          String(((egresos.value.montoopcuentabanco as number) *
            (enterprisesStore.impuesto.impuesto as number)) /
            100),
        )),
    ).toFixed(2);
    egresos.value.monto_op = parseFloat(
      String((egresos.value.montoopcuentabanco as number) / (tipocambio.value as number)),
    ).toFixed(4);
    egresos.value.montoopview = parseFloat(
      String((egresos.value.montoopcuentabanco as number) / (tipocambio.value as number)),
    ).toFixed(2);
    egresos.value.igv_op = parseFloat(
      String((egresos.value.igvopcuentabanco as unknown as number) / (tipocambio.value as number)),
    ).toFixed(4);
    egresos.value.total_op = parseFloat(
      String(parseFloat(egresos.value.monto_op) + parseFloat(egresos.value.igv_op)),
    ).toFixed(4);
    egresos.value.igvopview = parseFloat(
      String((egresos.value.igvopcuentabanco as unknown as number) / (tipocambio.value as number)),
    ).toFixed(2);
    egresos.value.totalopview = parseFloat(
      String(parseFloat(egresos.value.monto_op) + parseFloat(egresos.value.igv_op)),
    ).toFixed(2);
  } else {
    // pr

    egresos.value.igv_pr = 0;
    egresos.value.total_pr = parseFloat(String(egresos.value.monto_pr));
    // op
    egresos.value.igvopcuentabanco = 0.0;
    egresos.value.totalopcuentabanco = parseFloat(
      String(parseFloat(String(egresos.value.montoopcuentabanco))),
    ).toFixed(2);
    egresos.value.monto_op = parseFloat(
      String((egresos.value.montoopcuentabanco as number) / (tipocambio.value as number)),
    ).toFixed(4);
    egresos.value.montoopview = parseFloat(
      String((egresos.value.montoopcuentabanco as number) / (tipocambio.value as number)),
    ).toFixed(2);
    egresos.value.igv_op = parseFloat(
      String(egresos.value.igvopcuentabanco / (tipocambio.value as number)),
    ).toFixed(4);
    egresos.value.igvopview = parseFloat(
      String(egresos.value.igvopcuentabanco / (tipocambio.value as number)),
    ).toFixed(2);
    egresos.value.total_op = parseFloat(String(parseFloat(egresos.value.monto_op)));
    egresos.value.totalopview = parseFloat(
      String(parseFloat(egresos.value.monto_op)),
    );
  }
}
function validarSolicitudPago(egreso: EgresoProveedor) {
  // con solicitud de pago no se genera un nuevo PDF: primero se elimina la solicitud
  const solicitud = solicitudPagoDe(egreso);
  if (solicitud) {
    Swal.fire({
      icon: "warning",
      title: "No se puede generar un nuevo PDF",
      html: `Tiene la solicitud de pago N° <b>${solicitud.id}</b>. Elimine primero la solicitud de pago.`,
    });
    return;
  }
  const tipocambio = egreso.detalle[0]!.tipocambio;
  let correcto = true;
  egreso.detalle.forEach((element) => {
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tipocambio == element.tipocambio
      ? (correcto = correcto)
      : (correcto = false);
  });

  const statusPagado = egreso.detalle.some((v) => !!v.pagado);
  const statusAdmin_noPagado = egreso.detalle.some(
    (v) => !!v.statusadmin && !v.pagado,
  );

  if (!!statusPagado) {
    Swal.fire({
      icon: "error",
      html: `<b>No se puede realizar una solicitud de pago, porque todos los registros ya han sido pagados</b>`,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "ACEPTAR",
    });
  } else if (!!statusAdmin_noPagado) {
    Swal.fire({
      icon: "warning",
      iconColor: "#f59e0b",
      title: "Ya existe una solicitud de pago",
      text: "¿Deseas eliminar la anterior y generar una nueva?",
      showCancelButton: true,
      buttonsStyling: false,
      reverseButtons: true,
      confirmButtonText: `<span class="spago-confirm-content"><i class="fas fa-trash-alt"></i><span>Eliminar y generar nueva</span></span>`,
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "spago-popup",
        icon: "spago-icon",
        title: "spago-title",
        htmlContainer: "spago-text",
        actions: "spago-actions",
        confirmButton: "spago-confirm",
        cancelButton: "spago-cancel",
      },
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      await _getSPaymentPro(egreso);
      const anterior = itemsSPayment.value?.[0];
      // se elimina el PDF anterior y se vuelve a elegir banco o código de pago en el formulario
      if (anterior?.id && !(await eliminar(anterior.id, false))) return;
      // sin PDF anterior (la lista estaba desactualizada) se sigue el flujo normal
      await controlGastosStore.getListControlGastosMaster(route.params.id as string);
      solicitar(egreso, false);
    });
  } else if (!!correcto) {
    solicitar(egreso);
  } else {
    Swal.fire({
      icon: "error",
      html: `<p style="text-align: center;"><strong>&iexcl;Advertencia!</strong></p>
                1. Debe registrar cada factura con un solo n&uacute;mero de correlativo y tipo de cambio. <br>
                2. Se han detectado que hay dos tipos de cambios distintos para el mismo correlativo en la factura.
                `,
    });
  }
}
async function abrirModalPorcentajeProveedor(item: EgresoProveedor) {
  appStore.cuota = [];
  appStore.fechacuota = [];
  dataProveedor = item;
  appStore.nro_cuotas = item.nro_cuotas ? item.nro_cuotas : 3;
  if (!!item.nro_cuotas) {
    await item.cuotas.forEach((element) => {
      appStore.cuota.push(element.porcentaje);
      appStore.fechacuota.push(element.fecha);
    });
  }
  // } else {
  //   this.$store.state.cuota = [];
  //   this.$store.state.fechacuota = [];
  // }

  dialogPorcentajeProveedor.value = !dialogPorcentajeProveedor.value;
}
function cerrarModal() {
  frmPorcentajeProveedor.value!.reset();
  dialogPorcentajeProveedor.value = !dialogPorcentajeProveedor.value;
}
function viewPdf(pdf: string) {
  window.open(import.meta.env.VITE_URL_MAIN + pdf, "_blank");
}
function validatePorcentaje() {
  let val = true;
  let sum = 0;
  let html = "<ul>";
  for (let i = 0; i < appStore.nro_cuotas; i++) {
    sum += parseFloat(appStore.cuota[i] as string);
  }
  if (sum != 100) {
    val = false;
    html += "<li>El porcentaje final debe ser igual al 100%</li>";
  }
  html += "</ul>";
  if (!val) {
    Swal.fire({
      icon: "error",
      html: html,
    });
  }
  return val;
}
async function _setData() {
  if (!(await frmEgreso.value!.validate()).valid) {
    return;
  }

  const master = masterEgresos.value.find(
    (v) =>
      v.id_proveedor == egresos.value.id_proveedor &&
      v.id_correlativo == id_correlativo.value,
  );

  if (!!master) {
    const moneda = appStore.itemsCoinsList.find(
      (v: MonedaItem) => v.id == id_coins.value,
    );

    const exiteOtraMoneda = master.detalle.some(
      (v) => v.acronym != moneda!.acronym,
    );
    if (exiteOtraMoneda) {
      Swal.fire({
        icon: "warning",
        title: "MONEDAS SOLES DOLARES",
        html: `<b>Hay conceptos con monedas diferentes</b><br><br>Por favor chequear. NO SE CARGARÁ EL COSTO.`,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }
  }

  isBotonGuardarEgresoDisabled.value = true;

  const data = {
    id_master: controlGastosStore.listControlGastos[0]!.master_id,
    id_orders: egresos.value.id_orders,
    id_proveedor: egresos.value.id_proveedor,
    concepto: egresos.value.concepto,
    monto_op: egresos.value.monto_op,
    monto_pr: egresos.value.monto_pr,
    igv_pr: egresos.value.igv_pr,
    total_pr: egresos.value.total_pr,
    igv_op: egresos.value.igv_op,
    total_op: egresos.value.total_op,
    id_coins: id_coins.value,
    montoopcuentabanco: egresos.value.montoopcuentabanco,
    igvopcuentabanco: egresos.value.igvopcuentabanco,
    totalopcuentabanco: egresos.value.totalopcuentabanco,
    id_correlativo: id_correlativo.value,
    tipocambio: tipocambio.value,
  };

  if (warnIfRefused(await request({ method: "post", url: import.meta.env.VITE_URL_MAIN + "setEgresos", data }))) return;
  await controlGastosStore.getListControlGastosMaster(route.params.id as string);
  dialog.value = false;
  emit("recalcularProfit");
}
function solicitar(egreso: EgresoProveedor, confirmar = true) {
  selected.value = [];
  let TLocal = 0;
  // this.TotalLocal = egreso.detalle.reduce(monto);
  egreso.detalle.forEach((element) => {
    TLocal = parseFloat(String(TLocal)) + parseFloat(String(element.total_op));
  });
  TotalLocal = TLocal;
  total = 0;

  proveedorId = egreso.id_proveedor;
  nameproveedor.value = egreso.nombre_proveedor;
  conceptos.value = egreso.detalle;
  id_correlativo.value = egreso.id_correlativo;
  id_master = egreso.id_master;
  id_tipotransaccion =
    (
      appStore.itemsProveedorList.find(
        (v: ProveedorItem) => v.id == egreso.id_proveedor,
      ) || {}
    ).id_tipotransaccion || "";

  if (!confirmar) {
    mostrarModalSolicitudPago(egreso);
    return;
  }
  Swal.fire({
    html: "<b>¿Desea realizar una solicitud de pago? Recuerde que luego de generarse la solicitud no se podrá editar.</b>",
    // showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Si",
    denyButtonText: `No`,
    cancelButtonText: "Cancelar",
    icon: "warning",
    // imageUrl: "https://point.qreport.site/files/alto_icono.png",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await mostrarModalSolicitudPago(egreso);
    } else if (result.isDenied) {
      dialogSolicitudDivision.value = !dialogSolicitudDivision.value;
    }
  });
}
async function mostrarModalSolicitudPago(egresoSeleccionado: EgresoProveedor) {
  egreso.value = egresoSeleccionado;

  e1.value = 1;
  checkPago.value = false;
  checkMaster.value = false;
  codigo_pago.value = "";
  codigo_master.value = "";
  selectedAccount.value = [];
  comentarios.value = "";

  dialogSolicitud.value = !dialogSolicitud.value;

  await _getAccountsNumber();
}
async function _setInvoice() {
  Swal.fire({
    icon: "info",
    title: "Guardando...",
    text: "Por favor, espere",
  });

  const data = {
    id_house: controlGastosStore.master_houses.filter(
      (v) => v.id_house,
    )[0]!.id_house,
    id_proveedor: egreso.value.id_proveedor,
    id_path: filesStore.payPath,
    type_pago: radio.value,
    number: nro_invoice.value,
    date: date.value,
    monto: monto_factura.value,
    id_correlativo: egreso.value.id_correlativo,
    id_master: egreso.value.id_master,
    status: 1,
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setInvoice",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  const response = await request(config);
  if (warnIfRefused(response)) return;
  itemsInvoice = response.data;
  await controlGastosStore.getListControlGastosMaster(route.params.id as string);
  Swal.fire({
    icon: "success",
    title: "Documento cargado",
    text: response.mensaje,
  });
  dialogInvoice.value = false;
  await _getInvoice(egreso.value);
}
async function _delInvoice(id: number) {
  const proveedor = egreso.value as EgresoProveedor | undefined;
  // Caso 2: con solicitud de pago no se elimina; primero se elimina la solicitud
  const solicitud = proveedor ? solicitudPagoDe(proveedor) : undefined;
  if (solicitud) {
    Swal.fire({
      icon: "warning",
      title: "No se puede eliminar",
      html: `Tiene la solicitud de pago N° <b>${solicitud.id}</b>. Elimine primero la solicitud de pago.`,
    });
    return;
  }
  // Caso 1: con PDF de pago, al confirmar se eliminan la factura y el PDF
  const tienePdf = Number(proveedor?.solicitudes) > 0;
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar el documento?",
    html: tienePdf
      ? "Tiene un PDF de pago generado. Si lo eliminas, <b>también se eliminará el PDF de pago</b> y tendrás que volver a generarlo."
      : "Esta acción no se puede deshacer.",
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
  });
  if (!isConfirmed) return;
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "delInvoice/" + id,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await request(config);
  if (warnIfRefused(response)) return;
  itemsInvoice = response.data;
  dialogInvoice.value = false;
  await Promise.all([
    _getInvoice(egreso.value),
    controlGastosStore.getListControlGastosMaster(route.params.id as string),
  ]);
  Swal.fire({ icon: "success", text: response.mensaje });
}
async function InsertarActualizarPorcentajeProveedor() {
  if (
    (await frmPorcentajeProveedor.value!.validate()).valid &&
    validatePorcentaje()
  ) {
    loadingPorcentaje.value = true;
    const cuotas = [];
    for (let i = 0; i < appStore.nro_cuotas; i++) {
      cuotas.push({
        porcentaje: appStore.cuota[i],
        fecha: appStore.fechacuota[i],
      });
    }

    const data = {
      id_master: dataProveedor!.id_master,
      id_proveedor: dataProveedor!.id_proveedor,
      id_correlativo: dataProveedor!.id_correlativo,
      nro_cuotas: appStore.nro_cuotas,
      cuotas: cuotas,
    };
    await controlGastosStore.guardarCuotasCgeTipoProveedor(data);
    await controlGastosStore.getListControlGastosMaster(route.params.id as string);
    frmPorcentajeProveedor.value!.reset();
    loadingPorcentaje.value = false;
    dialogPorcentajeProveedor.value = false;
  }
}
async function _getAccountsNumber() {
  const data = {
    id_branch: sessionBranchId(),
  };

  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN + "getAccountsNumber/" + proveedorId,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then(function (response) {
      appStore.itemsDataAccountsNumberList =
        response.data.data || [];
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _editEgreso(egreso: EgresoDetalle) {
  egresos.value = {
    ...egreso,
    statusCalcula: !!egreso.igv_op || !!egreso.igv_pr ? true : false,
    opcion: egreso.igv_op || egreso.igv_pr ? true : false,
    montoopview: egreso.monto_op,
    igvopview: egreso.igv_op,
    totalopview: egreso.total_op,
    numero: "",
    fecha: moment(new Date()).format("YYYY-MM-DD"),
  } as EgresoForm;
  id_correlativo.value = egreso.id_correlativo;
  tipocambio.value = egreso.tipocambio;
  id_coins.value = egreso.id_coins;
  if (id_coins.value) {
    obtenerMoneda();
  }
  emit("statusBtn", 2);
  dialog.value = true;
}
async function _delEngreso(item: EgresoDetalle, egreso: EgresoProveedor) {
  const hasPayment = egreso.total_total_op > egreso.monto_pagar_op;
  if (!hasPayment && can("listControlGastos", "ELIMINAR")) return continuarEliminar(item);
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
  const admin = await askAdminCredentials("Para eliminar este gasto, escribe el usuario y la clave de un administrador.");
  if (!admin) return;
  continuarEliminar(item, admin);
}
function continuarEliminar(item: EgresoDetalle & { nombre_proveedor?: string }, admin?: AdminCredentials) {
  Swal.fire({
    icon: "question",
    title: "Advertencia",
    html: `Está seguro de eliminar el concepto <b>${item.concepto}</b> del proveedor
              <b>${item.nombre_proveedor}</b>`,
    showConfirmButton: true,
    showDenyButton: true,
    confirmButtonText: "Continuar",
    denyButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      appStore.spiner = true;
      const config = {
        method: "put",
        url: import.meta.env.VITE_URL_MAIN + "delEgregso/" + item.id,
        data: withAuthorization(admin),
        headers: {
          "Content-Type": "application/json",
        },
      };
      axios(config)
        .then(async function (response) {
          const res = response.data;
          if (res.estadoflag == true) {
            Swal.fire({
              icon: "success",
              text: res.mensaje,
            });
            appStore.spiner = false;
            await controlGastosStore.getListControlGastosMaster(route.params.id as string);
          } else {
            Swal.fire({
              icon: "warning",
              text: res.mensaje,
            });
            appStore.spiner = false;
          }
        })
        .catch(function () {
          appStore.spiner = false;
          Swal.fire({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
        });
    }
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- botón oculto: lo reemplaza la Solicitud de Pago
async function openPayments(egreso: EgresoProveedor) {
  paymentsProvider = egreso;
  dialogPayment.value = true;
  dataList.value = false;
  await _getSPaymentPro(egreso);
  dataList.value = true;
}
async function _getSPaymentPro(egreso: EgresoProveedor | number | undefined) {
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getSPaymentPro",
    params: {
      ...(egreso as EgresoProveedor),
      id_branch: sessionBranchId(),
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      console.log(response);
      itemsSPayment.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function listControlGasto() {
  appStore.spiner = true;
  await controlGastosStore.getListControlGastosMaster(route.params.id as string);
  appStore.spiner = false;
}
function activarSeccion3() {
  // console.log(this.egresos)
  if (egresos.value.concepto) {
    showSeccion3NuevoEgreso.value = true;
  }
}
async function _editEgresos() {
  calcularE();
  const data = {
    ...egresos.value,

    id_coins: id_coins.value,
    id_master: controlGastosStore.listControlGastos[0]!.master_id,
    id_correlativo: id_correlativo.value,
    tipocambio: tipocambio.value,
    status: true,
  };

  const master = masterEgresos.value.find(
    (v) =>
      v.id_proveedor == egresos.value.id_proveedor &&
      v.id_correlativo == id_correlativo.value,
  );

  if (!!master) {
    const exiteOtraMoneda = master.detalle.some(
      (v) => v.id_coins != egresos.value.id_coins,
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

  if (warnIfRefused(await request({ method: "post", url: import.meta.env.VITE_URL_MAIN + "editEgreso/" + egresos.value.id, data }))) return;
  await controlGastosStore.getListControlGastosMaster(route.params.id as string);
  dialog.value = false;
  emit("recalcularProfit");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function imprimirControl() {
  const master = controlGastosStore.listControlGastos[0];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = {
    bultos: master!.master_volumen,
    peso: master!.master_peso,
    puerto_origen: master!.master_port_begin,
    puerto_destino: master!.master_port_end,
    tipo_embarque: master!.master_shipment,
    volumen: master!.master_volumen,
    gananciapr: parseFloat(String(ingreso_pr - componentProps.egreso_pr)).toFixed(2),
    gananciaop: parseFloat(String(ingreso_op - componentProps.egreso_op)).toFixed(2),
    exp: codigo_master.value,
    sentido: master!.master_modality,
    itemsTotalesProveedores: masterEgresos.value.map((element) => {
      return {
        nameproveedor: element.nombre_proveedor,
        restante: parseFloat(String(element.monto_pagar_op)).toFixed(2),
        total_op: parseFloat(String(element.total_total_op)).toFixed(2),
        total_p: parseFloat(String(element.total_total_op)).toFixed(2),
        total_pr: parseFloat(String(element.total_total_pr)).toFixed(2),
      };
    }),
    itemTotalHouse: undeclaredAppState.controlgastos.master_houses.map(
      (element: ControlGastoHouse) => {
        return {
          consigner: element.consigner,
          code_house: element.code_house,
          total_igv_op_ingresos: parseFloat(
            String(element.total_igv_op_ingresos),
          ).toFixed(2),
          total_igv_pr_ingresos: parseFloat(
            String(element.total_igv_pr_ingresos),
          ).toFixed(2),
          total_monto_op_ingresos: parseFloat(
            String(element.total_monto_op_ingresos),
          ).toFixed(2),
          total_monto_pr_ingresos: parseFloat(
            String(element.total_monto_pr_ingresos),
          ).toFixed(2),
          total_total_op_ingresos: parseFloat(
            String(element.total_total_op_ingresos),
          ).toFixed(2),
          total_total_pr_ingresos: parseFloat(
            String(element.total_total_pr_ingresos),
          ).toFixed(2),
        };
      },
    ),
  };
}
function sendAdmin(id: number) {
  Swal.fire({
    title: "¿Desea realizar esta solicitud a Administración?",
    showDenyButton: true,

    confirmButtonText: "Si",
    denyButtonText: `No`,

    icon: "info",
  }).then((result) => {
    /* Read more about isConfirmed, isDenied below */
    if (result.isConfirmed) {
      const data = {
        fecha_sol: new Date(
          Date.now() - new Date().getTimezoneOffset() * 60000,
        )
          .toISOString()
          .substr(0, 10),
        status: 2,
      };
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "putSPaymentPro/" + id,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      request(config).then(async function (response) {
        if (warnIfRefused(response)) return;
        Swal.fire({
          icon: "success",
          title: "Solicitud enviada",
          text: response.mensaje,
        });
        await controlGastosStore.getListControlGastosMaster(route.params.id as string);
        _getSPaymentPro(paymentsProvider);
        dataList.value = true;
      });
    }
  });

  _getAccountsNumber();

  nameproveedorLocal = nameproveedor.value;
}
// avisar=false: lo usa "Eliminar y generar nueva" (sin aviso de éxito; devuelve si se eliminó)
async function eliminar(id: number, avisar = true): Promise<boolean> {
  const data = {
    id: id,
  };
  let eliminado = false;

  appStore.spiner = true;

  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "eliminar_spaymentpro",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      const res = response.data;
      eliminado = !!res.estadoflag;
      if (eliminado && !avisar) return;

      Swal.fire({
        icon: res.estadoflag ? "success" : "warning",
        text: res.mensaje,
      }).then(async (result) => {
        if (result.isConfirmed) {
          dialogPayment.value = false;
          appStore.spiner = true;
          await controlGastosStore.getListControlGastosMaster(route.params.id as string);
          appStore.spiner = false;
        }
      });
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
    });

  appStore.spiner = false;
  return eliminado;
}
async function _generateSolicitud() {
  loading.value = true;
  _calcularTotales();
  Swal.fire({
    icon: "info",
    title: "Generando PDF...",
    text: "Por favor espere",
  });

  let pago;
  if ((total as number) > 0) {
    pago = total;
  } else {
    pago = TotalLocal;
  }

  let concepto: EgresoDetalle[] = [];

  if (selected.value.length > 0) {
    concepto = selected.value;
  } else {
    concepto = conceptos.value;
  }
  const proveedor = masterEgresos.value.map((element) => {
    return {
      nameProveedor: element.nombre_proveedor,
      total_pr: parseFloat(String(element.total_total_pr)).toFixed(2),
      total_op: parseFloat(String(element.total_total_op)).toFixed(2),
      // para el PDF: status del proveedor y fila del proveedor que se paga
      pagado: element.detalle.length > 0 && element.detalle.every((d) => !!d.pagado),
      actual:
        Number(element.id_proveedor) === Number(proveedorId) &&
        String(element.id_correlativo ?? "") === String(id_correlativo.value ?? ""),
    };
  });

  const datas = {
    id_proveedor: proveedorId,
    conceptos: concepto,
    monto: pago,
    id_correlativo: id_correlativo.value,
    id_master: id_master,
    status: 1,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setSPaymentPro",
    headers: {
      "Content-Type": "application/json",
    },
    data: datas,
  };
  const clientes = controlGastosStore.master_houses
    .map((element) => {
      return element.consigner;
    })
    .join(", ");

  await axios(config)
    .then(async function (response) {
      if (warnIfRefused(response.data)) return;
      const data = {
        nameProveedor: nameproveedor.value,
        nameConsignatario: clientes,
        totalPagar: TotalLocal,
        expediente:
          controlGastosStore.listControlGastos[0]!
            .master_nromaster,
        fecha: currentDate(),
        totalProveedores: proveedor,
        comentarios: comentarios.value,
        // el PDF se pinta según el tipo: por código de pago o por cuenta de banco
        tipo_pago: checkPago.value ? "CODIGO" : "BANCO",
        ya_pago: concepto.length > 0 && concepto.every((d) => !!d.pagado),
        codigo_pago: codigo_pago.value,
        codigo_master:
          controlGastosStore.listControlGastos[0]!
            .master_nromaster,
        cuentas: selectedAccount.value,
        operador: appStore.dataHouse_operador,
        conceptos: conceptos.value,
        selected: selected.value,
        totalSelected: total,
        number: response.data.data[0].number,
        url_logo: sessionUser().path,
        id_master,
      };
      await downloadPdf(
        { method: "post", url: import.meta.env.VITE_URL_MAIN + "pdfSolicitud", data },
        `SOLICITUD_EXPEDIENTE_${data.expediente}_${data.number}.pdf`,
      );
      await controlGastosStore.getListControlGastosMaster(route.params.id as string);
      dialogSolicitudDivision.value = false;
      dialogSolicitud.value = false;
      await abrirSolicitudTrasPdf();
    })
    .catch(function (error) {
      console.error(error);
    });
  loading.value = false;
}
// Paso 3: al generar el PDF se abre directamente "Solicitar a Administración"
async function abrirSolicitudTrasPdf() {
  if (!can("listControlGastos", "NUEVO")) return;
  await nextTick();
  await cargarSolicitudesExistentes();
  const item = (masterEgresos.value || []).find(
    (e) =>
      Number(e.id_master) === Number(id_master) &&
      Number(e.id_proveedor) === Number(proveedorId) &&
      String(e.id_correlativo ?? "") === String(id_correlativo.value ?? ""),
  );
  if (!item) return;
  const existente = solicitudPagoDe(item);
  if (existente && existente.codigo_estado !== "RECHAZADA") return;
  await abrirSolicitudPagoNueva(item);
}
function _calcularTotales() {
  total = 0;
  let calculo = 0;
  if (selected.value.length > 0) {
    let calculo = 0;
    selected.value.map((item) => {
      calculo = calculo + parseFloat(String(item.total_op));
      total = calculo.toFixed(2);
    });
  } else {
    conceptos.value.map((item) => {
      calculo = calculo + parseFloat(String(item.total_op));

      total = calculo.toFixed(2);
    });
  }
}
function currentDate() {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const current = new Date();
  const date = `${current.getDate()} de ${
    monthNames[current.getMonth()]
  } del ${current.getFullYear()}`;
  return date;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function uploadFile() {
  msgfile = "";
  errfile = "";
  if (payfile.value) {
    loadingFile = true;
    await filesStore._uploadFile(payfile.value);
    loadingFile = false;
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filesStore.payPath
      ? (msgfile = "Archivo cargado")
      : (errfile = "Comuniquese con el admistrador");
  } else {
    errfile = "Dato Requerido";
  }
}
async function openInvoice(egresoSeleccionado: EgresoProveedor) {
  msgFile.value = null;
  loading.value = true;
  itemsListInvoice.value = [];
  proveedorId = egresoSeleccionado.id_proveedor;
  egreso.value = egresoSeleccionado;
  nameproveedor.value = egresoSeleccionado.nombre_proveedor;
  await _getInvoice(egresoSeleccionado);
  loading.value = false;
}
async function _getInvoice(egreso: EgresoProveedor) {
  console.log("-----");

  isDataTableLoading.value = true;

  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `list_invoice_path?id_master=${egreso.id_master}&id_proveedor=${egreso.id_proveedor}&id_correlativo=${egreso.id_correlativo}`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      dialogListInvoice.value = true;
      if (!!response.data.data[0].estadoflag) {
        itemsListInvoice.value = response.data.data;
      } else {
        itemsListInvoice.value = [];
      }

      isDataTableLoading.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function openDoc(path: string) {
  window.open(path, "_blank");
}
function validarStep2Solicitud() {
  if (!checkPago.value && !selectedAccount.value.length) {
    Swal.fire({
      icon: "error",
      text: "Para avanzar al paso 3, debe seleccionar al menos una cuenta bancaria",
    });
  } else {
    e1.value = 3;
  }
}
function isProveedorInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v) => v.codigo == "02" && v.id == id_tipotransaccion,
  );
  return val;
}
async function registrarCuentaBancaria() {
  if ((await frmCuentaBancaria.value!.validate()).valid) {
    Swal.fire({
      icon: "question",
      html: "<b>Si guarda este banco, se agregará a la lista de bancos de la ficha del proveedor. ¿Desea continuar?</b>",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si",
      cancelButtonText: "No",
    }).then(async (result) => {
      if (result.isConfirmed) {
        loadingBotonGuardarCuentaBancaria.value = true;

        const config = {
          method: "post",
          url: import.meta.env.VITE_URL_MAIN + "setAccount",
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            ...cuentaBancaria.value,
            id_entities: proveedorId,
            id_branch: sessionBranchId(),
          },
        };

        await axios(config).then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            Swal.fire({
              icon: "success",
              text: response.data.mensaje,
            });

            await _getAccountsNumber();
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

        loadingBotonGuardarCuentaBancaria.value = false;
        dialogCuentaBancaria.value = !dialogCuentaBancaria.value;

        frmCuentaBancaria.value!.reset();
      }
    });
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDeudaActual(data: Partial<EgresoProveedor> = {}) {
  const { detalle: costos = [], total_total_op = 0 } = data;

  const abono = costos.reduce((suma, v) => {
    return v.pagado ? suma + (parseFloat(String(v.total_op)) || 0) : suma;
  }, 0);

  const deuda = parseFloat(String(total_total_op)) - parseFloat(abono.toFixed(2));

  return deuda != 0 ? deuda.toFixed(2) : 0;
}
function cargarFactura() {
  payfile.value = "" as unknown as File;
  msgFile.value = "";
  errFile.value = "";

  const abono = itemsListInvoice.value.reduce((suma, v) => {
    return suma + (parseFloat(String(v.monto)) || 0);
  }, 0);

  if (abono == parseFloat(String(egreso.value.total_total_op))) {
    Swal.fire({
      icon: "error",
      html: `<b>No se puede cargar más facturas porque el monto de Total Operaciones es igual al total de facturas cargadas.</b>`,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "ACEPTAR",
    });

    dialogInvoice.value = false;
  } else {
    radio.value = "";
    date.value = moment().format("YYYY-MM-DD");
    nro_invoice.value = "";
    monto_factura.value = "";
    payfile.value = null;
    boolFile.value = false;

    dialogInvoice.value = true;
    // el foco arranca en "Tipo de documento" y desde ahí se avanza con Tab
    nextTick(() => invTipoRef.value?.focus());
  }
}
function validarMontoFactura() {
  const abono = itemsListInvoice.value.reduce((suma, v) => {
    return suma + (parseFloat(String(v.monto ? v.monto : 0)) || 0);
  }, 0);

  const total =
    (parseFloat(String(monto_factura.value ? monto_factura.value : 0)) || 0) +
    (parseFloat(String(abono)) || 0);
  if (total > parseFloat(String(egreso.value.total_total_op))) {
    Swal.fire({
      icon: "error",
      html: `<b>La suma del monto de las facturas cargadas debe ser menor o igual al monto del Total Operaciones para el proveedor. Verifique el monto de la factura.</b>`,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "ACEPTAR",
    }).then((result) => {
      if (result.isConfirmed) {
        monto_factura.value = "";
      }
    });
  }
}

function bloquearCopiarMontos(detalle: EgresoDetalle[]) {
  return detalle.some((v) => v.pagado == 1 || v.statusadmin == 1);
  // return true;
}
// abriModalCopiar(egreso, bloquearCopiarMontos) {
//   this.egreso = {};
//   if (bloquearCopiarMontos) {
//     return;
//   }

//   this.egreso = egreso;
//   this.dialogCopiar = true;
// },
function abriModalCopiar(egresoSeleccionado: EgresoProveedor, bloquearCopiarMontos: boolean) {
  if (egresoSeleccionado.detalle && egresoSeleccionado.detalle.some((v) => (v.total_op as number) > 0)) {
    // Nota: en JavaScript el método correcto es .filter() en lugar de .filtro()
    const montosConMontosMayoresACero = egresoSeleccionado.detalle.filter(
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

        egreso.value = egresoSeleccionado;
        dialogCopiar.value = true;
      }
    });
  } else {
    egreso.value = {} as EgresoProveedor;
    if (bloquearCopiarMontos) {
      return;
    }

    egreso.value = egresoSeleccionado;
    dialogCopiar.value = true;
  }
}
async function copiarMontos() {
  if ((await frmCopiar.value!.validate()).valid) {
    await controlGastosStore.copiarCGEgresos({
      ...egreso.value,
      tipocambio: egreso.value.tipocambio || 1,
    });
    await controlGastosStore.getListControlGastosMaster(route.params.id as string);
    dialogCopiar.value = false;
  }
}

watch(egresos, (newValue) => {
  if (newValue.id_proveedor && showSeccion2NuevoEgreso.value === false) {
    showSeccion2NuevoEgreso.value = true;
  }

  if (
    newValue.concepto &&
    id_correlativo.value &&
    (!newValue.statusCalcula || newValue.statusCalcula) &&
    showSeccion3NuevoEgreso.value === false
  ) {
    showSeccion3NuevoEgreso.value = true;
  }

  if (newValue.montoopcuentabanco || newValue.monto_pr) {
    isBotonGuardarEgresoDisabled.value = false;
  } else {
    isBotonGuardarEgresoDisabled.value = true;
  }
}, { deep: true });
watch(id_correlativo, (newValue) => {
  if (
    newValue &&
    egresos.value.concepto &&
    egresos.value.statusCalcula &&
    showSeccion3NuevoEgreso.value === false
  ) {
    showSeccion3NuevoEgreso.value = true;
  }
}, { immediate: true });
watch(id_coins, (newValue) => {
  if (
    newValue &&
    tipocambio.value &&
    showSeccion4NuevoEgreso.value === false
  ) {
    showSeccion4NuevoEgreso.value = true;
  }
}, { immediate: true });
watch(tipocambio, (newValue) => {
  if (
    newValue &&
    id_coins.value &&
    showSeccion4NuevoEgreso.value === false
  ) {
    showSeccion4NuevoEgreso.value = true;
  }
}, { immediate: true });
watch(checkMaster, () => {
  codigo_master.value = "";
  if (!!checkMaster.value) {
    codigo_master.value =
      controlGastosStore.listControlGastos[0]!.master_codemaster;
  }
});

// ------------------------- SOLICITUD DE PAGO (table_solitudpago) -------------------------
const dialogSolicitudPagoNueva = ref(false);
const solicitudPagoProveedor = ref<EgresoProveedor | null>(null);
const tiposPagoSolicitud = ref<TipoPagoSolicitud[]>([]);
const solicitudPagoForm = ref({
  id_tipopago: null as number | null,
  id_cuenta: null as number | null,
  codigopago: "",
  comentario: "",
});
const guardandoSolicitudPago = ref(false);
// Una sola solicitud por master / proveedor / correlativo
const solicitudesExistentes = ref<Map<string, SolicitudPagoControl>>(new Map());
// nuevo: primera vez | editar: rechazada | ver: enviada, solo lectura
const modoSolicitudPago = ref<"nuevo" | "editar" | "ver">("nuevo");
const solicitudPagoActual = ref<SolicitudPagoControl | null>(null);
const claveSolicitud = (id_master: unknown, id_proveedor: unknown, id_correlativo: unknown) =>
  `${Number(id_master)}-${Number(id_proveedor)}-${Number(id_correlativo || 0)}`;
const solicitudPagoDe = (e: EgresoProveedor) =>
  solicitudesExistentes.value.get(claveSolicitud(e.id_master, e.id_proveedor, e.id_correlativo));

async function cargarSolicitudesExistentes() {
  const masters = [...new Set((masterEgresos.value || []).map((e) => Number(e.id_master)).filter(Boolean))];
  const respuestas = await Promise.all(
    masters.map((id_master) =>
      request<SolicitudPagoControl>({
        method: "get",
        url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_listar",
        params: { id_master },
      })),
  );
  solicitudesExistentes.value = new Map(
    respuestas.flatMap((r) =>
      r.estadoflag ? r.data.map((x) => [claveSolicitud(x.id_master, x.id_proveedor, x.id_correlativo), x] as const) : []),
  );
}

const proveedorSolicitud = computed(() =>
  partesProveedor(solicitudPagoProveedor.value?.nombre_proveedor ?? "", solicitudPagoProveedor.value?.id_proveedor));
const tipoPagoSeleccionado = computed(
  () => tiposPagoSolicitud.value.find((t) => t.id === solicitudPagoForm.value.id_tipopago)?.codigo,
);
const conceptosSolicitudPago = computed(() =>
  (solicitudPagoProveedor.value?.detalle || []).filter((d) => !d.pagado),
);
// La cuenta de salida (empresa) se elige al cargar el soporte de pago, no al solicitar
const soloLecturaSolicitudPago = computed(() => modoSolicitudPago.value === "ver");
// En "ver" se muestran los conceptos guardados en la solicitud
const conceptosModalSolicitudPago = computed(() =>
  modoSolicitudPago.value === "ver" && solicitudPagoActual.value
    ? solicitudPagoActual.value.conceptos.map((c) => ({
      id: c.id_egreso,
      concepto: c.concepto,
      acronym: solicitudPagoActual.value?.moneda ?? "",
      total_op: c.total_op,
    }))
    : conceptosSolicitudPago.value.map((c) => ({ id: c.id, concepto: c.concepto, acronym: c.acronym, total_op: c.total_op })),
);
const totalModalSolicitudPago = computed(() =>
  modoSolicitudPago.value === "ver" && solicitudPagoActual.value
    ? Number(solicitudPagoActual.value.monto || 0)
    : totalSolicitudPago.value,
);
// la moneda siempre va a la derecha del monto: "329.63 USD"
const monedaModalSolicitudPago = computed(
  () => conceptosModalSolicitudPago.value.find((c) => c.acronym)?.acronym || solicitudPagoActual.value?.moneda || "",
);
const totalSolicitudPago = computed(() =>
  conceptosSolicitudPago.value.reduce((suma, d) => suma + Number(d.total_op || 0), 0),
);
const cuentasSolicitudPago = computed(() =>
  (appStore.itemsDataAccountsNumberList as CuentaBancariaProveedor[]).map((c) => ({
    title: `${c.namebanks ?? ""} · ${c.namecoins ?? ""} · ${c.accountnumber ?? ""}${c.beneficiario ? " · " + c.beneficiario : ""}`,
    value: c.id,
  })),
);
const solicitudPagoValida = computed(() => {
  const f = solicitudPagoForm.value;
  if (!f.id_tipopago) return false;
  // Transferencia: cuenta del proveedor | Código de pago: solo el código
  return tipoPagoSeleccionado.value === "02" ? !!f.codigopago.trim() : !!f.id_cuenta;
});

async function cargarTiposPagoSolicitud() {
  if (tiposPagoSolicitud.value.length) return;
  const response = await request<TipoPagoSolicitud>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "cargar_master_detalle_tipo_pago_solicitud",
  });
  tiposPagoSolicitud.value = response.estadoflag ? response.data : [];
}

// Con aprobación de Administración o Gerencia, editar o eliminar pide la clave de un administrador
const tieneAprobaciones = (s: SolicitudPagoControl) => !!(s.aprobadoadministracionflag || s.aprobadogerenciaflag);
// Con salida registrada en Bancos ya no se edita ni elimina
const tieneSalidaBancos = (s: SolicitudPagoControl) => !!s.id_pagoegreso;
const adminEdicionSolicitud = ref<AdminCredentials | null>(null);
// Pagada en Bancos (salida registrada): no se edita ni elimina hasta eliminar ese movimiento
function avisarSalidaBancos(item: EgresoProveedor) {
  const s = solicitudPagoDe(item);
  if (!s || !tieneSalidaBancos(s)) return false;
  Swal.fire({
    icon: "warning",
    title: "Ya está pagada en Bancos",
    html: `La solicitud de pago N° <b>${s.id}</b> ya tiene la salida${s.numerooperacion_pago ? ` N° <b>${s.numerooperacion_pago}</b>` : ""} en Bancos.<br><br>
      Elimine primero ese movimiento en <b>Bancos &gt; Salidas</b>.`,
  });
  return true;
}

async function abrirSolicitudPagoNueva(item: EgresoProveedor, editar = false) {
  if (editar && avisarSalidaBancos(item)) return;
  const existente = solicitudPagoDe(item) ?? null;
  const modo = !existente ? "nuevo" : (editar || existente.codigo_estado === "RECHAZADA") && !tieneSalidaBancos(existente) ? "editar" : "ver";
  adminEdicionSolicitud.value = null;
  if (modo === "editar" && existente && tieneAprobaciones(existente)) {
    const admin = await askAdminCredentials(
      "La solicitud ya tiene aprobación de Administración o Gerencia. Para editarla, escribe el usuario y la clave de un administrador.",
    );
    if (!admin) return;
    adminEdicionSolicitud.value = admin;
  }
  solicitudPagoActual.value = existente;
  modoSolicitudPago.value = modo;
  solicitudPagoProveedor.value = item;
  proveedorId = item.id_proveedor;
  id_tipotransaccion =
    (appStore.itemsProveedorList.find((v: ProveedorItem) => v.id == item.id_proveedor) || {})
      .id_tipotransaccion || "";
  solicitudPagoForm.value = { id_tipopago: null, id_cuenta: null, codigopago: "", comentario: "" };
  appStore.itemsDataAccountsNumberList = [];
  dialogSolicitudPagoNueva.value = true;
  await Promise.all([cargarTiposPagoSolicitud(), _getAccountsNumber()]);
  if (existente) {
    solicitudPagoForm.value = {
      // los ids bigint llegan como texto: se toma el id tal cual viene en el listado de tipos
      id_tipopago: tiposPagoSolicitud.value.find((t) => Number(t.id) === Number(existente.id_tipopago))?.id ?? null,
      id_cuenta: existente.id_cuenta ?? null,
      codigopago: existente.codigopago ?? "",
      comentario: existente.comentario ?? "",
    };
    return;
  }
  solicitudPagoForm.value.id_tipopago = tiposPagoSolicitud.value[0]?.id ?? null;
}

async function registrarSolicitudPago() {
  const item = solicitudPagoProveedor.value;
  if (!item || !solicitudPagoValida.value || modoSolicitudPago.value === "ver") return;
  const editando = modoSolicitudPago.value === "editar" && !!solicitudPagoActual.value;
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    html: editando
      ? `¿Guardar los cambios y volver a enviar la solicitud de pago de <b>${item.nombre_proveedor}</b>?` +
        (tieneAprobaciones(solicitudPagoActual.value!) ? "<br><br>Las aprobaciones y el soporte de pago se reiniciarán." : "")
      : `¿Enviar la solicitud de pago de <b>${item.nombre_proveedor}</b>?`,
    showCancelButton: true,
    confirmButtonText: "Sí, enviar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1e5bd8",
  });
  if (!isConfirmed) return;

  guardandoSolicitudPago.value = true;
  const f = solicitudPagoForm.value;
  const datos = {
    id_tipopago: f.id_tipopago,
    id_cuenta: tipoPagoSeleccionado.value === "02" ? null : f.id_cuenta,
    codigopago: tipoPagoSeleccionado.value === "01" ? null : f.codigopago,
    comentario: f.comentario,
  };
  const response = editando
    ? await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_editar/" + solicitudPagoActual.value!.id,
      data: { ...datos, ...withAuthorization(adminEdicionSolicitud.value) },
    })
    : await request({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_insertar",
      data: { ...datos, id_master: item.id_master, id_proveedor: item.id_proveedor, id_correlativo: item.id_correlativo },
    });
  guardandoSolicitudPago.value = false;
  if (warnIfRefused(response)) return;
  dialogSolicitudPagoNueva.value = false;
  Swal.fire({ icon: "success", text: response.mensaje });
  await cargarSolicitudesExistentes();
  emit("solicitudPagoRegistrada");
}

// "12/11/2026 – 10:24 a. m." (el listado devuelve YYYY-MM-DD HH24:MI)
function formatoFechaSolicitud(valor: string | null) {
  if (!valor) return "";
  const [fecha = "", hora = ""] = valor.split(" ");
  const [anio, mes, dia] = fecha.split("-");
  if (!hora) return `${dia}/${mes}/${anio}`;
  const [hh = 0, mm = "00"] = hora.split(":").map((v, i) => (i === 0 ? Number(v) : v)) as [number, string];
  const h12 = hh % 12 || 12;
  return `${dia}/${mes}/${anio} – ${String(h12).padStart(2, "0")}:${mm} ${hh < 12 ? "a. m." : "p. m."}`;
}

const eliminandoSolicitudPago = ref<number | null>(null);
async function eliminarSolicitudPago(item: EgresoProveedor) {
  const solicitud = solicitudPagoDe(item);
  if (!solicitud || avisarSalidaBancos(item)) return;
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    html: `¿Eliminar la solicitud de pago N° <b>${solicitud.id}</b> de <b>${item.nombre_proveedor}</b>?`,
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
  });
  if (!isConfirmed) return;
  // con aprobación de Administración o Gerencia se pide la clave de un administrador
  let admin: AdminCredentials | undefined;
  if (tieneAprobaciones(solicitud)) {
    admin = await askAdminCredentials(
      "La solicitud ya tiene aprobación de Administración o Gerencia. Para eliminarla, escribe el usuario y la clave de un administrador.",
    );
    if (!admin) return;
  }
  eliminandoSolicitudPago.value = solicitud.id;
  const response = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_eliminar/" + solicitud.id,
    data: withAuthorization(admin),
  });
  eliminandoSolicitudPago.value = null;
  if (warnIfRefused(response)) return;
  Swal.fire({ icon: "success", text: response.mensaje });
  await cargarSolicitudesExistentes();
  emit("solicitudPagoRegistrada");
}

defineExpose({ cargarSolicitudesExistentes });

watch(
  () => (masterEgresos.value || []).map((e) => e.id_master).join(","),
  () => cargarSolicitudesExistentes(),
  { immediate: true },
);


onMounted(async () => {
  await Promise.all([
    bankStore.getBanksListCargar(),
    coinsStore.getCoinsListCargar(),
    masterusuariosStore.cargarMasterDetalleTipoTransaccion(),
    appStore._getProveedor(),
    appStore._getMasterList(),
  ]);

  headers.value[2]!.title =
    enterprisesStore.impuesto.nombre_impuesto!;
  mostrarImpuesto.value =
    enterprisesStore.impuesto.mostrarimpuesto;
});
</script>

<template>
  <div class="">
    <h3>
      Costos -------------------------------- | Pricing:
      {{ parseFloat(String(egreso_pr)).toFixed(2) }} USD /------ Operaciones:
      {{ parseFloat(String(egreso_op)).toFixed(2) }} USD
      <v-spacer />
      <v-btn
        @click="nuevoEngreso()"
        color="blue"
        size="small"
      >
        Nuevo Control Gastos Egresos
      </v-btn>
    </h3>
    <v-expansion-panels variant="accordion">
      <v-expansion-panel
        v-for="(egresoProveedor, index) in masterEgresos || []"
        :key="index"
        :value="egresoProveedor.isExpanded"
      >
        <v-expansion-panel-title @click.stop="abrirExpandEgreso(index)">
          <template #actions>
            <v-icon @click="abrirExpandEgreso(index)">
              mdi-unfold-more-horizontal
            </v-icon>
          </template>
          <v-table
            density="compact"
            class="egreso-summary-table"
          >
            <thead>
              <tr>
                <th width="14%">
                  Proveedor
                </th>
                <th
                  width="9%"
                  style="background: #d6f4ff"
                >
                  Total Pricing
                </th>
                <th
                  width="9%"
                  style="background: #ffd6d6"
                >
                  Total Operaciones
                </th>
                <th
                  width="9%"
                  style="background: #fff9c4"
                >
                  Deuda Actual
                </th>
                <th
                  v-if="editable"
                  width="16%"
                />
                <th
                  v-if="editable"
                  width="9%"
                  class="text-left"
                >
                  Facturas o Proformance
                </th>
                <th
                  v-if="editable"
                  width="9%"
                  class="text-left"
                >
                  Generar PDF de pago
                </th>
                <th
                  width="20%"
                  class="text-left"
                >
                  Solicitar a Administración
                </th>
                <!-- <th width="10%">Acciones</th> -->
                <!-- <th width="10%">Acciones</th> -->
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {{ egresoProveedor.nombre_proveedor }}
                  <v-btn
                    variant="text"
                    icon
                    color="success"
                    v-if="egresoProveedor.code_tipo_proveedor === '01' && can('listControlGastos', 'MODIFICAR')"
                    @click="abrirModalPorcentajeProveedor(egresoProveedor)"
                  >
                    <v-icon>mdi-percent-box-outline</v-icon>
                  </v-btn>
                </td>
                <td>{{ egresoProveedor.total_total_pr }}</td>
                <td>{{ egresoProveedor.total_total_op }}</td>
                <td>{{ egresoProveedor.monto_pagar_op }}</td>
                <td v-if="editable">
                  <v-btn
                    v-if="can('listControlGastos', 'NUEVO')"
                    color="info"
                    class="my-1 mx-1"
                    size="x-small"
                    @click="nuevoEngreso(egresoProveedor)"
                  >
                    Nuevo Concepto
                  </v-btn>
                  <template v-if="can('listControlGastos', 'COPIAR')">
                    <v-tooltip
                      location="bottom"
                      color="error"
                      v-if="bloquearCopiarMontos(egresoProveedor.detalle)"
                    >
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          color="info"
                          size="x-small"
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
                          egresoProveedor,
                          bloquearCopiarMontos(egresoProveedor.detalle),
                        )
                      "
                    >
                      Copiar Montos Pr->Op
                    </v-btn>
                  </template>
                  <v-btn
                    color="indigo"
                    size="x-small"
                    class="my-1 mx-1"
                    v-if="mostrarBotonCambiarExpAsociado(egresoProveedor) && can('listControlGastos', 'MODIFICAR')"
                    @click.stop="abrirModalCambiarExpediente(egresoProveedor)"
                  >
                    Cambiar expediente
                  </v-btn>
                </td>
                <td v-if="editable">
                  <!-- Paso 1: abre el listado de facturas (con "Cargar Nueva"); con facturas cargadas se muestra el ojo -->
                  <v-btn
                    variant="text"
                    icon
                    size="small"
                    :loading="loading"
                    color="blue"
                    :title="egresoProveedor.docs > 0 ? 'Ver facturas o proformas' : 'Facturas o proformas'"
                    :aria-label="egresoProveedor.docs > 0 ? 'Ver facturas o proformas' : 'Facturas o proformas'"
                    @click.stop="openInvoice(egresoProveedor)"
                  >
                    <v-icon>{{ egresoProveedor.docs > 0 ? "mdi-eye" : "mdi-file-compare" }}</v-icon>
                  </v-btn>
                </td>
                <td v-if="editable">
                  <!-- Paso 2: el PDF de pago solo se genera cuando ya hay factura y no hay solicitud de pago -->
                  <span
                    v-if="can('listControlGastos', 'NUEVO')"
                    class="d-inline-block"
                    :title="!(egresoProveedor.docs > 0)
                      ? 'Primero carga la factura o proforma'
                      : solicitudPagoDe(egresoProveedor)
                        ? 'Tiene solicitud de pago: elimínela primero para generar un nuevo PDF'
                        : 'Generar PDF de pago'"
                    @click.stop
                  >
                    <v-btn
                      variant="text"
                      size="small"
                      icon
                      :color="egresoProveedor.docs > 0 && !solicitudPagoDe(egresoProveedor) ? 'blue' : 'grey'"
                      :disabled="!(egresoProveedor.docs > 0)"
                      aria-label="Generar PDF de pago"
                      @click.stop="validarSolicitudPago(egresoProveedor)"
                    >
                      <v-icon>mdi-send</v-icon>
                    </v-btn>
                  </span>
                </td>

                <td
                  class="solreq-cell"
                  @click.stop
                >
                  <!-- Solicitud de pago del correlativo: solicitar / ver / editar si la rechazaron / eliminar -->
                  <div
                    v-if="solicitudPagoDe(egresoProveedor)"
                    class="solreq"
                    :class="solicitudPagoDe(egresoProveedor)!.codigo_estado === 'RECHAZADA' ? 'solreq--rechazada' : 'solreq--enviada'"
                  >
                    <button
                      type="button"
                      class="solreq__info"
                      :title="solicitudPagoDe(egresoProveedor)!.codigo_estado === 'RECHAZADA' ? 'Editar solicitud de pago' : 'Ver solicitud de pago'"
                      @click="abrirSolicitudPagoNueva(egresoProveedor)"
                    >
                      <span class="solreq__badge">
                        <v-icon size="18">
                          {{ solicitudPagoDe(egresoProveedor)!.codigo_estado === "RECHAZADA" ? "mdi-email-remove-outline" : "mdi-email-check-outline" }}
                        </v-icon>
                      </span>
                      <span class="solreq__text">
                        <span class="solreq__title">
                          {{ solicitudPagoDe(egresoProveedor)!.codigo_estado === "RECHAZADA" ? "Solicitud Rechazada" : "Solicitado a Administración" }}
                        </span>
                        <span class="solreq__date">
                          {{
                            formatoFechaSolicitud(
                              solicitudPagoDe(egresoProveedor)!.codigo_estado === "RECHAZADA"
                                ? solicitudPagoDe(egresoProveedor)!.fecha_rechazo ?? null
                                : solicitudPagoDe(egresoProveedor)!.fechasolicitud,
                            )
                          }}
                        </span>
                      </span>
                    </button>
                    <!-- editar y eliminar en todo estado; con aprobaciones piden clave de administrador;
                         con salida en Bancos avisan que primero se elimine ese movimiento -->
                    <div class="solreq__acciones">
                      <v-btn
                        v-if="can('listControlGastos', 'NUEVO')"
                        icon="mdi-pencil-outline"
                        size="x-small"
                        variant="text"
                        class="solreq__del"
                        :color="tieneSalidaBancos(solicitudPagoDe(egresoProveedor)!) ? 'grey' : 'primary'"
                        :title="tieneSalidaBancos(solicitudPagoDe(egresoProveedor)!)
                          ? 'Ya está pagada en Bancos: elimine primero el movimiento'
                          : tieneAprobaciones(solicitudPagoDe(egresoProveedor)!) ? 'Editar solicitud de pago (requiere clave de administrador)' : 'Editar solicitud de pago'"
                        aria-label="Editar solicitud de pago"
                        @click="abrirSolicitudPagoNueva(egresoProveedor, true)"
                      />
                      <v-btn
                        v-if="can('listControlGastos', 'ELIMINAR')"
                        icon="mdi-delete-outline"
                        size="x-small"
                        variant="text"
                        class="solreq__del"
                        :color="tieneSalidaBancos(solicitudPagoDe(egresoProveedor)!) ? 'grey' : 'error'"
                        :title="tieneSalidaBancos(solicitudPagoDe(egresoProveedor)!)
                          ? 'Ya está pagada en Bancos: elimine primero el movimiento'
                          : tieneAprobaciones(solicitudPagoDe(egresoProveedor)!) ? 'Eliminar solicitud de pago (requiere clave de administrador)' : 'Eliminar solicitud de pago'"
                        aria-label="Eliminar solicitud de pago"
                        :loading="eliminandoSolicitudPago === solicitudPagoDe(egresoProveedor)!.id"
                        @click="eliminarSolicitudPago(egresoProveedor)"
                      />
                    </div>
                  </div>
                  <!-- Paso 3: solo se solicita con factura (paso 1) y PDF de pago generado (paso 2) -->
                  <span
                    v-else-if="can('listControlGastos', 'NUEVO')"
                    class="d-inline-block"
                    :title="!(egresoProveedor.docs > 0) ? 'Primero carga la factura o proforma' : egresoProveedor.solicitudes > 0 ? 'Solicitar a Administración' : 'Primero genera el PDF de pago'"
                  >
                    <v-btn
                      size="small"
                      variant="flat"
                      color="primary"
                      prepend-icon="mdi-send-outline"
                      class="solreq__btn"
                      :disabled="!(egresoProveedor.docs > 0 && egresoProveedor.solicitudes > 0)"
                      @click="abrirSolicitudPagoNueva(egresoProveedor)"
                    >
                      Solicitar
                    </v-btn>
                  </span>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >—</span>
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
                  Proveedor
                </th>
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
                  v-if="mostrarColumnaMonedaDiferenteDolar(egresoProveedor)"
                >
                  Monto Op Cuenta Banco
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="
                    mostrarImpuesto &&
                      mostrarColumnaMonedaDiferenteDolar(egresoProveedor)
                  "
                >
                  {{ enterprisesStore.impuesto.nombre_impuesto }} Op
                  Cuenta Banco
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="mostrarColumnaMonedaDiferenteDolar(egresoProveedor)"
                >
                  Total Op Cuenta Banco
                </th>
                <th
                  style="background: #d8ffde"
                  class="text-left"
                  v-if="mostrarColumnaMonedaDiferenteDolar(egresoProveedor)"
                >
                  Tipo Cambio Cuenta Banco
                </th>
                <th class="text-center">
                  Enviado a Admin.
                </th>
                <th
                  width="10%"
                  class="text-center"
                >
                  Fecha Pago.
                </th>
                <th class="text-center">
                  Status
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
              <template
                v-for="(grupo, idx) in groupDetallePorCliente(egresoProveedor.detalle)"
                :key="`header-${
                  grupo.id_house || grupo.code_house || grupo.consigner || idx
                }`"
              >
                <tr
                  class="bg-blue-lighten-5"
                  style="cursor: pointer"
                  @click="toggleCliente(egresoProveedor, grupo)"
                >
                  <td
                    :colspan="mostrarImpuesto ? 16 : 13"
                    class="font-weight-bold"
                  >
                    Cliente:
                    {{ grupo.consigner }}
                    <span v-if="grupo.code_house">
                      - {{ grupo.code_house }}
                    </span>
                  </td>
                </tr>
                <template v-if="isClienteAbierto(egresoProveedor, grupo)">
                  <tr
                    v-for="item in grupo.items"
                    :key="`item-${
                      grupo.id_house ||
                      grupo.code_house ||
                      grupo.consigner ||
                      item.id
                    }`"
                  >
                    <td>{{ item.nombre_proveedor }}</td>
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
                    <!-- <td style="background: #ffd6d6">
                      {{ parseFloat(item.igv_op).toFixed(2) }}
                    </td> -->
                    <td style="background: #ffd6d6">
                      {{ parseFloat(String(item.total_op)).toFixed(2) }}
                    </td>
                    <td
                      style="background: #d8ffde"
                      v-if="mostrarColumnaMonedaDiferenteDolar(egresoProveedor)"
                    >
                      {{ parseFloat(String(item.montoopcuentabanco)).toFixed(2) }}
                      {{ item.acronym }}
                    </td>
                    <td
                      style="background: #d8ffde"
                      v-if="
                        mostrarImpuesto &&
                          mostrarColumnaMonedaDiferenteDolar(egresoProveedor)
                      "
                    >
                      {{ parseFloat(String(item.igvopcuentabanco)).toFixed(2) }}
                      {{ item.acronym }}
                    </td>
                    <td
                      style="background: #d8ffde"
                      v-if="mostrarColumnaMonedaDiferenteDolar(egresoProveedor)"
                    >
                      {{ parseFloat(String(item.totalopcuentabanco)).toFixed(2) }}
                      {{ item.acronym }}
                    </td>
                    <td
                      style="background: #d8ffde"
                      v-if="mostrarColumnaMonedaDiferenteDolar(egresoProveedor)"
                    >
                      {{ item.tipocambio == 1 ? "No Aplica" : item.tipocambio }}
                    </td>
                    <td class="text-center">
                      <v-chip
                        v-if="item.statusadmin == 1 && item.pagado == 1"
                        size="small"
                        class="mx-auto"
                        color="green"
                        variant="outlined"
                      >
                        SI
                      </v-chip>
                      <v-chip
                        v-if="item.statusadmin == 1 && item.pagado == 0"
                        size="small"
                        class="mx-auto"
                        color="orange"
                        variant="outlined"
                      >
                        SI
                      </v-chip>
                    </td>
                    <td class="text-center">
                      {{ item.fecha_pago_letra }}
                    </td>
                    <td>
                      <v-chip
                        v-if="item.pagado == 1"
                        size="small"
                        class="ma-2 text-white"
                        color="green"
                        variant="flat"
                      >
                        Pagado
                      </v-chip>
                    </td>
                    <td v-if="editable">
                      <v-btn
                        v-if="can('listControlGastos', 'MODIFICAR')"
                        variant="text"
                        icon
                        color="orange"
                        size="small"
                        @click="_editEgreso(item)"
                      >
                        <v-icon>
                          mdi-pencil
                        </v-icon>
                      </v-btn>
                      <v-btn
                        variant="text"
                        icon
                        color="red"
                        size="small"
                        v-if="!item.statusadmin && item.pagado == 0"
                        @click="_delEngreso(item, egresoProveedor)"
                      >
                        <v-icon>
                          mdi-delete
                        </v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- --------------------- -->
    <v-dialog
      id="mydiv"
      v-model="dialog"
      width="70%"
      persistent
    >
      <v-card>
        <v-card-title
          id="mydivheader"
          class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap"
        >
          {{ getNameModalNuevoEditar }}

          <v-spacer />
          <v-btn
            color="default"
            variant="text"
            @click="dialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-5">
          <v-container style="min-height: 435px">
            <v-form ref="frmEgreso">
              <v-row>
                <v-col cols="4">
                  <v-autocomplete
                    label="Costo Aspociado al Master o un House"
                    :items="listHouses"
                    item-title="consigner"
                    item-value="id_orders"
                    v-model="egresos.id_orders"
                  />
                </v-col>
                <v-col cols="4">
                  <v-autocomplete
                    :items="appStore.itemsProveedorList"
                    item-title="namelong"
                    item-value="id"
                    v-model="egresos.id_proveedor"
                    label="Proveedor"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    :disabled="!!egresos.pagado"
                  />
                </v-col>
              </v-row>

              <v-row v-show="showSeccion2NuevoEgreso">
                <v-col
                  cols="12"
                  xl="6"
                  lg="6"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.concepto"
                    label="Concepto"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    :disabled="!!egresos.pagado"
                  />
                </v-col>
                <v-col
                  cols="12"
                  xl="3"
                  lg="3"
                >
                  <v-autocomplete
                    :items="controlGastosStore.listCorrelativo"
                    v-model="id_correlativo"
                    @update:model-value="activarSeccion3"
                    item-title="code"
                    item-value="id"
                    label="Correlativo"
                    density="compact"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :disabled="!!egresos.pagado"
                  />
                </v-col>
                <v-col
                  cols="12"
                  xl="3"
                  lg="3"
                >
                  <v-switch
                    v-if="mostrarImpuesto"
                    density="compact"
                    :disabled="!!egresos.pagado"
                    v-model="egresos.statusCalcula"
                    @update:model-value="calcularE()"
                    :label="`Calcula ${enterprisesStore.impuesto.nombre_impuesto}`"
                  />
                  <p v-else>
                    NO HA CONFIGURADO EL IMPUESTOS A LA VENTAS. Ir al Módulo de
                    Configuración
                  </p>
                </v-col>
              </v-row>

              <v-row v-show="showSeccion3NuevoEgreso">
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    v-model="id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda de Banco Salida"
                    @update:model-value="obtenerMoneda()"
                    density="compact"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :disabled="!!egresos.pagado"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                  v-if="opFlag"
                >
                  <v-text-field
                    density="compact"
                    v-if="sufmoneda != 'USD'"
                    v-model="tipocambio"
                    type="number"
                    label="Tipo de Cambio"
                    @update:model-value="calcularE()"
                    step="0.01"
                    :disabled="!!egresos.pagado"
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) => v > 1 || 'El tipo de cambio debe ser mayor a 1',
                    ]"
                  />
                </v-col>
              </v-row>

              <v-row v-show="showSeccion4NuevoEgreso">
                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.montoopcuentabanco"
                    @update:model-value="calcularE()"
                    type="number"
                    label="Monto"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    :prefix="sufmoneda"
                    :disabled="!id_coins || !!egresos.pagado"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag && mostrarImpuesto"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.igvopcuentabanco"
                    type="number"
                    :label="`${enterprisesStore.impuesto.nombre_impuesto}`"
                    :prefix="sufmoneda"
                    :disabled="!id_coins || !!egresos.pagado"
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
                    v-model="egresos.totalopcuentabanco"
                    type="number"
                    label="Total Operaciones"
                    :prefix="sufmoneda"
                    :disabled="!id_coins || !!egresos.pagado"
                    readonly
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="prFlag"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.monto_pr"
                    @update:model-value="calcularE()"
                    type="number"
                    label="Monto"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    :disabled="!!egresos.pagado"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="prFlag && mostrarImpuesto"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.igv_pr"
                    type="number"
                    :label="`${enterprisesStore.impuesto.nombre_impuesto}`"
                    readonly
                    :disabled="!!egresos.pagado"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="prFlag"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.total_pr"
                    type="number"
                    label="Total"
                    readonly
                    :disabled="!!egresos.pagado"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.montoopview"
                    type="number"
                    label="Monto Operaciones (Solo lectura) "
                    suffix="USD"
                    readonly
                    :disabled="!!egresos.pagado"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag && mostrarImpuesto"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.igvopview"
                    type="number"
                    :label="`${enterprisesStore.impuesto.nombre_impuesto} Operaciones (Solo lectura)`"
                    suffix="USD"
                    readonly
                    :disabled="!!egresos.pagado"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="4"
                  v-if="opFlag"
                >
                  <v-text-field
                    density="compact"
                    v-model="egresos.totalopview"
                    type="number"
                    label="Total Operaciones (Solo lectura) "
                    suffix="USD"
                    readonly
                    :disabled="!!egresos.pagado"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions class="pb-4">
          <v-btn
            v-if="statusBtn == 1"
            @click="_setData()"
            block
            color="success"
            elevation="0"
            :disabled="isBotonGuardarEgresoDisabled"
          >
            Agregar servicio
          </v-btn>

          <v-btn
            v-if="statusBtn == 2"
            @click="_editEgresos()"
            block
            color="success"
            elevation="0"
            :disabled="isBotonGuardarEgresoDisabled"
          >
            Guardar servicio
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- ---------------------------------------------------- -->
    <v-dialog
      max-width="80%"
      v-model="dialogListInvoice"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Facturas y Performance de {{ nameproveedor }}
          <v-spacer />
          <v-btn
            v-if="can('listControlGastos', 'NUEVO')"
            variant="outlined"
            @click="cargarFactura"
            color="primary"
          >
            Cargar Nueva
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersInvoice"
            :items="itemsListInvoice"
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
                item.type_pago == 1
                  ? "FACTURA"
                  : String("") || item.type_pago == 2
                    ? "PERFORMANCE"
                    : "OTRO"
              }}
              -
              {{ item.number }}
            </template>
            <template #[`item.path`]="{ item }">
              <v-btn
                variant="text"
                icon
                size="small"
                @click="openDoc(item.path)"
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
                @click="_delInvoice(item.id)"
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
    <!-- --------------------------- -->
    <v-dialog
      max-width="620"
      v-model="dialogInvoice"
      scrollable
    >
      <v-card class="inv-card">
        <div class="inv-header">
          <div class="inv-header-icon">
            <v-icon size="32">
              mdi-file-upload-outline
            </v-icon>
          </div>
          <div class="inv-header-text">
            <h3 class="inv-title">
              CARGAR DOCUMENTO A PAGAR
            </h3>
            <span class="inv-subtitle">ADJUNTA LA FACTURA, PROFORMA U OTRO DOCUMENTO.</span>
          </div>
          <!-- fuera del orden de tabulación: el primer Tab va al Tipo de documento -->
          <v-btn
            icon
            variant="text"
            size="small"
            class="inv-close"
            tabindex="-1"
            aria-label="Cerrar"
            @click="dialogInvoice = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="inv-body">
          <div class="inv-prov">
            <div class="inv-prov-row">
              <v-icon class="inv-prov-icon">
                mdi-storefront-outline
              </v-icon>
              <span class="inv-prov-label">ID PROVEEDOR:</span>
              <span class="inv-prov-value">{{ proveedorInvoice.id }}{{ proveedorInvoice.correlativo ? ` - ${proveedorInvoice.correlativo}` : "" }}</span>
            </div>
            <div class="inv-prov-row">
              <v-icon class="inv-prov-icon">
                mdi-account-outline
              </v-icon>
              <span class="inv-prov-label">NOMBRE:</span>
              <span class="inv-prov-value">{{ proveedorInvoice.nombre }}</span>
            </div>
          </div>

          <label
            class="inv-label"
            for="inv-tipo"
          >TIPO DE DOCUMENTO <span class="inv-req">*</span></label>
          <v-select
            id="inv-tipo"
            ref="invTipoRef"
            v-model="radio"
            :items="invoiceOptions"
            item-title="label"
            item-value="value"
            placeholder="SELECCIONAR TIPO DE DOCUMENTO"
            prepend-inner-icon="mdi-file-document-outline"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="inv-input"
            :rules="[(v) => !!v || 'Selecciona el tipo de documento']"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item
                v-bind="itemProps"
                :prepend-icon="item.icon"
              />
            </template>
          </v-select>

          <label
            class="inv-label"
            for="inv-fecha"
          >FECHA DE DOCUMENTO <span class="inv-req">*</span></label>
          <FormatFecha
            id="inv-fecha"
            v-model="date"
            label=""
            placeholder="SELECCIONAR FECHA"
            prepend-inner-icon="mdi-calendar-blank-outline"
            outlined
            density="compact"
            hide-details="auto"
            field-class="inv-input"
            :rules="[(v) => !!v || 'Dato Requerido']"
          />

          <label
            class="inv-label"
            for="inv-numero"
          >N° DE {{ radio == 2 ? "PROFORMA" : radio == 3 ? "DOCUMENTO" : "FACTURA" }} / REFERENCIA</label>
          <v-text-field
            id="inv-numero"
            v-model="nro_invoice"
            placeholder="EJ. F001-12345"
            prepend-inner-icon="mdi-pound-box-outline"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="inv-input"
          />

          <div class="inv-row">
            <div>
              <label
                class="inv-label"
                for="inv-moneda"
              >MONEDA <span class="inv-req">*</span></label>
              <!-- el documento se registra en la moneda de los conceptos del proveedor -->
              <v-text-field
                id="inv-moneda"
                :model-value="monedaInvoice"
                prepend-inner-icon="mdi-cash-multiple"
                variant="outlined"
                density="compact"
                hide-details
                readonly
                tabindex="-1"
                class="inv-input inv-input--readonly"
              />
            </div>
            <div>
              <label
                class="inv-label"
                for="inv-monto"
              >MONTO <span class="inv-req">*</span></label>
              <v-text-field
                id="inv-monto"
                v-model="monto_factura"
                placeholder="INGRESE EL MONTO"
                prepend-inner-icon="mdi-cash"
                inputmode="decimal"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="inv-input"
                :rules="[(v) => v > 0 || 'Debe ser un monto numérico']"
                @change="validarMontoFactura"
              />
            </div>
          </div>

          <div class="inv-dropzone">
            <ArrastraYSolarComponent @id-archivo-cargado="recibirId" />
          </div>
        </v-card-text>

        <v-card-actions class="inv-actions">
          <v-btn
            variant="outlined"
            class="inv-btn-cancel"
            @click="dialogInvoice = false"
          >
            CANCELAR
          </v-btn>
          <v-btn
            variant="flat"
            color="#0b5fd6"
            class="inv-btn-save"
            prepend-icon="mdi-tray-arrow-up"
            :disabled="!radio || !date || !filesStore.payPath || !monto_factura"
            @click="_setInvoice()"
          >
            GUARDAR DOCUMENTO
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <!-- SOLICITUD DE PAGO (table_solitudpago) -->
    <v-dialog
      v-model="dialogSolicitudPagoNueva"
      max-width="680"
      persistent
      scrollable
    >
      <v-card
        v-if="solicitudPagoProveedor"
        class="solnueva inv-card"
      >
        <div class="inv-header">
          <div class="inv-header-icon">
            <v-icon size="32">
              mdi-cash-fast
            </v-icon>
          </div>
          <div class="inv-header-text">
            <h3 class="inv-title">
              {{ modoSolicitudPago === "editar" ? "EDITAR SOLICITUD DE PAGO" : "ENVIAR A ADMINISTRACIÓN" }}<template v-if="solicitudPagoActual">
                N° {{ solicitudPagoActual.id }}
              </template>
            </h3>
            <span class="inv-subtitle">
              {{ modoSolicitudPago === "ver" ? "DETALLE DE LA SOLICITUD ENVIADA A ADMINISTRACIÓN." : "SOLICITA A ADMINISTRACIÓN EL PAGO AL PROVEEDOR." }}
            </span>
          </div>
          <span
            v-if="solicitudPagoActual"
            class="solnueva__estado"
            :class="`solnueva__estado--${solicitudPagoActual.codigo_estado}`"
          >{{ solicitudPagoActual.estado }}</span>
          <v-btn
            icon
            variant="text"
            size="small"
            class="inv-close"
            aria-label="Cerrar"
            :disabled="guardandoSolicitudPago"
            @click="dialogSolicitudPagoNueva = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="inv-body">
          <div class="inv-prov">
            <div class="inv-prov-row">
              <v-icon class="inv-prov-icon">
                mdi-storefront-outline
              </v-icon>
              <span class="inv-prov-label">ID PROVEEDOR:</span>
              <span class="inv-prov-value">{{ proveedorSolicitud.id }}{{ proveedorSolicitud.correlativo ? ` - ${proveedorSolicitud.correlativo}` : "" }}</span>
            </div>
            <div class="inv-prov-row">
              <v-icon class="inv-prov-icon">
                mdi-account-outline
              </v-icon>
              <span class="inv-prov-label">NOMBRE:</span>
              <span class="inv-prov-value">{{ proveedorSolicitud.nombre }}</span>
            </div>
          </div>
          <v-alert
            v-if="modoSolicitudPago === 'editar' && solicitudPagoActual"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Rechazada por {{ solicitudPagoActual.area_rechazo === "ADM" ? "Administración" : "Gerencia" }}
            ({{ solicitudPagoActual.usuario_rechazo }} · {{ solicitudPagoActual.fecha_rechazo }}).
            <div v-if="solicitudPagoActual.motivo_rechazo">
              <b>Motivo:</b> {{ solicitudPagoActual.motivo_rechazo }}
            </div>
            Corrige los datos y vuelve a enviarla.
          </v-alert>
          <div class="solnueva__conceptos">
            <div
              v-for="c in conceptosModalSolicitudPago"
              :key="c.id"
              class="solnueva__concepto"
            >
              <span>{{ c.concepto }}</span>
              <span>{{ Number(c.total_op || 0).toFixed(2) }} {{ c.acronym }}</span>
            </div>
            <div
              v-if="!conceptosModalSolicitudPago.length"
              class="text-medium-emphasis"
            >
              No hay conceptos pendientes de pago.
            </div>
            <div class="solnueva__total">
              <span>Total a pagar</span>
              <span>{{ totalModalSolicitudPago.toFixed(2) }} {{ monedaModalSolicitudPago }}</span>
            </div>
          </div>

          <h4 class="mt-4 mb-2">
            Tipo de pago
          </h4>
          <div class="solnueva__tipos">
            <button
              v-for="t in tiposPagoSolicitud"
              :key="t.id"
              type="button"
              class="solnueva__tipo"
              :class="{ 'solnueva__tipo--active': solicitudPagoForm.id_tipopago === t.id }"
              :disabled="soloLecturaSolicitudPago"
              @click="solicitudPagoForm.id_tipopago = t.id"
            >
              <v-icon :color="solicitudPagoForm.id_tipopago === t.id ? 'primary' : 'grey'">
                {{ solicitudPagoForm.id_tipopago === t.id ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
              </v-icon>
              <v-icon color="primary">
                {{ t.codigo === "01" ? "mdi-bank-transfer" : "mdi-barcode" }}
              </v-icon>
              {{ t.descripcion }}
            </button>
          </div>

          <!-- con Código de pago no se pide la cuenta del proveedor -->
          <div
            v-if="tipoPagoSeleccionado !== '02'"
            class="mt-4"
          >
            <div class="d-flex align-center mb-1">
              <b>Cuenta bancaria del proveedor</b>
              <v-spacer />
              <!-- <v-btn
                v-if="can('listControlGastos', 'NUEVO') && !soloLecturaSolicitudPago"
                size="small"
                variant="text"
                color="primary"
                prepend-icon="mdi-plus"
                @click="abrirModalCuentaBancaria()"
              >
                Nueva cuenta
              </v-btn> -->
            </div>
            <v-select
              v-model="solicitudPagoForm.id_cuenta"
              :items="cuentasSolicitudPago"
              placeholder="Selecciona la cuenta"
              variant="outlined"
              density="comfortable"
              :no-data-text="'El proveedor no tiene cuentas registradas'"
              :readonly="soloLecturaSolicitudPago"
              hide-details="auto"
            />
          </div>
          <v-text-field
            v-if="tipoPagoSeleccionado === '02'"
            v-model="solicitudPagoForm.codigopago"
            :readonly="soloLecturaSolicitudPago"
            class="mt-4"
            :label="`Código de pago ${nombreCodigoPago}`"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />

          <v-textarea
            v-model="solicitudPagoForm.comentario"
            :readonly="soloLecturaSolicitudPago"
            class="mt-4"
            label="Observaciones (opcional)"
            rows="2"
            auto-grow
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn
            variant="outlined"
            rounded="lg"
            :disabled="guardandoSolicitudPago"
            @click="dialogSolicitudPagoNueva = false"
          >
            {{ soloLecturaSolicitudPago ? "Cerrar" : "Cancelar" }}
          </v-btn>
          <v-btn
            v-if="!soloLecturaSolicitudPago && can('listControlGastos', 'NUEVO')"
            color="primary"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-send"
            :loading="guardandoSolicitudPago"
            :disabled="!solicitudPagoValida || !conceptosSolicitudPago.length"
            @click="registrarSolicitudPago"
          >
            {{ modoSolicitudPago === "editar" ? "Reenviar solicitud" : "Enviar solicitud" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      width="80%"
      v-model="dialogSolicitud"
    >
      <v-card class="px-5 py-5">
        <h2>{{ egreso.nombre_proveedor }}</h2>
        <v-stepper v-model="e1">
          <v-stepper-header>
            <v-stepper-item
              :complete="e1 > 1"
              :value="1"
              title="Códigos"
            />

            <v-divider />

            <v-stepper-item
              :complete="e1 > 2"
              :value="2"
              title="Cuentas Bancarias"
            />
            <v-divider />

            <v-stepper-item
              :complete="e1 > 3"
              :value="3"
              title="Observaciones"
            />
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item :value="1">
              <v-card
                class="mb-12"
                elevation="0"
                height="200px"
              >
                <v-card-text>
                  <v-row density="compact">
                    <v-col
                      md="6"
                      cols="12"
                    >
                      <v-checkbox
                        v-model="checkPago"
                        :label="`Aplica código de pago ${nombreCodigoPago}`"
                      />
                      <v-text-field
                        density="compact"
                        v-if="checkPago"
                        v-model="codigo_pago"
                        label="CODIGO DE PAGO"
                      >
                        CODIGO DE PAGO
                      </v-text-field>
                    </v-col>
                    <v-col
                      md="6"
                      cols="12"
                    >
                      <v-checkbox
                        v-model="checkMaster"
                        label="Aplica Número de Expediente"
                      />
                      <v-text-field
                        density="compact"
                        v-if="checkMaster"
                        v-model="codigo_master"
                        label="CODIGO DE MASTER BL"
                        readonly
                      >
                        CODIGO DE MASTER BL
                      </v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <v-btn
                color="primary"
                @click="e1 = 2"
              >
                Continuar
              </v-btn>
              <v-btn
                variant="text"
                @click="dialogSolicitud = false"
              >
                Cerrar
              </v-btn>
            </v-stepper-window-item>

            <v-stepper-window-item :value="2">
              <v-card
                class="mb-12"
                elevation="0"
                min-height="200px"
              >
                <v-card-text>
                  <div class="text-right">
                    <v-btn
                      v-if="can('listControlGastos', 'NUEVO')"
                      size="small"
                      color="primary"
                      @click="abrirModalCuentaBancaria()"
                    >
                      Nueva Cuenta Bancaria
                    </v-btn>
                  </div>
                  <b>Cuentas</b>
                  <v-data-table
                    v-if="!checkPago"
                    v-model="selectedAccount"
                    :headers="headersAccount"
                    :items="appStore.itemsDataAccountsNumberList"
                    hide-default-footer
                    item-value="id"
                    return-object
                    show-select
                    class="elevation-0"
                    density="compact"
                  />
                  <h2
                    v-else
                    class="mt-5"
                  >
                    Ya seleccionó el codigo de pago
                  </h2>
                </v-card-text>
              </v-card>

              <v-btn
                color="primary"
                @click="validarStep2Solicitud"
              >
                Continuar
              </v-btn>
              <v-btn
                variant="text"
                @click="e1 = 1"
              >
                Volver
              </v-btn>
              <v-btn
                variant="text"
                @click="dialogSolicitud = false"
              >
                Cerrar
              </v-btn>
            </v-stepper-window-item>

            <v-stepper-window-item :value="3">
              <v-card
                class="mb-12"
                elevation="0"
                height="200px"
              >
                <v-card-text>
                  <v-textarea
                    v-model="comentarios"
                    rows="3"
                    label="Observación Adicionales"
                  />
                  <v-btn
                    block
                    @click="_generateSolicitud()"
                    class="mt-2"
                    color="primary"
                  >
                    ENVIAR A ADMINISTRACIÓN UNA SOLICITUD DE PAGO
                  </v-btn>
                </v-card-text>
              </v-card>

              <v-btn
                variant="text"
                @click="e1 = 2"
              >
                Volver
              </v-btn>
              <v-btn
                variant="text"
                @click="dialogSolicitud = false"
              >
                Cerrar
              </v-btn>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card>
    </v-dialog>
    <!-- ------------------------------------------------- -->
    <v-dialog
      width="80%"
      v-model="dialogSolicitudDivision"
    >
      <v-card>
        <v-card-title> Solicitar pago por concepto</v-card-title>

        <v-card-text>
          <v-row density="compact">
            <v-col
              md="6"
              cols="12"
            >
              <v-text-field
                density="compact"
                v-model="codigo_pago"
                label="CODIGO DE PAGO"
              >
                CODIGO DE PAGO
              </v-text-field>
            </v-col>
            <v-col
              md="6"
              cols="12"
            >
              <v-text-field
                density="compact"
                v-model="codigo_master"
                label="CODIGO DE MASTER BL"
                readonly
              >
                CODIGO DE MASTER BL
              </v-text-field>
            </v-col>
          </v-row>

          <v-textarea
            v-model="comentarios"
            rows="3"
            label="Observación Adicionales"
          />

          <h2>Seleccione los conceptos</h2>

          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="conceptos"
            hide-default-footer
            item-value="concepto"
            return-object
            :items-per-page-options="[10, 20, 30, 40, 50]"
            :items-per-page="30"
            density="compact"
            show-select
            class="elevation-0"
          >
            <template #[`item.data-table-select`]="{ item, props }">
              <!-- @vue-expect-error the checkbox condition compares a boolean with 1 -->
              <v-checkbox-btn
                v-bind="props"
                :readonly="item.pagado == 1"
                v-if="!item.pagado == 1"
              />
            </template>
            <template #[`item.pagado`]="{ item }">
              <v-chip
                v-if="item.pagado == 1"
                class="ma-2 text-white"
                color="green"
                size="small"
                variant="flat"
              >
                {{ item.pagado == 1 ? "Pagado" : "" }}
              </v-chip>

              <v-icon
                class="btn__add mr-2"
                size="large"
                color="grey"
                v-if="item.pagado == 1"
                @click="openPaymentFile(item.path)"
              >
                mdi-eye
              </v-icon>
            </template>
            <template #[`item.monto`]="{ item }">
              {{ parseFloat(String(item.monto_op)).toFixed(2) }}
            </template>
          </v-data-table>

          <b>Cuentas</b>
          <v-data-table
            v-model="selectedAccount"
            :headers="headersAccount"
            :items="appStore.itemsDataAccountsNumberList"
            hide-default-footer
            item-value="id"
            return-object
            show-select
            density="compact"
            class="elevation-0"
          />

          <v-btn
            block
            @click="_generateSolicitud()"
            class="mt-2"
            color="primary"
            :loading="loading"
          >
            GENERAR SOLICITUD
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      width="80%"
      v-model="dialogPayment"
    >
      <v-card class="mx-auto">
        <v-toolbar
          color="cyan"
          class="text-white"
        >
          <v-toolbar-title>SOLICITUDES GENERADAS</v-toolbar-title>

          <v-spacer />
        </v-toolbar>
        <v-card-title>
          <v-text-field
            density="compact"
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Buscar solicitud"
            single-line
            hide-details
          />
        </v-card-title>
        <v-container
          v-if="!dataList"
          style="height: 400px"
        >
          <v-row class="fill-height align-content-center justify-center">
            <v-col
              class="text-body-large text-center"
              cols="12"
            >
              Cargando informacíon
            </v-col>
            <v-col
              cols="12"
              xl="6"
              lg="6"
            >
              <v-progress-linear
                color="deep-purple-accent-4"
                indeterminate
                rounded
                height="6"
              />
            </v-col>
          </v-row>
        </v-container>
        <v-data-table
          v-if="dataList"
          :headers="headersPdf"
          :items="itemsSPayment"
          :search="search"
        >
          <template #[`item.status`]="{ item }">
            <v-chip
              v-if="item.status == 2"
              class="ma-2 text-white"
              color="orange"
              variant="flat"
            >
              {{ item.status == 2 ? "Pendiente" : "" }}
            </v-chip>
            <v-chip
              v-if="item.status == 3"
              class="ma-2 text-white"
              color="green"
              variant="flat"
            >
              {{ item.status == 3 ? "Pagado" : "" }}
            </v-chip>
          </template>
          <template #[`item.accion`]="{ item }">
            <v-icon
              class="mr-2"
              @click="viewPdf(item.path)"
            >
              mdi-eye
            </v-icon>
          </template>
          <template #[`item.accions`]="{ item }">
            <v-icon
              v-if="item.status == 1 && can('listControlGastos', 'MODIFICAR')"
              class="mr-2"
              color="green"
              @click="sendAdmin(item.id)"
            >
              mdi-send
            </v-icon>
            <v-icon
              v-if="item.status != 3 && can('listControlGastos', 'ELIMINAR')"
              class="mr-2"
              color="red"
              @click="eliminar(item.id)"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      v-model="dialogPorcentajeProveedor"
      persistent
      max-width="50%"
      transition=""
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Registrar División de Pagos <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="cerrarModal()"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmPorcentajeProveedor">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  class="col-3"
                  label="Nro Cuotas"
                  v-model="appStore.nro_cuotas"
                  min="1"
                  type="number"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="6"
                v-for="n in Number(appStore.nro_cuotas)"
                :key="n"
              >
                <v-row>
                  <v-col cols="4">
                    <v-text-field
                      density="compact"
                      :label="`Porcentaje Cuota-${n}`"
                      v-model="appStore.cuota[n - 1]"
                      type="number"
                      suffix="%"
                      min="0"
                      max="100"
                      :rules="[
                        (v) => !!v || 'Dato Requerido',
                        (v) => v > 0 || 'El porcentaje tiene que ser positivo',
                        (v) =>
                          v <= 100 ||
                          'El por centaje no puede ser mayor que 100%',
                      ]"
                    />
                  </v-col>
                  <v-col cols="8">
                    <v-text-field
                      density="compact"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                      :label="`Fecha de pago ${n}`"
                      v-model="appStore.fechacuota[n - 1]"
                      type="date"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            :loading="loadingPorcentaje"
            @click="InsertarActualizarPorcentajeProveedor"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--CUENTA BANCARIA-->
    <v-dialog
      v-model="dialogCuentaBancaria"
      width="30%"
      persistent
    >
      <v-card class="pa-5">
        <h2>{{ egreso.nombre_proveedor }}</h2>
        <v-card-title>AGREGAR NUEVA CUENTA BANCARIA</v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="frmCuentaBancaria">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    density="compact"
                    placeholder="Beneficiario"
                    label="Beneficiario"
                    v-model="cuentaBancaria.beneficiario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    density="compact"
                    placeholder="Nro Cuenta"
                    label="Nro Cuenta"
                    v-model="cuentaBancaria.nro_cuenta"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    density="compact"
                    placeholder="CCI"
                    label="CCI"
                    v-model="cuentaBancaria.cci"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    density="compact"
                    :items="bankStore.list"
                    item-title="name"
                    item-value="id"
                    placeholder="Bancos"
                    label="Bancos"
                    v-model="cuentaBancaria.id_banco"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    density="compact"
                    :items="coinsStore.itemsCoinsList"
                    item-title="acronym"
                    item-value="id"
                    placeholder="Monedas"
                    label="Monedas"
                    v-model="cuentaBancaria.id_coins"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-row v-if="isProveedorInternacional()">
                <v-col cols="12">
                  <v-text-field
                    density="compact"
                    placeholder="Nro swift"
                    label="Nro swift"
                    v-model="cuentaBancaria.nro_swift"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-row v-if="isProveedorInternacional()">
                <v-col cols="12">
                  <v-autocomplete
                    density="compact"
                    :items="bankStore.list"
                    item-title="name"
                    item-value="id"
                    placeholder="Bancos"
                    label="Bancos"
                    v-model="cuentaBancaria.id_intermediario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
              <v-row v-if="isProveedorInternacional()">
                <v-col cols="12">
                  <v-text-field
                    density="compact"
                    placeholder="Cuenta Intermediario"
                    label="Cuenta Intermediario"
                    v-model="cuentaBancaria.nro_cuenta_intermediario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            @click="dialogCuentaBancaria = !dialogCuentaBancaria"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="success"
            @click="registrarCuentaBancaria"
            :loading="loadingBotonGuardarCuentaBancaria"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCopiar"
      scrollable
      persistent
      max-width="30%"
    >
      <v-card>
        <v-card-title primary-title>
          COPIAR COSTOS {{ egreso.nombre_proveedor }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCopiar">
            <v-autocomplete
              :items="appStore.itemsCoinsList"
              v-model="egreso.id_coins"
              item-title="acronym"
              item-value="id"
              label="Moneda de Banco Salida"
              @update:model-value="obtenerMoneda()"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />

            <v-text-field
              density="compact"
              v-model="egreso.tipocambio"
              type="number"
              label="Tipo de Cambio"
              step="0.01"
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-if="
                appStore.itemsCoinsList.some(
                  (v: MonedaItem) => v.id == egreso.id_coins && v.acronym !== 'USD',
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
    <v-dialog
      v-model="dialogCambiarExp"
      persistent
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2">
          Mover {{ egreso.nombre_proveedor ? egreso.nombre_proveedor : null }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmMoverCosto">
            <v-autocomplete
              v-model="id_masterdestino"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :items="
                appStore.itemsMasterList.filter(
                  (v: ExpedienteItem) => v.id != egreso.id_master,
                )
              "
              item-value="id"
              item-title="code_master"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :loading="loading"
            variant="outlined"
            color="error"
            @click="dialogCambiarExp = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            :loading="loading"
            color="success"
            @click="functionMoverCostos"
          >
            Mover Costo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCambiarExpediente"
      max-width="500"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap">
          Cambiar expediente
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
                (v: ExpedienteItem) => String(v.id) !== route.params.id,
              )
            "
            v-model="selectedNuevoExpediente"
            item-value="id"
            item-title="code_master"
            label="Seleccione nuevo expediente"
            variant="outlined"
            class="my-5"
          />
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
            :loading="loading"
            :disabled="!selectedNuevoExpediente"
            @click="aplicarCambioExpediente"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style>
/* =====================================================
   SOLICITAR A ADMINISTRACIÓN (solicitud de pago)
   ===================================================== */
.solreq-cell {
  min-width: 250px;
}
.solreq {
  --solreq-fg: #1d4ed8;
  --solreq-bg: #eff4ff;
  --solreq-border: #d1defc;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  padding: 6px 6px 6px 10px;
  border: 1px solid var(--solreq-border);
  border-radius: 10px;
  background: var(--solreq-bg);
}
.solreq--rechazada {
  --solreq-fg: #c0261b;
  --solreq-bg: #fef3f2;
  --solreq-border: #fbd3cf;
}
.solreq__info {
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
.solreq__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff;
  color: var(--solreq-fg);
  box-shadow: 0 0 0 1px var(--solreq-border);
}
.solreq__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}
.solreq__title {
  overflow: hidden;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--solreq-fg);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.solreq__date {
  overflow: hidden;
  margin-top: 2px;
  font-size: 0.75rem;
  color: #667085;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.solreq__info:hover .solreq__title,
.solreq__info:focus-visible .solreq__title {
  text-decoration: underline;
}
.solreq__info:focus-visible {
  outline: 2px solid var(--solreq-fg);
  outline-offset: 2px;
  border-radius: 6px;
}
.solreq__btn {
  flex-shrink: 0;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.solreq__del {
  flex-shrink: 0;
}
/* editar / eliminar apilados y separados del texto: dejan el ancho al título y la fecha */
.solreq__acciones {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding-left: 6px;
  border-left: 1px solid var(--solreq-border);
}

/* =====================================================
   MODAL ELIMINAR
   ===================================================== */

.swal-delete-popup {
  border-radius: 26px !important;
  overflow: hidden !important;
}

/* =====================================================
   CONTENIDO
   ===================================================== */

.delete-modal-content {
  width: 100%;
  text-align: center;
  padding: 0;
  margin: 0;
}

/* =====================================================
   ILUSTRACIÓN
   ===================================================== */

.delete-warning-icon {
  position: relative;
  width: 82px;
  height: 76px;
  margin: 0 auto 5px;
}

/* Documento */

.delete-document {
  position: absolute;
  left: 8px;
  top: 0;
  width: 50px;
  height: 65px;

  background: #f8fafc;

  border: 2px solid #d9e0ea;
  border-radius: 5px;

  box-sizing: border-box;
}

/* Esquina */

.delete-document-fold {
  position: absolute;
  right: -2px;
  top: -2px;

  width: 17px;
  height: 17px;

  background: #eef2f7;

  border-left: 2px solid #d9e0ea;
  border-bottom: 2px solid #d9e0ea;

  clip-path: polygon(0 0, 100% 100%, 0 100%);
}

/* $ */

.delete-dollar {
  position: absolute;

  left: 8px;
  top: 6px;

  color: #1976d2;

  font-family: Arial, sans-serif;
  font-size: 22px;
  font-weight: 700;

  line-height: 1;
}

/* Líneas */

.delete-line {
  position: absolute;

  height: 5px;

  background: #cbd5e1;

  border-radius: 5px;
}

.delete-line.line-1 {
  top: 14px;
  right: 6px;
  width: 14px;
}

.delete-line.line-2 {
  top: 25px;
  right: 6px;
  width: 12px;
}

.delete-line.line-3 {
  top: 39px;
  left: 8px;
  width: 32px;
}

.delete-line.line-4 {
  top: 50px;
  left: 8px;
  width: 27px;
}

/* =====================================================
   CANDADO
   ===================================================== */

.delete-lock {
  position: absolute;

  left: 42px;
  top: 42px;

  width: 35px;
  height: 36px;

  z-index: 5;
}

/* Arco */

.delete-lock-shackle {
  position: absolute;

  left: 8px;
  top: 0;

  width: 20px;
  height: 20px;

  border: 5px solid #ffc107;
  border-bottom: 0;

  border-radius: 14px 14px 0 0;

  box-sizing: border-box;
}

/* Cuerpo */

.delete-lock-body {
  position: absolute;

  left: 1px;
  bottom: 0;

  width: 34px;
  height: 27px;

  background: #ffc107;

  border-radius: 5px;
}

/* Cerradura */

.delete-lock-key {
  position: absolute;

  left: 13px;
  top: 8px;

  width: 8px;
  height: 11px;

  background: #374151;

  border-radius: 5px;
}

.delete-lock-key::before {
  content: "";

  position: absolute;

  left: -3px;
  top: -3px;

  width: 14px;
  height: 14px;

  border-radius: 50%;

  border: 3px solid #374151;

  box-sizing: border-box;
}

/* =====================================================
   RAYOS
   ===================================================== */

.delete-ray {
  position: absolute;

  height: 4px;

  background: #fbbf24;

  border-radius: 5px;

  transform-origin: left center;
}

.delete-ray.ray-1 {
  width: 10px;

  left: 68px;
  top: 25px;

  transform: rotate(-35deg);
}

.delete-ray.ray-2 {
  width: 12px;

  left: 72px;
  top: 40px;

  transform: rotate(0deg);
}

.delete-ray.ray-3 {
  width: 10px;

  left: 68px;
  top: 54px;

  transform: rotate(35deg);
}

/* =====================================================
   TÍTULO
   ===================================================== */

.delete-title {
  color: #0f2f63;

  font-size: 23px;
  font-weight: 700;

  line-height: 1.2;

  margin: 0;

  padding: 0;
}

/* =====================================================
   MENSAJE
   ===================================================== */

.delete-message {
  color: #64748b;

  font-size: 14px;
  font-weight: 400;

  line-height: 1.3;

  margin: 8px 0 0;

  padding: 0;
}

/* =====================================================
   BOTÓN CONFIRMAR
   ===================================================== */

.swal-delete-confirm {
  background: #0878dc !important;

  color: #ffffff !important;

  border: none !important;

  border-radius: 6px !important;

  padding: 10px 17px !important;

  font-size: 13px !important;

  font-weight: 500 !important;

  min-width: 210px !important;

  height: 38px !important;

  box-shadow: none !important;
}

.swal-delete-confirm:hover {
  background: #0669c4 !important;
}

/* =====================================================
   BOTÓN CANCELAR
   ===================================================== */

.swal-delete-cancel {
  background: #ffffff !important;

  color: #0f172a !important;

  border: 1px solid #cbd5e1 !important;

  border-radius: 6px !important;

  padding: 9px 25px !important;

  font-size: 13px !important;

  font-weight: 500 !important;

  height: 38px !important;

  box-shadow: none !important;
}

.swal-delete-cancel:hover {
  background: #f8fafc !important;
}

/* =====================================================
   CONTENIDO BOTÓN
   ===================================================== */

.delete-confirm-content {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 8px;
}

.delete-confirm-content i {
  font-size: 14px;
}

/* =====================================================
   X
   ===================================================== */

.swal-delete-close {
  color: #64748b !important;

  font-size: 25px !important;

  font-weight: 400 !important;

  margin-top: 2px !important;
}

.swal-delete-close:hover {
  color: #0f172a !important;
}

/* =====================================================
   FOOTER SWEETAL
   ===================================================== */

.swal-delete-popup .swal2-actions {
  width: 100% !important;

  margin-top: 18px !important;

  padding: 0 !important;

  display: flex !important;

  justify-content: center !important;

  align-items: center !important;

  gap: 0 !important;
}

/* =====================================================
   MODAL SOLICITUD DE PAGO EXISTENTE
   ===================================================== */

.spago-popup {
  border-radius: 18px !important;
  padding: 26px 24px 24px !important;
  width: 440px !important;
  max-width: calc(100vw - 32px) !important;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18) !important;
}

.spago-icon {
  margin: 0 auto 10px !important;
  width: 64px !important;
  height: 64px !important;
  border-width: 4px !important;
}

.spago-icon .swal2-icon-content {
  font-size: 44px !important;
  font-weight: 700 !important;
}

.spago-title {
  font-size: 22px !important;
  font-weight: 800 !important;
  color: #0f172a !important;
  padding: 0 !important;
  margin: 0 0 6px !important;
}

.spago-text {
  font-size: 14px !important;
  color: #475569 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.spago-actions {
  width: 100% !important;
  margin: 22px 0 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-wrap: nowrap !important;
  gap: 12px !important;
}

.spago-confirm,
.spago-cancel {
  height: 42px !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  margin: 0 !important;
  box-shadow: none !important;
  cursor: pointer;
  transition: background 0.15s ease;
}

.spago-cancel {
  flex: 0 0 38%;
  background: #eef0f4 !important;
  color: #0f172a !important;
  border: 1px solid #cbd5e1 !important;
}

.spago-cancel:hover {
  background: #e2e8f0 !important;
}

.spago-confirm {
  flex: 1 1 auto;
  background: #0878dc !important;
  color: #ffffff !important;
  border: none !important;
  padding: 0 16px !important;
}

.spago-confirm:hover {
  background: #0669c4 !important;
}

.spago-confirm-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* =====================================================
   MODAL CARGAR FACTURA / PROFORMA
   ===================================================== */

/* cabecera y botones fijos; solo el cuerpo hace scroll si no entra en pantalla */
.inv-card {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  border-radius: 22px !important;
  overflow: hidden;
  color: #0a1f44;
}
.inv-card > .inv-header,
.inv-card > .v-card-actions {
  flex: 0 0 auto;
}

.inv-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px 8px;
}

.inv-header-icon {
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #dcebfd;
  color: #0b5fd6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inv-header-text {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 14px;
  border-left: 2px solid #0b5fd6;
}

.inv-title {
  margin: 0;
  font-size: 21px;
  font-weight: 900;
  color: #0a1f44;
  line-height: 1.15;
}

.inv-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: #3b4a63;
}

.inv-close {
  align-self: flex-start;
  color: #0a1f44 !important;
}

.inv-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 22px 4px !important;
}

.inv-prov {
  padding: 6px 14px;
  margin-bottom: 4px;
  border-radius: 12px;
  background: #dcebfd;
}

.inv-prov-row {
  display: grid;
  grid-template-columns: 26px 120px 1fr;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.inv-prov-row + .inv-prov-row {
  border-top: 1px solid #a9c6ee;
}

.inv-prov-icon {
  color: #0b5fd6 !important;
}

.inv-prov-label {
  font-size: 13px;
  font-weight: 700;
  color: #1e2c44;
}

.inv-prov-value {
  font-size: 16px;
  font-weight: 900;
  color: #0a1f44;
  overflow-wrap: anywhere;
}

.inv-label {
  display: block;
  margin: 10px 0 4px;
  font-size: 13px;
  font-weight: 800;
  color: #0a1f44;
}

.inv-req {
  color: #e11d2e;
}

.inv-input .v-field {
  border-radius: 10px;
}

.inv-input .v-field--focused {
  box-shadow: 0 0 0 3px rgba(11, 95, 214, 0.15);
}

.inv-input--readonly .v-field {
  background: #f4f7fb;
}

.inv-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 12px;
}

.inv-dropzone .drop-area {
  height: 112px !important;
  border: 2px dashed #0b5fd6 !important;
  border-radius: 14px !important;
  background: #f1f6fd !important;
  color: #0a1f44;
  font-weight: 700;
}

.inv-dropzone .drop-area:hover,
.inv-dropzone .drop-area:focus-visible {
  outline: none;
  border-color: #0846a8 !important;
  background: #e5effd !important;
}

.inv-dropzone .drop-area label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
}

.inv-dropzone .drop-area .v-icon {
  font-size: 40px !important;
  color: #0b5fd6 !important;
  margin: 0 !important;
}

.inv-dropzone .clsArchivoCargado {
  min-height: 0;
  padding: 4px 8px 4px 12px;
  border-radius: 12px;
}

.inv-dropzone .clsArchivoCargado .v-btn--icon {
  width: 32px;
  height: 32px;
}

.inv-actions {
  display: grid !important;
  grid-template-columns: 1fr 1.4fr;
  padding: 14px 22px 18px !important;
  gap: 12px;
}

.inv-btn-cancel,
.inv-btn-save {
  height: 44px !important;
  margin: 0 !important;
  border-radius: 10px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-size: 15px !important;
  font-weight: 800 !important;
}

.inv-btn-cancel {
  color: #0a1f44 !important;
  border-color: #94a3b8 !important;
}

.inv-btn-save {
  color: #ffffff !important;
}

@media (max-width: 600px) {
  .inv-row,
  .inv-actions {
    grid-template-columns: 1fr;
  }
  .inv-prov-row {
    grid-template-columns: 26px 1fr;
  }
  .inv-prov-value {
    grid-column: 2;
  }
}

.egreso-summary-table table {
  width: 100%;
  table-layout: fixed;
}

.egreso-summary-table th:first-child,
.egreso-summary-table td:first-child {
  white-space: normal;
  overflow-wrap: anywhere;
}

/* Solicitud de pago (nueva) */
.solnueva__estado {
  margin-left: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  background: #dbeafe;
  color: #1e40af;
}
.solnueva__estado--LISTO {
  background: #d9f7e1;
  color: #166534;
}
.solnueva__estado--PENGER {
  background: #fdf0c4;
  color: #7a5a00;
}
.solnueva__estado--PENADM {
  background: #ece2fc;
  color: #5b21b6;
}
.solnueva__estado--RECHAZADA {
  background: #fde2e2;
  color: #b42318;
}
.solnueva__conceptos {
  border: 1px solid #dbe5f5;
  border-radius: 12px;
  background: #f6f9ff;
  padding: 10px 14px;
  max-height: 220px;
  overflow-y: auto;
}
.solnueva__concepto,
.solnueva__total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}
.solnueva__total {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed #c5d3ea;
  font-weight: 800;
  color: #1e3a8a;
}
.solnueva__tipos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.solnueva__tipo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid #d5dbe6;
  border-radius: 10px;
  background: #fff;
  font-weight: 700;
  text-align: left;
}
.solnueva__tipo:hover {
  border-color: #1e5bd8;
}
.solnueva__tipo--active {
  border-color: #1e5bd8;
  background: #eef4ff;
  box-shadow: 0 0 0 1px #1e5bd8 inset;
}
</style>
