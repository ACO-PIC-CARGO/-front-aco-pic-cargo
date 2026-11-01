<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { usePermissions } from "@/composables/usePermissions";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import axios from "@/api/http";
import CustomTreeSelect from "./../comun/CustomTreeSelect.vue";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import { useBalancesStore } from "@/stores/balances";
import { useEnterprisesStore } from "@/stores/enterprises";
import { hasFailed, request } from "@/utils/request";
import {
  activeConcepts,
  conceptTotals,
  priceConcept,
  repriceConcept,
  repriceConcepts,
  type AccountConcept,
} from "@/utils/accountConcepts";
import type {
  ArchivoSoporte,
  ComprobanteCuenta,
  ConceptoNuevo,
  ExpedienteCuenta,
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
const appStore = useAppStore();
const { can } = usePermissions();
const balancesStore = useBalancesStore();
const enterprisesStore = useEnterprisesStore();
const InvoiceAdmin = computed(() => appStore.InvoiceAdmin);
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
const itemsProductos = ref<AccountConcept[]>([]);
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
type MonedaFila = (typeof appStore.itemsCoinsList)[number];
const id_coins = ref("" as unknown as MonedaFila);
const monto = ref("");
const igv = ref("");
const totals = computed(() => conceptTotals(itemsProductos.value));
const saving = ref(false);
const dialogPro = ref(false);
const id_month = ref<string | number>("");
const id_year = ref<string | number>("");
const errorGasto = ref("");
// id_subgasto: "",

const taxRate = () => Number(enterprisesStore.impuesto.impuesto) || 0;

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
    appStore.id_role_actual = 28;
    appStore.modalAdmin = !appStore.modalAdmin;
  } else if (radio.value == 2) {
    appStore.id_role_actual = 15;
    appStore.modalPro = !appStore.modalPro;
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
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getHouseListAll",
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
function recalcularMonto(prod: AccountConcept) {
  itemsProductos.value = repriceConcept(itemsProductos.value, prod, tipocambio.value, taxRate());
}
function cleanData() {
  radio.value = "";
  id_proveedor.value = "";
  fecha.value = "";
  nro_factura.value = "";
  nro_serie.value = "";
  id_coins.value = "" as unknown as MonedaFila;
  monto.value = "";
  igv.value = "";
  payPath.value = "";
  id_path.value = "";
  boolFile.value = false;
  facturaFlag.value = false;
  serieFlag.value = false;
}
function accountPayload() {
  return {
    type_payment: radio.value || null,
    id_expediente: id_expediente.value || null,
    id_proveedor: id_proveedor.value || null,
    fecha: date.value || null,
    nro_factura: nro_factura.value || null,
    nro_serie: nro_serie.value || null,
    id_coins: id_coins.value?.id ?? null,
    monto: totals.value.total,
    montodolar: totals.value.totaldolar,
    type_igv: igv.value || null,
    id_path: id_path.value || null,
    detalle: activeConcepts(itemsProductos.value),
    id_proformance: id_proformace.value?.id ?? null,
    id_month: id_month.value || null,
    id_year: id_year.value || null,
    tipocambio: tipocambio.value,
    id_gastos: id_gastos.value,
  };
}
async function saveAccount(method: "post" | "put", url: string, extra: Record<string, unknown> = {}) {
  if (!((await frmFactura.value!.validate()).valid && id_gastos.value)) {
    errorGasto.value = "Dato Requerido";
    return false;
  }
  Swal.fire({
    icon: "info",
    title: "Guardando...",
    text: "Por favor espere",
  });
  const answer = await request({
    method,
    url: import.meta.env.VITE_URL_MAIN + url,
    data: { ...accountPayload(), ...extra },
  });
  if (!answer.estadoflag) {
    Swal.fire({ icon: hasFailed(answer) ? "error" : "info", text: answer.mensaje });
    return false;
  }
  return true;
}
async function _setInvoice() {
  errorGasto.value = "";
  if (activeConcepts(itemsProductos.value).length == 0) {
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
  if (saving.value) return;
  saving.value = true;
  const saved = await saveAccount("post", "setInvoiceAdmin");
  saving.value = false;
  if (saved) {
    Swal.fire({
      icon: "success",
      title: "Documento Cargado",
      text: "El documento ha sido cargado correctamente",
    });
    router.back();
    cleanData();
  }
}
async function setUpdateInvoiceAdmin() {
  errorGasto.value = "";
  if (saving.value) return;
  saving.value = true;
  const saved = await saveAccount("put", "setUpdateInvoiceAdmin", { id: route.params.id });
  saving.value = false;
  if (saved) {
    Swal.fire({
      icon: "success",
      title: "Documento Cargado",
      text: "El documento ha sido actualizado correctamente",
    });
    router.push({
      name: "viewAccountPays",
      params: { id: route.params.id },
    });
  }
}
async function añadirProducto() {
  if (!(await validacionConcepto.value!.validate()).valid) return;

  itemsProductos.value.push(priceConcept({ ...producto.value, id: null }, tipocambio.value, taxRate()));
  dialog.value = false;
  producto.value = {
    concepto: "",
    monto: null,
    afecto: "true",
    total: 0,
  };
}
function eliminar(producto: AccountConcept) {
  producto.status = 0;
}
function cambiarTipodeCambio() {
  itemsProductos.value = repriceConcepts(itemsProductos.value, tipocambio.value, taxRate());
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
  const [account] = InvoiceAdmin.value;
  if (!account) {
    Swal.fire({
      icon: "info",
      text: "No encontramos esta cuenta por pagar. Vuelve a la lista y ábrela de nuevo.",
    });
    return;
  }
  const coin = appStore.itemsCoinsList.find((item) => item.id == (account.id_coins as unknown));
  const voucher = appStore.performances.find((item) => item.id == (account.id_proformance as unknown));
  id_proformace.value = (voucher ?? "") as unknown as ComprobanteCuenta;
  id_expediente.value = account.id_expediente;
  id_proveedor.value = account.id_proveedor;
  date.value = new Date(account.fecha)
    .toISOString()
    .substring(0, 10);
  nro_factura.value = account.nro_factura;
  nro_serie.value = account.nro_serie;
  id_coins.value = (coin ?? "") as MonedaFila;
  symbol.value = coin?.symbol ?? "";
  monto.value = account.monto;
  radio.value = account.type_payment;
  payPathName.value = account.originalname;
  id_path.value = account.id_path;
  payPath.value = account.path;
  id_month.value = account.id_month;
  id_year.value = account.id_year;
  tipocambio.value = account.tipocambio;
  id_gastos.value = account.id_subgasto;
  name_path.value = account.name_path;
  itemsProductos.value = account.details as unknown as AccountConcept[];
});
watch(radio, async () => {
  //  await this._getMasterList();

  if (itemsExpedientes.value.length == 0 && radio.value == 2) {
    appStore.spiner = true;
    await _getMasterList();
    appStore.spiner = false;
  }
});

onMounted(async () => {
  appStore.spiner = true;

  cleanData();

  await Promise.all([
    enterprisesStore.obtenerImpuestoXEmpresa(),
    appStore._getPerformance(),
    balancesStore.getArbolGastos(),
    appStore._getChargeMonth(),
    appStore._getChargeYear(),
    appStore._getCoinsList(),
    appStore._getProveedor(),
  ]);
  _valida();
  if (props.tipo == "ver" || props.tipo == "editar") {
    await appStore._getInvoiceAdmin(route.params.id as string);
  }
  setTimeout(() => {
    producto.value = {
      concepto: "",
      monto: null,
      afecto: "true",
      total: 0,
    };
  }, 600);
  appStore.spiner = false;
  appStore.drawer = false;
});
</script>

<template>
  <v-card elevation="0">
    <v-card-title v-if="tipo == 'ver'">
      VER FACTURA TIPO
      {{ radio == 1 ? "ADMINISTRATIVA" : "OPERATIVA" }}
    </v-card-title>
    <v-card-title v-else-if="tipo == 'editar'">
      EDITAR FACTURA TIPO
      {{ radio == 1 ? "ADMINISTRATIVA" : "OPERATIVA" }}
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
                  :items="appStore.month"
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
                  :items="Array.isArray(appStore.year) ? appStore.year : []"
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
              :items="appStore.performances"
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
              :items="appStore.itemsProveedorList"
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
              :items="appStore.itemsCoinsList"
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
                        @update:model-value="recalcularMonto(productos)"
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
                      {{ totals.monto.toFixed(2) }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{ totals.igv.toFixed(2) }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{ totals.total.toFixed(2) }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{ totals.montodolar.toFixed(2) }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{ totals.igvdolar.toFixed(2) }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{ totals.totaldolar.toFixed(2) }}
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
              v-if="tipo == 'nuevo' && can('controlAccountPays', 'NUEVO')"
              :loading="saving"
              :disabled="saving || activeConcepts(itemsProductos).length == 0"
              class="font-weight-bold text-uppercase"
            >
              GUARDAR CUENTA POR PAGAR
            </v-btn>

            <v-btn
              elevation="0"
              color="primary"
              size="large"
              v-if="tipo == 'editar' && can('controlAccountPays', 'MODIFICAR')"
              @click="setUpdateInvoiceAdmin()"
              :loading="saving"
              :disabled="saving || activeConcepts(itemsProductos).length == 0"
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


