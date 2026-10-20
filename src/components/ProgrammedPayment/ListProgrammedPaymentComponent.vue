<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from '@/api/http';
import moment from "moment";
import Swal from "sweetalert2";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
import { useProgramacionesStore } from "@/stores/programaciones";
import type { CuentaBancariaPic } from "@/types/operaciones";
import type {
  CuentaSalidaPago,
  DetallePagoProveedor,
  ProgramacionConDetalles,
  ProgramacionProveedorFila,
  ProveedorPago,
} from "@/types/banksProveedor";
import { sessionBranchId } from "@/utils/sesion";

const emit = defineEmits<{ cerrar: [value: boolean] }>();

const rootStore = useStore();
const route = useRoute();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const programacionesStore = useProgramacionesStore();
const listPagosXProveedorCxP = computed<DetallePagoProveedor[]>(() => rootStore.state.listPagosXProveedorCxP);
const programaciones = computed(() => programacionesStore.listado as unknown as ProgramacionConDetalles[]);
const programacionesProveedor = computed(
  () => programacionesStore.listProgramacionxProveedor as unknown as ProgramacionProveedorFila[],
);
const frmPagoStep2 = useTemplateRef("frmPagoStep2");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ModalPagoControlGastoComponent = defineAsyncComponent(() =>
  import("../../components/modal/ModalPagoControlGastoComponent.vue"));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let moneda: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let totalPagado: number | string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payFile: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let name_path: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let url_documento: string | undefined;
let tipo: string | undefined;

const monExt = ref("");
const msgNroOperacion = ref("");
const id = ref<number | string>("");
const comentarios = ref<string | null>("");
const id_coins = ref<number | string>(1);
const tipocambio = ref<number | string>(1);
const acronym = ref("USD");
const msgfile = ref("");
const errfile = ref("");
const nro_operacion = ref<string | null>("");
const search = ref("");
const headers = [
  {
    title: "Correlativo",
    key: "correlativo",
  },
  {
    title: "Fecha Programada",
    key: "fecha",
  },
  {
    title: "Total Pagar Dolares",
    key: "total_dolar_total",
  },
  {
    title: "Total Pagar Soles",
    key: "total_soles_total",
  },
];
const selected = ref<ProgramacionProveedorFila[]>([]);
const dialogProcess = ref(false);
const payfile = ref<File | File[] | null>(null);
const payoperacion = ref("");
const paybanco = ref("");
const paymoneda = ref("");
const paymonto = ref("");
const itemsSPaymentConceptos = ref<unknown[]>([]);
const pathfile = ref("");
const sPaymentId = ref("");
const paymentname = ref("");
const paymentMaster = ref("");
const paymentmonto = ref("");
const payPath = ref<string | never[]>("");
const nameproveedor = ref("");
const id_proveedor = ref<number | string>("");
const id_orders = ref("");
const date = ref<string | null>("");
const boolFile = ref(false);
const fecha = ref(moment(new Date()).add(7, "days").format("YYYY-MM-DD"));
const cuentas = ref<CuentaBancariaPic[]>([]);
const tab = ref<string | null>(null);
const step2 = ref(true);
const total = ref<number | string>(0);
const id_cuenta = ref<CuentaSalidaPago>("" as unknown as CuentaSalidaPago);
const dialgoCXP = ref(false);
const montoMonExt = ref<number | string>(0);
const headersProgXProveedor = [
  { title: "Expediente", key: "nro_master" },
  // { text: "Master", value: "code_control" },
  { title: "Factura/ Proforma", key: "expedientes" },
  { title: "Procedencia", key: "procedencia" },
  { title: "Monto (USD)", key: "monto" },
  { title: "Monto Factura", key: "monto_mon_extranjera" },
  {
    title: "Tipo Cambio",
    key: "tipo_cambio",
  },
  {
    title: "Moneda Pagar",
    key: "item_moneda",
  },
  { title: "Monto Pagar", key: "monto_pagar" },
  { title: "Acción", key: "action" },
];
const expanded = ref<string[]>([]);
const idDetails = ref("");
const dialog = ref(false);
const loadingFile = ref(false);
const loadingRegistro = ref(false);
const errorTipCambio = ref("");

