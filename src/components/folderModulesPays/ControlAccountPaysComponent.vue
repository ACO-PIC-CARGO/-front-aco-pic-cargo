<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import CustomTreeSelect from "./../comun/CustomTreeSelect.vue";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import { useBalancesStore } from "@/stores/balances";
import { useEnterprisesStore } from "@/stores/enterprises";
import { sessionBranchId } from "@/utils/sesion";
import type {
  ArchivoSoporte,
  ComprobanteCuenta,
  ConceptoCuenta,
  ConceptoNuevo,
  ExpedienteCuenta,
  MonedaCuenta,
  TotalCuenta,
} from "@/types/modulesPays";

const props = defineProps<{
  operativa?: string | number;
  exp?: string | number;
  pro?: string | number;
  // eslint-disable-next-line vue/prop-name-casing
  id_pro?: string | number;
  tipo?: string;
}>();

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const balancesStore = useBalancesStore();
const enterprisesStore = useEnterprisesStore();
const InvoiceAdmin = computed(() => rootStore.state.InvoiceAdmin);
const frmFactura = useTemplateRef("frmFactura");
const validacionConcepto = useTemplateRef("validacionConcepto");

const date = ref(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10));
const id_gastos = ref<number | null>(null);
const dialog = ref(false);
const radio = ref<string | number>("");
const payfile = ref<File[]>([]);
const payPath = ref<string | null>("");
const id_path = ref<string | number | null>("");
const tipocambio = ref(1);
const payPathName = ref("");
const boolFile = ref(false);
const itemsExpedientes = ref<ExpedienteCuenta[]>([]);
const itemsProformace = ref<unknown[]>([]);
const itemsProductos = ref<ConceptoCuenta[]>([]);
const name_path = ref("");
const producto = ref({} as ConceptoNuevo);
const facturaFlag = ref(false);
const serieFlag = ref(false);
const id_proformace = ref("" as unknown as ComprobanteCuenta);
const symbol = ref("");
const id_expediente = ref<string | number>("");
const id_proveedor = ref<string | number>("");
const fecha = ref("");
const nro_factura = ref("");
const nro_serie = ref("");
const id_coins = ref("" as unknown as MonedaCuenta);
const monto = ref("");
const igv = ref("");
const total = ref<TotalCuenta>({
  monto: 0,
  total: 0,
});
const dialogPro = ref(false);
const id_month = ref<string | number>("");
const id_year = ref<string | number>("");
const errorGasto = ref("");
// id_subgasto: "",

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let itemsInvoice: unknown;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let dialogInvoice: boolean;

