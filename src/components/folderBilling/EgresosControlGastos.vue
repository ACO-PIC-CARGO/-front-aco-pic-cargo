<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useRoute } from "vue-router";
import moment from "moment";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useSecuritysStore } from "@/stores/securitys";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
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
} from "@/types/billingEntries";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

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
}>();

const appStore = useAppStore();
const staleRootState = appStore as typeof appStore & {
  controlgastos: { master_houses: ControlGastoHouse[] };
  master_houses: ControlGastoHouse[];
};
const route = useRoute();
const bankStore = useBankStore();
const controlGastosStore = useControlGastosStore();
const filesStore = useFilesStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();
const mastersStore = useMastersStore();
const securitysStore = useSecuritysStore();
const frmMoverCosto = useTemplateRef("frmMoverCosto");
const frmEgreso = useTemplateRef("frmEgreso");
const frmPorcentajeProveedor = useTemplateRef("frmPorcentajeProveedor");
const frmCuentaBancaria = useTemplateRef("frmCuentaBancaria");
const frmCopiar = useTemplateRef("frmCopiar");

const dialogCambiarExp = ref(false);
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
let sPaymentId: number | undefined;
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
    if (decimales > 2) {
      tipocambio.value = parseFloat(String(tipocambio.value)).toFixed(2);
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
      icon: "question",
      html: `<b>Ya se ha realizado una solicitud de pago a administración. ¿Desea generar una solicitud nueva y eliminar la anterior?</b>`,
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si",
      cancelButtonText: "No",
    }).then(async (res) => {
      if (res.isConfirmed) {
        await _getSPaymentPro(egreso);
        if (itemsSPayment.value[0] && itemsSPayment.value[0].id) {
          await eliminar(itemsSPayment.value[0].id);

          selected.value = [];
          TotalLocal = egreso.detalle.reduce((suma, element) => {
            return suma + parseFloat(String(element.total_op));
          }, 0);
          total = 0;
          proveedorId = egreso.id_proveedor;
          nameproveedor.value = egreso.nombre_proveedor;
          conceptos.value = egreso.detalle;
          id_correlativo.value = egreso.id_correlativo;
          id_master = egreso.id_master;

          await _generateSolicitud();
        }
      }
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
    id_user: sessionUser().id,
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setEgresos",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(async function () {
      await controlGastosStore.getListControlGastosMaster(route.params.id as string);
      dialog.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
  emit("recalcularProfit");
}
function solicitar(egreso: EgresoProveedor) {
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

  await axios(config)
    .then(async function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      itemsInvoice = response.data.data;
      await controlGastosStore.getListControlGastosMaster(route.params.id as string);
      Swal.fire({
        icon: "success",
        title: "Documento Cargado",
        text: "El documento ha sido cargado correctamente",
      });

      // vm.cleandData();
      // vm.dialogListInvoice = false;
      dialogInvoice.value = false;

      await _getInvoice(egreso.value);
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _delInvoice(id: number) {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "delInvoice/" + id,
    headers: {
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      itemsInvoice = response.data.data;
      _getInvoice(egreso.value);
      dialogInvoice.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
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
  if (egreso.total_total_op > egreso.monto_pagar_op) {
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

        await continuarEliminar(item);
      }
    });
  } else {
    continuarEliminar(item);
  }
}
function continuarEliminar(item: EgresoDetalle & { nombre_proveedor?: string }) {
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
        headers: {
          "Content-Type": "application/json",
        },
      };
      axios(config)
        .then(async function (response) {
          const res = response.data;
          if (res.estadoflag == true) {
            Swal.fire({
              icon: "info",
              title: "informacíon",
              text: res.mensaje,
            });
            appStore.spiner = false;
            await controlGastosStore.getListControlGastosMaster(route.params.id as string);
          } else {
            Swal.fire({
              icon: "error",
              title: "informacíon",
              text: res.mensaje,
            });
            appStore.spiner = false;
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  });
}
async function openPayments(egreso: EgresoProveedor) {
  sPaymentId = egreso.id_proveedor;
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

    id_user: sessionUser().id,
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

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "editEgreso/" + egresos.value.id,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(async function () {
      await controlGastosStore.getListControlGastosMaster(route.params.id as string);
      dialog.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
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
    itemTotalHouse: staleRootState.controlgastos.master_houses.map(
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

      axios(config)
        .then(async function () {
          Swal.fire({
            icon: "success",
            title: "Excelente",
            text: "Solicitud enviada correctamente",
          });
          await controlGastosStore.getListControlGastosMaster(route.params.id as string);
          _getSPaymentPro(sPaymentId);
          dataList.value = true;
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  });

  _getAccountsNumber();

  nameproveedorLocal = nameproveedor.value;
}
async function eliminar(id: number) {
  const data = {
    id: id,
  };

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

      Swal.fire({
        icon: "info",
        title: "Información",
        text: res.data[0].mensaje,
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
    });

  appStore.spiner = false;
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
      nameproveedor: element.nombre_proveedor,
      total_pr: parseFloat(String(element.total_total_pr)).toFixed(2),
      total_op: parseFloat(String(element.total_total_op)).toFixed(2),
    };
  });

  const datas = {
    id_house: staleRootState.master_houses.filter((v: ControlGastoHouse) => v.id_house)[0]!
      .id_house,
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
    .then(function (response) {
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
        codigo_pago: codigo_pago.value,
        codigo_master:
          controlGastosStore.listControlGastos[0]!
            .master_nromaster,
        cuentas: selectedAccount.value,
        operador: appStore.dataHouse_operador,
        conceptos: conceptos.value,
        selected: selected.value,
        totalSelected: total,
        number: response.data.number,
        url_logo: sessionUser().path,
        url: controlGastosStore.listControlGastos[0]!
          .url_folderonedrive,
      };
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "pdfSolicitud",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(async function (response) {
          await controlGastosStore.getListControlGastosMaster(route.params.id as string);
          Swal.fire({
            icon: "success",
            title: "PDF Generado",
            text: "El PDF se descargará automaticamente",
          });

          window.open(
            import.meta.env.VITE_URL_MAIN + response.data.path,
            "_blank",
          );
          dialogSolicitudDivision.value = false;
          dialogSolicitud.value = false;
        })
        .catch(function (error) {
          console.error(error);
        });
    })
    .catch(function (error) {
      console.error(error);
    });
  loading.value = false;
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
    radio.value = "1";
    date.value = moment().format("YYYY-MM-DD");
    nro_invoice.value = "";
    monto_factura.value = "";
    payfile.value = null;
    boolFile.value = false;

    dialogInvoice.value = true;
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
          <v-table density="compact">
            <thead>
              <tr>
                <th width="28%">
                  Proveedor
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
                  Deuda Actual
                </th>
                <th
                  v-if="editable"
                  width="12%"
                />
                <th
                  v-if="editable"
                  width="12%"
                  class="text-left"
                >
                  Facturas o Proformance
                </th>
                <th
                  v-if="editable"
                  width="12%"
                  class="text-left"
                >
                  Generar PDF de pago
                </th>
                <th
                  v-if="editable"
                  width="12%"
                  class="text-left"
                >
                  Solicitar a Administración
                </th>
                <th
                  v-if="editable"
                  width="12%"
                  class="text-left"
                >
                  Más Acciones
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
                    v-if="egresoProveedor.code_tipo_proveedor === '01'"
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
                    color="info"
                    class="my-1 mx-1"
                    size="x-small"
                    @click="nuevoEngreso(egresoProveedor)"
                  >
                    Nuevo Concepto
                  </v-btn>
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
                </td>
                <td v-if="editable">
                  <v-btn
                    variant="text"
                    icon
                    size="small"
                    :loading="loading"
                    :color="egresoProveedor.docs > 0 ? 'blue' : 'grey'"
                    @click="openInvoice(egresoProveedor)"
                    @click.stop="abrirExpandEgreso(index)"
                  >
                    <v-icon>mdi-file-compare</v-icon>
                  </v-btn>
                </td>
                <td v-if="editable">
                  <v-btn
                    variant="text"
                    size="small"
                    color="white"
                    icon
                    @click.stop="validarSolicitudPago(egresoProveedor)"
                    @click="abrirExpandEgreso(index)"
                  >
                    <v-icon color="blue">
                      mdi-send
                    </v-icon>
                  </v-btn>
                </td>

                <td v-if="editable">
                  <v-btn
                    variant="text"
                    size="small"
                    :color="egresoProveedor.solicitudes > 0 ? 'blue' : 'grey'"
                    icon
                    @click="openPayments(egresoProveedor)"
                    @click.stop="abrirExpandEgreso(index)"
                    :disabled="!(egresoProveedor.solicitudes && egresoProveedor.solicitudes > 0)"
                  >
                    <v-icon :color="'blue'">
                      mdi-email-arrow-right
                    </v-icon>
                  </v-btn>
                </td>
                <!-- <td v-if="editable">
                  <v-btn
                    color="indigo"
                    small
                    dark
                    @click="abrirModalCambiarExp(egreso)"
                    >CAMBIAR EXPEDIENTE</v-btn
                  >
                </td> -->
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
                        variant="text"
                        icon
                        color="orange"
                        size="small"
                      >
                        <v-icon @click="_editEgreso(item)">
                          mdi-pencil
                        </v-icon>
                      </v-btn>
                      <v-btn
                        variant="text"
                        icon
                        color="red"
                        size="small"
                        v-if="!item.statusadmin && item.pagado == 0"
                      >
                        <v-icon @click="_delEngreso(item, egresoProveedor)">
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
              >
                <v-icon
                  class="btn_add mr-2"
                  size="large"
                  color="grey"
                  @click="openDoc(item.path)"
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
                  @click="_delInvoice(item.id)"
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
      width="80%"
      v-model="dialogInvoice"
    >
      <v-card>
        <v-card-title>
          <h3>Subir factura o proforma para {{ nameproveedor }}</h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row density="compact">
              <v-col
                cols="12"
                md="12"
              >
                <v-radio-group
                  v-model="radio"
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
                md="4"
              >
                <v-text-field
                  density="compact"
                  label="Fecha de Operación"
                  prepend-icon="mdi-calendar"
                  type="date"
                  v-model="date"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  density="compact"
                  v-model="nro_invoice"
                  :label="`Nro de ${
                    radio == 1
                      ? 'Factura'
                      : String('') || radio == 2
                        ? 'Performance'
                        : 'Otro'
                  }`"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  density="compact"
                  v-model="monto_factura"
                  label="Monto de la Factura"
                  :rules="[(v) => v > 0 || 'Debe ser un monto numérico']"
                  @change="validarMontoFactura"
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
          <v-spacer />
          <v-btn
            color="primary"
            @click="_setInvoice()"
            :disabled="!filesStore.payPath || !monto_factura"
          >
            GUARDAR
            {{
              radio == 1 ? "Factura" : String("") || radio == 2 ? "Performance" : "Otro"
            }}
          </v-btn>

          <v-btn
            variant="outlined"
            color="red"
            @click="dialogInvoice = !dialogInvoice"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
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
              v-if="item.status == 1"
              class="mr-2"
              color="green"
              @click="sendAdmin(item.id)"
            >
              mdi-send
            </v-icon>
            <v-icon
              v-if="item.status != 3"
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
  </div>
</template>

<style>
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
</style>