async function ValidaNroOp() {
  msgNroOperacion.value = "";
  rootStore.state.spiner = true;
  await bancosStore.getValidaNroOp(nro_operacion.value as string);
  if (!!bancosStore.validacionBanco!.estadoflag) {
    msgNroOperacion.value = bancosStore.validacionBanco!.mensaje;
    document.getElementById("nro_operacion")!.focus();
  } else {
    msgNroOperacion.value = "";
  }

  rootStore.state.spiner = false;
}
function moverSeleccionadoAlInicio() {
  const listaPagos = rootStore.state.listPagosXProveedorCxP;

  const seleccionadosIds = new Set(selected.value.map((item) => item.id));

  listaPagos.sort((a: DetallePagoProveedor, b: DetallePagoProveedor) => {
    const aSeleccionado = seleccionadosIds.has(a.id);
    const bSeleccionado = seleccionadosIds.has(b.id);

    if (aSeleccionado && !bSeleccionado) return -1;
    if (!aSeleccionado && bSeleccionado) return 1;
    return 0;
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAcronym() {
  acronym.value = rootStore.state.itemsCoinsList.filter(
    (v: { id: number }) => v.id == id_coins.value,
  )[0].symbol;
  if (acronym.value != "USD" && tipocambio.value == 1) {
    errorTipCambio.value = "Seleccione un tipo de cambio";
  }
}
function limpiarDatos() {
  payfile.value = null;
  payPath.value = "";
  id_proveedor.value = "";
  boolFile.value = false;
  tab.value = "ref1";
  step2.value = true;
  total.value = 0;
  rootStore.state.listPagosXProveedorCxP = [];
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function obtenerListado() {
  await rootStore.dispatch("_getListaPagosXProveedorCxP", id_proveedor.value);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validarSeleccionado() {
  fecha.value = selected.value[0]!.fecha!;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cerrarModal() {
  emit("cerrar", false);
}
async function payment(
  item: { id_proveedor: number; id_coins: number; proveedor: string },
  idProgramacion: number,
) {
  tab.value = "ref1";
  payfile.value = [];
  comentarios.value = null;
  id.value = idProgramacion;
  id_proveedor.value = item.id_proveedor;
  id_coins.value = item.id_coins;
  id_coins.value = 1;
  // this.tipocambio = 1;
  selected.value = [];
  date.value = null;
  nro_operacion.value = null;
  id_cuenta.value = "" as unknown as CuentaSalidaPago;
  nameproveedor.value = item.proveedor;
  // @ts-expect-error payPath is a number or null
  filesStore.payPath = "";
  await programacionesStore.getListProgramacion({
    id_proveedor: item.id_proveedor,
    id: idProgramacion,
    id_coins: item.id_coins,
  });
  dialog.value = true;
}
function calcularTotales() {
  let monex = 0;
  if (selected.value.length > 0) {
    selected.value.forEach((element) => {
      tipocambio.value = element.tipocambio;
      id_coins.value = element.id_coins;
      element.monto_mon_ext = parseFloat(
        String(parseFloat(String(element.monto)) * parseFloat(String(element.tipocambio))),
      ).toFixed(2);

      monex = parseFloat(String(monex)) + parseFloat(element.monto_mon_ext);
    });
  }
  acronym.value = rootStore.state.itemsCoinsList.filter(
    (v: { id: number }) => v.id == id_coins.value,
  )[0].symbol;
  montoMonExt.value = parseFloat(String(monex)).toFixed(2);
}
function calcularTotalesInput() {
  let monex = 0;
  selected.value.forEach((element) => {
    element.errorEx = "";
    if (
      parseFloat(String(element.monto_mon_ext)) >
      parseFloat(String(parseFloat(String(element.monto)) * parseFloat(String(element.tipocambio))))
    ) {
      element.errorEx =
        "El monto no puede ser mayor que el monto como deuda";
    } else {
      monex = parseFloat(String(monex)) + parseFloat(String(element.monto_mon_ext));
    }
  });
  montoMonExt.value = parseFloat(String(monex)).toFixed(2);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processPayment(id: string, path: string, master: string, monto: string, proveedor: string) {
  sPaymentId.value = id;
  paymentname.value = path;
  paymentMaster.value = master;
  paymentmonto.value = monto;
  nameproveedor.value = proveedor;
  // @ts-expect-error payfile holds a file or null
  payfile.value = "";
  _getRequestPaymentConceptos(sPaymentId.value);
  dialogProcess.value = true;
}
async function _getRequestPaymentConceptos(id: string) {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getRequestPaymentConceptos/" + id,

    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsSPaymentConceptos.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function uploadFile() {
  msgfile.value = "";
  errfile.value = "";
  if (payfile.value) {
    loadingFile.value = true;
    await filesStore._uploadFile(payfile.value as unknown as File);
    loadingFile.value = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filesStore.payPath
      ? (msgfile.value = "Archivo cargado")
      : (errfile.value = "Comuniquese con el admistrador");
  } else {
    errfile.value = "Dato Requerido";
  }
}
async function registrarPago() {
  if ((await frmPagoStep2.value!.validate()).valid) {
    loadingRegistro.value = true;
    const data = {
      id_coins: id_coins.value,
      tipocambio: id_coins.value == 1 ? 1 : tipocambio.value,
      details: selected.value,
      fecha: date.value,
      nro_operacion: nro_operacion.value,
      id_cuentas: id_cuenta.value.id,
      id_path: filesStore.payPath,
      id_proveedor: id_proveedor.value,
    };
    await programacionesStore.setPagoProgramado(data);
    dialog.value = false;
    loadingRegistro.value = false;
  }
}
async function getListBanksDetailsCargar() {
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
    params: {
      id_branch: sessionBranchId(),
    },
    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      cuentas.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validarMonto(details: { id: number; max_pagar: number; monto_deuda: number }) {
  if (details.max_pagar > details.monto_deuda) {
    document.getElementById(`pago${details.id}`)!.focus();
  } else {
    calcularTotal();
  }
}
function calcularTotal() {
  let sum = 0;
  listPagosXProveedorCxP.value.map((item) => {
    if (item.pagar) {
      if (item.cktotal) {
        sum += parseFloat(String(item.monto_deuda));
        item.max_pagar = item.monto_deuda;
      } else {
        sum += parseFloat(String(item.max_pagar));
      }
    }
  });
  total.value = parseFloat(String(sum)).toFixed(4);
}
function calcularTotalPagado() {
  let sum = 0;
  listPagosXProveedorCxP.value.map((item) => {
    sum += parseFloat(String(item.monto_pagar));
  });
  totalPagado = parseFloat(String(sum)).toFixed(4);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setearMonto(details: DetallePagoProveedor) {
  if (details.pagar) {
    listPagosXProveedorCxP.value.filter(
      (v) => v.id == details.id,
    )[0]!.cktotal = true;
  }
}
function validar(registro = false) {
  let validacion = true;
  let msg = "";
  if (!payPath.value && registro) {
    validacion = false;
    msg += "Por favor, seleccione un documento para soporte de pago. ";
  }
  if (!id_cuenta.value && registro) {
    validacion = false;
    msg += "Por favor, seleccione una cuenta. ";
  }

  // @ts-expect-error a boolean is compared with a number
  if (!listPagosXProveedorCxP.value.filter((v) => v.pagar).length > 0) {
    validacion = false;
    msg += "Seleccione al menos una cuenta a pagar. ";
  }

  if (
    listPagosXProveedorCxP.value.filter((v) => (v.monto_deuda as number) < (v.max_pagar as number))
      .length > 0
  ) {
    validacion = false;
    msg += "No puede realizar un pago mayor a la deuda. ";
  }
  if (!validacion) {
    Swal.fire({
      icon: "error",
      title: "Lo sentimos",
      text: msg,
    });
  }

  return validacion;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _putPayForProveedor() {
  if (validar(true)) {
    const data = {
      id_proveedor: (id_proveedor.value as unknown as ProveedorPago).id,
      id_path: payPath.value,
      details: listPagosXProveedorCxP.value.filter((v) => v.pagar),
      id_cuenta: id_cuenta.value.id,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setPayForProveedor",

      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        if (response.data.statusBol == true) {
          Swal.fire({
            icon: "success",
            title: "Aviso",
            text: response.data.data.msg,
          });
          ActualizarPagoProgramado();
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
function continuar() {
  step2.value = false;
  tab.value = "ref2";
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _setSPaymentFile() {
  Swal.fire({
    icon: "info",
    title: "Procesando pago...",
    text: "Por favor espere",
  });
  const data = {
    fecha_operacion: date.value,
    nro_operacion: payoperacion.value,
    id_banks: paybanco.value,
    id_coins: paymoneda.value,
    monto: paymonto.value,
    id_path: payPath.value,
    status: 1,
    id_request: sPaymentId.value,
    itemsSPaymentConceptos: itemsSPaymentConceptos.value,
    id_proveedor: id_proveedor.value,
    id_orders: id_orders.value,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setSPaymentFile/",

    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      //vm.itemsSPayment = response.data.data;
      Swal.fire({
        icon: "success",
        title: "Pago Procesado",
        text: "El pago ha sido procesado correctamente",
      });

      ActualizarPagoProgramado();
      cleandData();
      dialogProcess.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function cleandData() {
  date.value = "";
  payoperacion.value = "";
  paybanco.value = "";
  paymoneda.value = "";
  paymonto.value = "";
  payPath.value = [];
  payFile = "";
  pathfile.value = "";
  boolFile.value = false;
  selected.value = [];
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function obtenerDatos() {
  if (tipo == "ver") {
    const id = route.params.id;

    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN + `getVerPagosPorProveedor?id=` + id,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        const data = response.data.data[0];
        step2.value = false;
        id_proveedor.value = data.id_proveedor;
        rootStore.state.listPagosXProveedorCxP = data.details;
        id_cuenta.value = data.id_bank;
        name_path = data.documento;
        url_documento = data.link_documento;
        setTimeout(() => {
          calcularTotalPagado();
        }, 200);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
async function ActualizarPagoProgramado() {
  const config = {
    method: "put",
    url:
      import.meta.env.VITE_URL_MAIN +
      `updateProgrammedPayment/${idDetails.value}`,
    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function () {
      dialgoCXP.value = false;
      dialogProcess.value = false;
      programacionesStore.ListProgrammedPayment();
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function eliminar(item: ProgramacionConDetalles, id_proveedor: number, id_details: number) {
  // @ts-expect-error showDenyButton takes a boolean
  Swal.fire({
    icon: "question",
    text: "¿Está seguro que de desea eliminar esta programación?",
    showDenyButton: "Cancelar",
    denyButtonText: "Cancelar",
    confirmButtonText: "Eliminar",
    confirmButtonColor: "green",
  }).then((result) => {
    if (result.isConfirmed) {
      programacionesStore.eliminarProgramacion({
        id: parseInt(String(item.correlativo)),
        id_proveedor: id_proveedor,
        id_details: id_details,
      });
    }
  });
}
function filterOnlyCapsText(value: unknown, search: string | null) {
  const text = search ? search.toLocaleUpperCase() : null;
  return (
    value != null &&
    search != null &&
    typeof value === "string" &&
    value.toString().toLocaleUpperCase().indexOf(text as string) !== -1
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verDocumento(url: string) {
  window.open(url, "_blank");
}
async function eliminarDetalle(item: ProgramacionProveedorFila & { nro_master?: string; proveedor?: string }) {
  // @ts-expect-error showDenyButton takes a boolean
  await Swal.fire({
    icon: "question",
    html: `Está seguro que desea eliminar de la programación el registro correspondiente al exp <b>${item.nro_master}</b>`,
    confirmButtonText: "Eliminar",
    denyButtonText: "Cancelar",
    showDenyButton: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      rootStore.state.spiner = true;
      await programacionesStore.eliminarProgramacionDetalle({ id: item.id });
      id_coins.value = 1;
      tipocambio.value = 1;
      selected.value = [];
      date.value = null;
      nro_operacion.value = null;
      id_cuenta.value = "" as unknown as CuentaSalidaPago;
      nameproveedor.value = item.proveedor as string;
      // @ts-expect-error payPath is a number or null
      filesStore.payPath = "";
      // @ts-expect-error id_coins is missing from the filter
      await programacionesStore.getListProgramacion({
        id_proveedor: id_proveedor.value,
        id: id.value,
      });
      rootStore.state.spiner = false;
    }
  });
}

watch(selected, (newVal, oldVal) => {
  calcularTotales();
  if (newVal.length > oldVal.length) {
    nextTick(() => {
      moverSeleccionadoAlInicio();
    });
  }
});

onMounted(async () => {
  monExt.value = moneda = (JSON.parse(
    sessionStorage.getItem("dataBranch") as string,
  ) as { moneda: { symbol: string }[] }[])[0]!.moneda[0]!.symbol;
  rootStore.state.spiner = true;
  await programacionesStore.ListProgrammedPayment();
  await rootStore.dispatch("cargarProveedores");
  await getListBanksDetailsCargar();
  await rootStore.dispatch("_getCoinsList");
  await limpiarDatos();
  rootStore.state.spiner = false;
});
</script>

<template>
  <div class="">
    <v-data-table
      :headers="headers"
      :items="programaciones"
      v-model:expanded="expanded"
      item-value="id"
      show-expand
      expand-on-click
      class="mx-4 ext-uppercase"
      :custom-filter="filterOnlyCapsText"
      fixed-header
    >
      <template #[`item.total_dolar_total`]="{ item }">
        $ {{ item.total_dolar }}
      </template>
      <template #[`item.total_soles_total`]="{ item }">
        {{ monExt }} {{ item.total_soles }}
      </template>
      <template #expanded-row="{ item }">
        <tr>
          <td colspan="11">
            <v-table style="width: 100%">
              <thead>
                <tr style="background: #fff1cf">
                  <th>Accion</th>
                  <th>Proveedor</th>
                  <th>Monto</th>
                  <th>Deuda Actual</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="child of item.details"
                  :key="child.id"
                >
                  <td>
                    <v-btn
                      variant="text"
                      icon
                      color="primary"
                      @click="payment(child, item.id)"
                      v-if="child.status == false"
                    >
                      <v-icon>mdi-hand-coin</v-icon>
                    </v-btn>
                    <v-btn
                      variant="text"
                      icon
                      color="red"
                      @click="
                        eliminar(item, child.id_proveedor, child.id_details)
                      "
                      v-if="child.status == false"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                  <td>{{ child.proveedor }}</td>

                  <td>{{ child.symbol }} {{ child.monto_original }}</td>
                  <td>{{ child.symbol }} {{ child.monto }}</td>

                  <td>
                    <v-chip
                      color="orange"
                      variant="outlined"
                      v-if="child.status == false"
                    >
                      Por Pagar
                    </v-chip>
                    <v-chip
                      color="green"
                      variant="outlined"
                      v-if="child.status == true"
                    >
                      Pagado
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </td>
        </tr>
      </template>
    </v-data-table>

    <v-dialog
      v-model="dialog"
      fullscreen
      persistent
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          PROVEEDOR: {{ nameproveedor }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialog = !dialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="3">
              <v-text-field
                style="font-size: 20pt; color: green"
                label="Monto en que va a salir del banco"
                v-model="montoMonExt"
                readonly
                :prefix="acronym"
              />
            </v-col>
          </v-row>
          <v-tabs
            color="#A43542"
            slider-color="primary"
            fixed-tabs
            v-model="tab"
          >
            <v-tab value="ref1">
              STEP 1
            </v-tab>
            <v-tab
              value="ref2"
              v-if="selected.length > 0"
            >
              STEP 2
            </v-tab>
          </v-tabs>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="ref1">
              <v-row>
                <v-col cols="3">
                  <v-text-field
                    label="Buscar..."
                    v-model="search"
                  />
                </v-col>
                <v-col cols="3">
                  <v-btn
                    v-if="selected.length > 0"
                    color="green-darken-4"
                    @click="continuar()"
                  >
                    Continuar
                  </v-btn>
                </v-col>
              </v-row>
              <v-data-table
                :headers="headersProgXProveedor"
                :items="programacionesProveedor"
                class="elevation-1"
                show-select
                item-value="id"
                return-object
                v-model="selected"
                :search="search"
              >
                <template #[`item.item_moneda`]="{ item }">
                  <v-autocomplete
                    :items="rootStore.state.itemsCoinsList"
                    v-model="item.id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda"
                    @blur="calcularTotales()"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                  />
                </template>
                <!--  -->
                <template #[`item.tipo_cambio`]="{ item }">
                  <v-text-field
                    v-model="item.tipocambio"
                    type="number"
                    step="0.01"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    @blur="calcularTotales()"
                  />
                </template>
                <!--  -->
                <template #[`item.monto_mon_extranjera`]="{ item }">
                  {{ item.acronym }} {{ item.monto_mon_ex }}
                </template>
                <template #[`item.action`]="{ item }">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarDetalle(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>

                <!--  -->
                <template #[`item.monto_pagar`]="{ item }">
                  <v-text-field
                    v-model="item.monto_mon_ext"
                    type="number"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    :prefix="acronym"
                    @blur="calcularTotalesInput()"
                    :error-messages="item.errorEx"
                  />
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="ref2">
              <v-form ref="frmPagoStep2">
                <v-row class="mt-5">
                  <v-col cols="3">
                    <v-text-field
                      v-model="nro_operacion"
                      label="N° de Operación"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                      @blur="ValidaNroOp()"
                      :error-messages="msgNroOperacion"
                      id="nro_operacion"
                    />
                  </v-col>
                  <v-col
                    cols="3"
                    md="3"
                  >
                    <v-text-field
                      type="date"
                      v-model="date"
                      label="Fecha"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                    />
                  </v-col>
                  <v-col
                    md="6"
                    cols="6"
                  >
                    <v-file-input
                      label="Cargar Archivo"
                      v-model="payfile"
                      @update:model-value="uploadFile()"
                      :messages="msgfile"
                      :class="{ 'text-success': !!msgfile }"
                      :error-messages="errfile"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                      :loading="loadingFile"
                    />
                  </v-col>

                  <v-col
                    md="4"
                    cols="4"
                  >
                    <v-autocomplete
                      :items="cuentas.filter((v) => v.symbol == acronym)"
                      item-title="label"
                      item-value="id"
                      label="CUENTA BANCARIA"
                      v-model="id_cuenta"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                      return-object
                    />
                  </v-col>
                  <v-col
                    md="4"
                    cols="4"
                  >
                    <v-text-field
                      readonly
                      v-model="id_cuenta.banco"
                      label="Banco:"
                    />
                  </v-col>
                  <v-col
                    md="4"
                    cols="4"
                  >
                    <v-text-field
                      readonly
                      v-model="id_cuenta.moneda"
                      label="Moneda:"
                    />
                  </v-col>
                  <v-col
                    md="4"
                    cols="4"
                  >
                    <v-text-field
                      readonly
                      v-model="id_cuenta.cuenta"
                      label="N° Cuenta:"
                    />
                  </v-col>
                  <v-col
                    md="4"
                    cols="4"
                  >
                    <v-text-field
                      readonly
                      v-model="id_cuenta.cci"
                      label="CCI:"
                    />
                  </v-col><v-col
                    md="4"
                    cols="4"
                  >
                    <v-text-field
                      v-model="comentarios"
                      label="Comentarios"
                      placeholder="Comentarios......"
                    />
                  </v-col>
                  <v-col
                    md="12"
                    cols="12"
                  >
                    <div class="text-right">
                      <v-btn
                        color="success"
                        :loading="loadingRegistro"
                        variant="text"
                        @click="registrarPago()"
                      >
                        PROCESAR PAGO
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-form>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style></style>

<!-- ----- pid_programend -->