function recibirId(file: ArchivoSoporte) {
  if (Object.keys(file).length > 0) {
    payPath.value = file.id as string;
    id_path.value = file.id as string | number;
  } else {
    payPath.value = null;
    id_path.value = null;
  }
}
function validarMonto(v: string | number) {
  if (!v) return "Dato Requerido";

  if (id_proformace.value.code === "07") {
    return Number(v) !== 0 || "El monto no puede ser cero";
  }
  return Number(v) > 0 || "Monto Mayor que 0.00";
}
// Shadowed by the later abrirDialogNuevoProducto, so it never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirDialogNuevoProductoSombreado() {
  if (!id_coins.value) {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Es necesario seleccionar una moneda.",
    });
    return false;
  }
  dialog.value = true;
}
function abrirDialogNuevoProducto() {
  if (!id_proformace.value) {
    Swal.fire({
      icon: "warning",
      title: "Tipo de Comprobante Requerido",
      html: `
      <div style="text-align: left; font-size: 14px; color: #555; line-height: 1.5;">
        <p style="margin-bottom: 8px;">No se ha especificado el tipo de documento asociado.</p>
        <p style="margin: 0;"><b>Es necesario seleccionar un tipo de documento o proforma</b> para continuar con el registro del comprobante.</p>
      </div>
    `,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#3085d6",
    });
    return false;
  }
  if (!id_coins.value) {
    Swal.fire({
      icon: "warning",
      title: "Selección de Moneda Requerida",
      html: `
      <div style="text-align: left; font-size: 14px; color: #555; line-height: 1.5;">
        <p style="margin-bottom: 8px;">No se ha especificado la divisa para esta transacción.</p>
        <p style="margin: 0;"><b>Es necesario seleccionar una moneda</b> para calcular correctamente los montos y conversiones del registro.</p>
      </div>
    `,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#3085d6",
    });
    return false;
  }

  if (symbol.value !== "USD" && tipocambio.value <= 1) {
    Swal.fire({
      icon: "warning",
      title: "Validación de Tipo de Cambio",
      html: `
      <div style="text-align: left; font-size: 14px; color: #555; line-height: 1.5;">
        <p style="margin-bottom: 8px;">Se ha detectado una operación en moneda extranjera sin conversión válida.</p>
        <p style="margin: 0;"><b>Es necesario registrar un tipo de cambio mayor a 1</b> para continuar con el proceso de registro.</p>
      </div>
    `,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  dialog.value = true;
}
function _valida() {
  if (props.operativa == 1) {
    radio.value = 2;
    _getMasterList();
    id_expediente.value = props.exp!;
    _getProformace();
    id_proformace.value = props.pro as unknown as ComprobanteCuenta;
    id_proveedor.value = props.id_pro!;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sendData() {
  id_proveedor.value = id_proformace.value.id_proveedor;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sendPro(id: ComprobanteCuenta, idPro: number) {
  id_proformace.value = id;
  id_proveedor.value = idPro;
  dialogPro.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _callModalEntitie() {
  if (radio.value == 1) {
    rootStore.state.id_role_actual = 28;
    rootStore.state.modalAdmin = !rootStore.state.modalAdmin;
  } else if (radio.value == 2) {
    rootStore.state.id_role_actual = 15;
    rootStore.state.modalPro = !rootStore.state.modalPro;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _uploadFile() {
  const data = new FormData();
  if (radio.value == 1) {
    data.append("name", "Factura Administrativa");
  } else if (radio.value == 2) {
    data.append("name", "Factura Operativa");
  }

  data.append("file", payfile.value as unknown as Blob);

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      boolFile.value = true;
      payPath.value = response.data.data[0].insertid;
      id_path.value = response.data.data[0].insertid;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getMasterList() {
  const data = {
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getHouseListAll",
    data: data,
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsExpedientes.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getProformace() {
  const data = {
    id_house: id_expediente.value,
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getListInvoiceExp",

    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      itemsProformace.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function recalcularMonto(prod: ConceptoCuenta, index: number) {
  console.log("prod", prod);
  let igv = 0;
  let igvdolar = 0;
  let total = parseFloat(String(prod.monto));
  const montodolar = parseFloat(String((prod.monto as number) / tipocambio.value));
  let totaldolar = parseFloat(String((prod.monto as number) / tipocambio.value));
  // ------------------------------
  if (prod.afecto == "true" || prod.afecto == 1) {
    igv =
      (parseFloat(String(prod.monto)) *
        enterprisesStore.impuesto.impuesto!) /
      100;

    igvdolar = parseFloat(String(igv / tipocambio.value));

    totaldolar += parseFloat(String(igvdolar));
    console.log("totaldolar", totaldolar);
    total += parseFloat(String(igv));
  }
  // ------------------------------

  const producto = {
    id: prod.id,
    concepto: prod.concepto,
    monto: prod.monto,
    montodolar: parseFloat(String(montodolar)).toFixed(2),
    igv: parseFloat(String(igv)).toFixed(2),
    igvdolar: parseFloat(String(igvdolar)).toFixed(2),
    afecto: prod.afecto,
    status: 1,
    total: total,
    totaldolar: totaldolar,
  };

  // Usar Vue.set para actualizar reactividad en Vue 2
  itemsProductos.value[index] = { ...producto };

  // console.log(
  //   "Producto después de actualizar:",
  //   this.itemsProductos[index]
  // );
}
function cleanData() {
  radio.value = "";
  id_proveedor.value = "";
  fecha.value = "";
  nro_factura.value = "";
  nro_serie.value = "";
  id_coins.value = "" as unknown as MonedaCuenta;
  monto.value = "";
  igv.value = "";
  total.value = "" as unknown as TotalCuenta;
  payPath.value = "";
  id_path.value = "";
  boolFile.value = false;
  facturaFlag.value = false;
  serieFlag.value = false;
}
async function _setInvoice() {
  errorGasto.value = "";
  if (itemsProductos.value.length == 0) {
    Swal.fire({
      icon: "error",
      title: "Aviso",
      text: "Debes cargar el concepto a pagar y su monto para poder registrar la factura.",
      allowEnterKey: false,
      allowOutsideClick: false,
    }).then((res) => {
      if (res.isConfirmed) {
        dialog.value = true;
      }
    });
    return false;
  }
  if ((await frmFactura.value!.validate()).valid && id_gastos.value) {
    Swal.fire({
      icon: "info",
      title: "Guardando...",
      text: "Por favor espere",
    });

    const data = {
      type_payment: radio.value || radio.value != "" ? radio.value : null,
      id_expediente:
        id_expediente.value || id_expediente.value != ""
          ? id_expediente.value
          : null,
      id_proveedor:
        id_proveedor.value || id_proveedor.value != "" ? id_proveedor.value : null,
      fecha: date.value || date.value != "" ? date.value : null,
      nro_factura:
        nro_factura.value || nro_factura.value != "" ? nro_factura.value : null,
      nro_serie: nro_serie.value || nro_serie.value != "" ? nro_serie.value : null,
      id_coins:
        id_coins.value.id || id_coins.value.id != "" ? id_coins.value.id : null,
      monto: total.value.total || total.value.total != "" ? total.value.total : null,
      montodolar:
        total.value.totaldolar || total.value.totaldolar != ""
          ? total.value.totaldolar
          : null,
      type_igv: igv.value || igv.value != "" ? igv.value : null,
      total: total.value.total || total.value.total != "" ? total.value.total : null,
      id_path: id_path.value || id_path.value != "" ? id_path.value : null,
      detalle: itemsProductos.value.filter((v) => v.status == 1),
      id_proformance:
        id_proformace.value.id || id_proformace.value.id != ""
          ? id_proformace.value.id
          : null,
      id_month: id_month.value || id_month.value != "" ? id_month.value : null,
      id_year: id_year.value || id_year.value != "" ? id_year.value : null,
      status: 1,
      tipocambio: tipocambio.value,
      id_gastos: id_gastos.value,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "setInvoiceAdmin",

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        itemsInvoice = response.data.data;

        Swal.fire({
          icon: "success",
          title: "Documento Cargado",
          text: "El documento ha sido cargado correctamente",
        });

        if (radio.value == 1 && (id_proformace.value as unknown as number) > 0) {
          putPro();
        } else {
          router.back();
          cleanData();
        }

        rootStore.dispatch("_getInvoice");
        dialogInvoice = false;
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    errorGasto.value = "Dato Requerido";
  }
}
async function setUpdateInvoiceAdmin() {
  errorGasto.value = "";
  if ((await frmFactura.value!.validate()).valid && id_gastos.value) {
    Swal.fire({
      icon: "info",
      title: "Guardando...",
      text: "Por favor espere",
    });

    const data = {
      type_payment: radio.value,
      id_expediente: id_expediente.value,
      id_proveedor: id_proveedor.value,
      fecha: date.value,
      nro_factura: nro_factura.value,
      nro_serie: nro_serie.value,
      id_coins: id_coins.value.id ? id_coins.value.id : id_coins.value,
      monto: total.value.total,
      montodolar: total.value.montodolar,
      type_igv: igv.value,
      //igv: vm.,
      total: total.value.total,
      status: 1,
      id_path: id_path.value,
      detalle: itemsProductos.value.filter((v) => v.status == 1),
      id_proformance: id_proformace.value,
      id_month: id_month.value,
      id_year: id_year.value,
      id: route.params.id,
      tipocambio: tipocambio.value,
      id_gastos: id_gastos.value,
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "setUpdateInvoiceAdmin",

      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        itemsInvoice = response.data;
        console.log(response.data.data)
        if (response.data.data[0].estadoflag) {
          Swal.fire({
            icon: "success",
            title: "Documento Cargado",
            text: "El documento ha sido actualizado correctamente",
          });
        }

        router.push({
          name: "viewAccountPays",
          params: { id: route.params.id },
        });
        // vm._getInvoice();
        dialogInvoice = false;
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    errorGasto.value = "Dato Requerido";
  }
}
async function putPro() {
  const data = {
    id_path: id_path.value,
    id_proformace: id_proformace.value,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "putPro",

    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      cleanData();

      rootStore.dispatch("_getInvoice");
      router.back();
      dialogInvoice = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function añadirProducto() {
  if (!(await validacionConcepto.value!.validate()).valid) return;

  let igv = 0;
  let igvdolar = 0;
  let total = parseFloat(String(producto.value.monto));
  const montodolar = parseFloat(String((producto.value.monto as number) / tipocambio.value));
  let totaldolar = parseFloat(String((producto.value.monto as number) / tipocambio.value));
  // ------------------------------
  if (producto.value.afecto == "true" || producto.value.afecto == 1) {
    igv =
      (parseFloat(String(producto.value.monto)) *
        enterprisesStore.impuesto.impuesto!) /
      100;

    igvdolar = parseFloat(String(igv / tipocambio.value));

    totaldolar += parseFloat(String(igvdolar));
    console.log("totaldolar", totaldolar);
    total += parseFloat(String(igv));
  }
  // ------------------------------

  const productoNuevo = {
    id: null,
    concepto: producto.value.concepto,
    monto: producto.value.monto,
    montodolar: parseFloat(String(montodolar)).toFixed(2),
    igv: parseFloat(String(igv)).toFixed(2),
    igvdolar: parseFloat(String(igvdolar)).toFixed(2),
    afecto: producto.value.afecto,
    status: 1,
    total: total,
    totaldolar: totaldolar,
  };

  itemsProductos.value.push(productoNuevo);
  dialog.value = false;
  producto.value = {
    concepto: "",
    monto: null,
    afecto: true,
    total: 0,
  };

  calculcularTotal();
}
function eliminar(producto: ConceptoCuenta) {
  itemsProductos.value.filter((v) => v == producto)[0]!.status = 0;
  setTimeout(() => {
    calculcularTotal();
  }, 200);
}
function calculcularTotal() {
  const totalF = {
    monto: 0,
    igv: 0,
    total: 0,
    montodolar: 0,
    igvdolar: 0,
    totaldolar: 0,
  };
  itemsProductos.value
    .filter((v) => v.status == 1)
    .forEach((element) => {
      totalF.monto += parseFloat(String(element.monto));
      totalF.igv += parseFloat(element.igv);
      totalF.total += parseFloat(String(element.total));
      totalF.montodolar += parseFloat(element.montodolar);
      totalF.igvdolar += parseFloat(element.igvdolar);
      totalF.totaldolar += parseFloat(String(element.totaldolar));
    });

  total.value = totalF;
}
function cambiarTipodeCambio() {
  itemsProductos.value.forEach((element) => {
    recalcularMonto(element, itemsProductos.value.indexOf(element));
  });

  calculcularTotal();
}
function validacionesRequeridas() {
  switch (id_proformace.value.code) {
    case "002":
      facturaFlag.value = true;
      serieFlag.value = true;
      break;

    default:
      facturaFlag.value = false;
      serieFlag.value = false;
      break;
  }
}
function obtenerPrefixCoins() {
  symbol.value = id_coins.value.symbol;
  tipocambio.value = 1;
  cambiarTipodeCambio();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validarFormulario() {
  let mensaje = "";
  let validacion = true;
  if (radio.value == "") {
    mensaje += " Seleccione una opcion Administrativa / Operativa.";
    validacion = false;
  } else {
    if ((id_month.value == "" || id_year.value == "") && radio.value == 1) {
      mensaje += "Seleccione un mes y año correspondiente a la factura.";
      validacion = false;
    }
    if (
      (facturaFlag.value && nro_factura.value == "") ||
      (serieFlag.value && nro_serie.value == "")
    ) {
      mensaje += "La factura y el número de serie son requerido.";
      validacion = false;
    }

    if (itemsProductos.value.length == 0) {
      mensaje +=
        " Para guardar la factura se necesita al menos un producto/ concepto.";
      validacion = false;
    }
  }
  if (validacion == false) {
    Swal.fire({
      icon: "error",
      title: "Advertencia...",
      text: mensaje,
    });
  }

  return validacion;
}
function mostrarColumna() {
  if (symbol.value == "USD") {
    return false;
  }
  return true;
}

watch(InvoiceAdmin, () => {
  id_proformace.value = InvoiceAdmin.value[0].id_proformace;
  id_expediente.value = InvoiceAdmin.value[0].id_expediente;
  id_proveedor.value = InvoiceAdmin.value[0].id_proveedor;
  date.value = new Date(InvoiceAdmin.value[0].fecha)
    .toISOString()
    .substring(0, 10);
  nro_factura.value = InvoiceAdmin.value[0].nro_factura;
  nro_serie.value = InvoiceAdmin.value[0].nro_serie;
  id_coins.value = InvoiceAdmin.value[0].id_coins;
  monto.value = InvoiceAdmin.value[0].monto;
  radio.value = InvoiceAdmin.value[0].type_payment;
  payPathName.value = InvoiceAdmin.value[0].originalname;
  id_path.value = InvoiceAdmin.value[0].id_path;
  payPath.value = InvoiceAdmin.value[0].path;
  id_path.value = InvoiceAdmin.value[0].id_path;
  id_proformace.value = InvoiceAdmin.value[0].id_proformance;
  id_month.value = InvoiceAdmin.value[0].id_month;
  id_year.value = InvoiceAdmin.value[0].id_year;
  tipocambio.value = InvoiceAdmin.value[0].tipocambio;
  id_gastos.value = InvoiceAdmin.value[0].id_subgasto;
  id_gastos.value = InvoiceAdmin.value[0].id_subgasto;
  name_path.value = InvoiceAdmin.value[0].name_path;
  // DETALLES
  itemsProductos.value = InvoiceAdmin.value[0].details;

  calculcularTotal();
  // setTimeout(async () => {
  //   await this._getProveedor();
  // }, 200);
});
watch(radio, async () => {
  //  await this._getMasterList();

  if (itemsExpedientes.value.length == 0 && radio.value == 2) {
    rootStore.state.spiner = true;
    await _getMasterList();
    rootStore.state.spiner = false;
  }
});

onMounted(async () => {
  rootStore.state.spiner = true;

  cleanData();

  await Promise.all([
    enterprisesStore.obtenerImpuestoXEmpresa(),
    rootStore.dispatch("_getPerformance"),
    balancesStore.getArbolGastos(),
    rootStore.dispatch("_getChargeMonth"),
    rootStore.dispatch("_getChargeYear"),
    rootStore.dispatch("_getCoinsList"),
    rootStore.dispatch("_getProveedor"),
  ]);
  _valida();
  if (props.tipo == "ver" || props.tipo == "editar") {
    await rootStore.dispatch("_getInvoiceAdmin", route.params.id);
  }
  setTimeout(() => {
    producto.value = {
      concepto: "",
      monto: null,
      afecto: "true",
      total: 0,
    };
  }, 600);
  rootStore.state.spiner = false;
  rootStore.state.drawer = false;
});
</script>

<template>
  <v-card elevation="0">
    <v-card-title v-if="tipo == 'ver'">
      VER FACTURA TIPO
      {{ radio == 1 ? "ADMNINISTRATIVA" : "OPERATIVA" }}
    </v-card-title>
    <v-card-title v-if="tipo == 'editar'">
      EDITAR FACTURA TIPO
      {{ radio == 1 ? "ADMNINISTRATIVA" : "OPERATIVA" }}
    </v-card-title>
    <v-card-title v-else>
      CARGAR UNA CUENTA POR PAGAR
    </v-card-title>
    <v-card-text>
      <v-radio-group
        v-model="radio"
        inline
        v-if="tipo == 'nuevo'"
      >
        <v-radio
          value="1"
          label="Administrativa"
        />
        <v-radio
          value="2"
          label="Operativa"
        />
      </v-radio-group>
      <v-form ref="frmFactura">
        <v-row density="compact">
          <v-col
            cols="12"
            md="6"
            v-if="radio == 2"
          >
            <!-- @vue-expect-error radio is narrowed to a number inside this v-if -->
            <v-autocomplete
              :items="itemsExpedientes"
              item-title="namelong"
              item-value="id"
              label="Expediente"
              v-model="id_expediente"
              :disabled="radio == ''"
              @update:model-value="_getProformace()"
              :rules="[(v) => !!v || 'Datos Requerido']"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
            v-if="radio == 1"
          >
            <v-row density="compact">
              <v-col
                cols="12"
                md="6"
              >
                <!-- @vue-expect-error radio is narrowed to a number inside this v-if -->
                <v-autocomplete
                  :items="rootStore.state.month"
                  item-title="description"
                  item-value="id"
                  label="Mes del Gasto"
                  v-model="id_month"
                  :disabled="radio == ''"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <!-- @vue-expect-error radio is narrowed to a number inside this v-if -->
                <v-autocomplete
                  :items="Array.isArray(rootStore.state.year) ? rootStore.state.year : []"
                  item-title="description"
                  item-value="id"
                  label="Año del Gasto"
                  v-model="id_year"
                  :disabled="radio == ''"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                />
              </v-col>
            </v-row>
          </v-col>
          <v-col
            cols="12"
            md="6"
            class="pb-0"
          >
            <custom-tree-select
              v-model="id_gastos"
              :options="balancesStore.arbolGastos"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :disabled="radio == ''"
              :outlined="false"
              :dense="false"
              placeholder="Seleccione un Sub Gasto"
              search-nested
              :disable-branch-nodes="true"
              :multiple="false"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              :items="rootStore.state.performances"
              item-title="description"
              item-value="id"
              label="Tipo de Comprobante"
              v-model="id_proformace"
              :disabled="radio == ''"
              @update:model-value="validacionesRequeridas()"
              return-object
              :rules="[(v) => !!v || 'Datos Requerido']"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              :items="rootStore.state.itemsProveedorList"
              item-title="namelong"
              item-value="id"
              label="Proveedor"
              v-model="id_proveedor"
              :disabled="radio == ''"
              :rules="[(v) => !!v || 'Datos Requerido']"
            />
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              type="date"
              :disabled="radio == ''"
              label="Fecha Emisión de la Factura"
              v-model="date"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="nro_factura"
              :disabled="radio == ''"
              label="Nro. de Factura"
              :rules="[(v) => !!v || 'Datos Requerido']"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="nro_serie"
              :disabled="radio == ''"
              label="Nro. de Serie"
              :rules="[(v) => !!v || 'Datos Requerido']"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              :disabled="radio == ''"
              :items="rootStore.state.itemsCoinsList"
              v-model="id_coins"
              item-title="acronym"
              item-value="id"
              label="Moneda"
              return-object
              @update:model-value="obtenerPrefixCoins()"
              :rules="[(v) => !!v || 'Datos Requerido']"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              type="number"
              label="Tipo de Cambio"
              v-model="tipocambio"
              :disabled="radio == ''"
              @update:model-value="cambiarTipodeCambio()"
              v-if="id_coins && symbol != 'USD'"
            />
          </v-col>

          <!-- SECCIÓN CONCEPTOS DE PAGO -->
          <v-col
            cols="12"
            class="mt-4"
          >
            <v-card
              border
              color="#f2f8fd"
              class="pa-4 rounded-lg"
              style="border: 1.5px solid #a8d5e5 !important"
            >
              <!-- Encabezado con Icono -->
              <div class="d-flex align-center mb-2">
                <v-avatar
                  color="white"
                  size="36"
                  class="mr-3 elevation-1"
                >
                  <v-icon color="#009688">
                    mdi-file-document-outline
                  </v-icon>
                </v-avatar>
                <span
                  class="text-body-large font-weight-bold"
                  style="letter-spacing: 0.5px"
                >
                  CONCEPTOS DE PAGO
                </span>
              </div>

              <!-- Alerta Informativa -->
              <div
                class="d-flex align-center mb-4 pl-1"
                v-if="tipo !== 'ver'"
              >
                <v-icon
                  color="orange-darken-2"
                  size="small"
                  class="mr-1"
                >
                  mdi-alert-circle-outline
                </v-icon>
                <span
                  class="text-body-small text-uppercase font-weight-bold text-orange-darken-3"
                >
                  OBLIGATORIO:
                </span>
                <span class="text-body-small text-grey-darken-2 ml-1">
                  Añade al menos un concepto para continuar.
                </span>
              </div>

              <!-- Botón Añadir Concepto -->
              <v-btn
                block
                color="#009688"
                size="x-large"
                elevation="0"
                class="text-uppercase font-weight-bold my-2"
                @click="abrirDialogNuevoProducto()"
                v-if="tipo !== 'ver'"
              >
                <v-icon start>
                  mdi-plus
                </v-icon>
                Añadir Concepto de Pago
              </v-btn>

              <!-- Tabla de Conceptos (Muestra si existen registros activos) -->
              <v-table
                density="compact"
                v-if="itemsProductos.filter((v) => v.status == 1).length > 0"
                class="mt-4 bg-white rounded"
              >
                <thead>
                  <tr>
                    <th v-if="tipo != 'ver'">
                      Acciones
                    </th>
                    <th>Producto / Concepto</th>
                    <th style="background: #adcaf5">
                      Monto
                    </th>
                    <th style="background: #adcaf5">
                      {{ enterprisesStore.impuesto.nombre_impuesto }}
                    </th>
                    <th style="background: #adcaf5">
                      Total
                    </th>
                    <th
                      v-if="mostrarColumna()"
                      style="background: #c7f7d7"
                    >
                      Monto (USD)
                    </th>
                    <th
                      v-if="mostrarColumna()"
                      style="background: #c7f7d7"
                    >
                      {{
                        enterprisesStore.impuesto.nombre_impuesto
                      }}(USD)
                    </th>
                    <th
                      v-if="mostrarColumna()"
                      style="background: #c7f7d7"
                    >
                      Total (USD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(productos, index) in itemsProductos.filter(
                      (v) => v.status == 1,
                    )"
                    :key="index"
                  >
                    <td v-if="tipo != 'ver'">
                      <v-btn
                        variant="text"
                        icon
                        color="red"
                        size="x-small"
                        @click="eliminar(productos)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                    <td>
                      <v-text-field
                        v-model="productos.concepto"
                        density="compact"
                        hide-details="auto"
                        variant="outlined"
                      />
                    </td>
                    <td>
                      <span v-if="tipo == 'ver'">{{ productos.monto }}</span>
                      <v-text-field
                        v-else
                        type="number"
                        v-model="productos.monto"
                        step="0.01"
                        @update:model-value="recalcularMonto(productos, index)"
                        style="max-width: 150px"
                        variant="outlined"
                        density="compact"
                        hide-details
                        :prefix="symbol"
                      />
                    </td>
                    <td v-if="productos.id != null">
                      {{ symbol }} {{ productos.igv }}
                    </td>
                    <td v-else>
                      {{ symbol }} {{ productos.igv }}
                    </td>
                    <td>
                      {{ symbol }} {{ parseFloat(String(productos.total)).toFixed(2) }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ productos.montodolar }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ productos.igvdolar }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ parseFloat(String(productos.totaldolar)).toFixed(2) }}
                    </td>
                  </tr>
                  <!-- Fila Totales -->
                  <tr class="font-weight-bold">
                    <td v-if="tipo != 'ver'" />
                    <td>Total:</td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(String(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(String(producto.monto || 0)),
                              0,
                            ),
                        )).toFixed(2)
                      }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(String(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(String(producto.igv || 0)),
                              0,
                            ),
                        )).toFixed(2)
                      }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(String(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(String(producto.total || 0)),
                              0,
                            ),
                        )).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(String(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(String(producto.montodolar || 0)),
                              0,
                            ),
                        )).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(String(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(String(producto.igvdolar || 0)),
                              0,
                            ),
                        )).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(String(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(String(producto.totaldolar || 0)),
                              0,
                            ),
                        )).toFixed(2)
                      }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
          <v-col cols="12">
            <!-- @vue-expect-error payPath can be null and holds the numeric file id -->
            <ArrastraYSolarComponent
              :initial-url="payPath"
              :initial-id="id_path"
              :read-only="tipo === 'ver'"
              :rules="[(v) => !!v || 'El archivo soporte es obligatorio']"
              @id-archivo-cargado="recibirId"
            />
          </v-col>
          <!-- ACCIONES (Botón inferior alineado a la derecha) -->
          <v-col
            cols="12"
            class="d-flex flex-column align-end mt-2"
          >
            <!-- Texto de ayuda dinámico -->
            <span
              v-if="
                itemsProductos.length == 0 &&
                  (tipo == 'nuevo' || tipo == 'editar')
              "
              class="text-body-small text-grey-darken-1 mb-2"
            >
              Primero añade un concepto de pago.
            </span>

            <!-- Botones de Acción -->
            <v-btn
              elevation="0"
              @click="_setInvoice()"
              color="primary"
              size="large"
              v-if="tipo == 'nuevo'"
              :disabled="itemsProductos.length == 0"
              class="font-weight-bold text-uppercase"
            >
              GUARDAR CUENTA POR PAGAR
            </v-btn>

            <v-btn
              elevation="0"
              color="primary"
              size="large"
              v-if="tipo == 'editar'"
              @click="setUpdateInvoiceAdmin()"
              :disabled="itemsProductos.length == 0"
              class="font-weight-bold text-uppercase"
            >
              GUARDAR CAMBIOS
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
    <v-dialog
      v-model="dialog"
      persistent
      :overlay="false"
      max-width="25%"
      transition="dialog-transition"
      class="mx-5"
    >
      <v-card>
        <v-card-title primary-title>
          Cargar Conceptos a Pagar
        </v-card-title>
        <v-form ref="validacionConcepto">
          <v-row class="ma-3">
            <v-col
              cols="12"
              md="12"
            >
              <v-text-field
                placeholder="Descripción"
                label="Producto/ Concepto"
                v-model="producto.concepto"
                :rules="[(v) => !!v || 'Dato Requerido']"
                required
              />
            </v-col>
            <v-col
              cols="12"
              md="12"
            >
              <v-text-field
                placeholder="0.00"
                label="Monto"
                v-model="producto.monto"
                type="number"
                :prefix="symbol"
                :rules="[validarMonto]"
              />
            </v-col>
            <v-col
              cols="12"
              md="12"
            >
              <v-radio-group
                inline
                v-model="producto.afecto"
              >
                <v-radio
                  label="Afecto"
                  value="true"
                />
                <v-radio
                  label="No Afecto"
                  value="false"
                />
              </v-radio-group>
            </v-col>
            <v-col
              cols="12"
              md="12"
            >
              <v-btn
                color="success"
                class="mx-1"
                size="small"
                @click="añadirProducto()"
              >
                Aceptar
              </v-btn>
              <v-btn
                color="warning"
                class="mx-1"
                size="small"
                @click="dialog = false"
              >
                Cancelar
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>


