<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from "@/api/http";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import { useBankStore } from "@/stores/bank";
import { useFilesStore } from "@/stores/files";
import type { CuentaDestinoCliente, DetallePagoCliente } from "@/types/banks";
import type { ClienteRaiz } from "@/types/app";
import { sessionBranchId } from "@/utils/sesion";

const props = defineProps<{ tipo?: string }>();

const appStore = useAppStore();
const route = useRoute();
const filesStore = useFilesStore();
const bankStore = useBankStore();
const listPagosXProveedorCxP = computed<DetallePagoCliente[]>(() => appStore.listPagosXProveedorCxP);
const clientes = computed(() => appStore.clientes);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let msgfile: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let errfile: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadingFile: boolean | undefined;
// Not defined anywhere, so calling it throws.
const _uploadFile = undefined as unknown as (file?: File[]) => Promise<void>;

const errorNroOperacion = ref("");
const loading = ref(false);
const date = ref("");
const payfile = ref<File[]>([]);
const selected = ref<DetallePagoCliente[]>([]);
const id_coins = ref<number | string>("");
const payPath = ref("");
const id_proveedor = ref<ClienteRaiz>("" as unknown as ClienteRaiz);
const boolFile = ref(false);
const cuentas = ref<CuentaDestinoCliente[]>([]);
const id_cuenta = ref<CuentaDestinoCliente>("" as unknown as CuentaDestinoCliente);
const tab = ref<string | null>(null);
const total = ref<number | string>(0);
const step2 = ref(true);
const name_path = ref("");
const url_documento = ref("");
const totalPagado = ref(0);
const nro_operacion = ref("");
const id_banco_origen = ref<number | string>("");
const successMessages = ref("");
const headers = [
  {
    title: "Fecha",
    key: "fecha",
  },

  {
    title: "House",
    key: "codigo_house",
  },

  {
    title: "Cliente Pagó",
    key: "statuspago",
  },
  {
    title: "Monto Dolar",
    key: "monto_pagar",
  },

  {
    title: "Monto Moneda Banco",
    key: "maxpagar",
  },

  {
    title: "Moneda",
    key: "moneda",
  },
  {
    title: "Tipo Cambio",
    key: "tipocambio",
  },
  {
    title: "Pago Parcial",
    key: "montopagar",
  },
];

const symbol = computed(() => {
  let symbol = "";
  if (id_coins.value) {
    symbol = appStore.itemsCoinsList.filter(
      (v: { id: number }) => v.id == id_coins.value,
    )[0]!.symbol;
  }
  return symbol;
});

function validarAprobacion(obj: { value?: unknown }) {
  if (obj.value) {
  }
}
async function ValidateNroOperacion() {
  errorNroOperacion.value = "";
  successMessages.value = "";
  const data = {
    nro_operacion: nro_operacion.value,
    id_branch: sessionBranchId(),
  };
  const res = await bankStore.validateNroOperacion(data);
  if (!!res!.estadoflag) {
    errorNroOperacion.value = res!.mensaje;
    document.getElementById("nro_operacion")!.focus();
  }
  if (res!.mensaje) {
    successMessages.value = `Existen Operaciones con Nro(s) Similiares: ${res!.mensaje}`;
  }
}
async function obtenerListado() {
  appStore.listPagosXProveedorCxP.listPagosXProveedorCxP = [];
  date.value = "";
  payfile.value = [];
  boolFile.value = false;
  id_cuenta.value = "" as unknown as CuentaDestinoCliente;
  id_banco_origen.value = "";
  nro_operacion.value = "";
  if (id_proveedor.value.id && props.tipo == "nuevo") {
    await appStore._getListaPagosXProveedorCxC(id_proveedor.value.id);
  } else {
    selected.value = [];
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
function validarMonto(details: DetallePagoCliente) {
  if (parseFloat(String(details.max_pagar)) < parseFloat(String(details.monto_deuda))) {
    document.getElementById(`pago${details.id}`)!.focus();
  } else {
    calcularTotal();
  }
}
function calcularMonto() {
  if (selected.value.length > 0) {
    selected.value.forEach((element) => {
      console.log(element);
      id_coins.value = element.id_coins;
      // @ts-expect-error symbol is a read-only computed
      symbol.value = appStore.itemsCoinsList.filter(
        (v: { id: number }) => v.id == selected.value[0]!.id_coins,
      )[0].symbol;
      element.montopagar = parseFloat(String(element.monto_deuda)).toFixed(2);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (element.montopagar as unknown as number) > (element.max_pagar as number)
        ? (element.err = "Monto Superior a la deuda ")
        : (element.err = "");
    });
    calcularTotal();
  }
}
function calcularTotal() {
  let sum = 0;
  selected.value.forEach((element) => {
    sum += parseFloat(String(element.montopagar));
  });
  total.value = parseFloat(String(sum)).toFixed(2);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function uploadFile() {
  msgfile = "";
  errfile = "";
  if (payfile.value) {
    loadingFile = true;
    await _uploadFile(payfile.value);
    loadingFile = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filesStore.payPath
      ? (msgfile = "Archivo cargado")
      : (errfile = "Comuniquese con el admistrador");
  } else {
    errfile = "Dato Requerido";
  }
}
function validar(registro = false) {
  let validacion = true;
  let msg = "";
  listPagosXProveedorCxP.value.forEach((element) => {
    let monto_deuda: number | string = 0;
    monto_deuda = parseFloat(String(element.monto_deuda)).toFixed(2);
    let max_pagar: number | string = 0;
    max_pagar = parseFloat(String(element.max_pagar)).toFixed(2);

    if (parseFloat(String(monto_deuda)) > parseFloat(String(max_pagar))) {
      validacion = false;
      msg = "No puede realizar un pago mayor a la deuda. ";
    }
  });

  if (!id_cuenta.value && registro) {
    validacion = false;
    msg += "Por favor, seleccione una cuenta. ";
  }

  if (selected.value.length == 0) {
    validacion = false;
    msg += "Seleccione al menos una cuenta a pagar. ";
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
async function _putPayForProveedor() {
  if (
    filesStore.payPath == 0 ||
    !filesStore.payPath
  ) {
    Swal.fire({
      icon: "warning",
      title: "Soporte de Pago",
      text: "SE SUGIERE GUARDAR EL SOPORTE DE PAGO POR FAVOR ANEXARLO",
      confirmButtonText: "Continuar, sin soporte",
      cancelButtonText: "Cancelar",
      showDenyButton: false,
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: true,
      cancelButtonColor: "#B71C1C",
    }).then((res) => {
      if (res.isConfirmed) {
        procesarPago();
      }
    });
    return false;
  }
  procesarPago();
}
async function procesarPago() {
  try {
    if (validar(true)) {
      loading.value = true;
      const data = {
        id_proveedor: id_proveedor.value.id,
        id_path: filesStore.payPath,
        details: selected.value,
        id_cuenta: id_cuenta.value.id,
        fecha: date.value,
        nro_operacion: nro_operacion.value,
        id_banco_origen: id_banco_origen.value,
        id_coins: id_coins.value,
      };
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "setPayForCustomer",

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
              text: response.data.data[0].mensaje,
            }).then((result) => {
              if (result.isConfirmed) {
                filesStore.payPath = null;
              }
            });
            limpiarDatos();
          }
        })
        .catch(function (error) {
          console.error(error);
        });
      loading.value = false;
    }
  } catch (err) {
    console.log(err);
  }
}
function continuar() {
  if (validar()) {
    step2.value = false;
    tab.value = "ref2";
  }
}
function limpiarDatos() {
  payfile.value = [];
  payPath.value = "";
  id_proveedor.value = "" as unknown as ClienteRaiz;
  selected.value = [];
  boolFile.value = false;
  tab.value = "ref1";
  step2.value = true;
  total.value = 0;
  appStore.listPagosXProveedorCxP = [];
}
async function obtenerDatos() {
  if (props.tipo == "ver") {
    const id = route.params.id;

    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getVerPagosPorCustomer?id=` + id,

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function () {
        step2.value = false;
        // @ts-expect-error data is not defined
        id_proveedor.value = data.id_proveedor;
        // @ts-expect-error data is not defined
        appStore.listPagosXProveedorCxP = data.details;
        // @ts-expect-error data is not defined
        id_cuenta.value = data.id_bank;
        // @ts-expect-error data is not defined
        name_path.value = data.documento;
        // @ts-expect-error data is not defined
        url_documento.value = data.link_documento;
        setTimeout(() => {
          // @ts-expect-error vm is not defined
          vm.calcularTotalPagado();
        }, 200);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
function recibirId(file: { inserid?: string; archivo: unknown }) {
  payPath.value = file.inserid as string;
  payfile.value = file.archivo as File[];

  msgfile = "Archivo procesado y vinculado correctamente.";
  errfile = "";
}
function moverSeleccionadoAlInicio() {
  const listaPagos = appStore.listPagosXProveedorCxP;

  const seleccionadosIds = new Set(selected.value.map((item) => item.id));

  listaPagos.sort((a: DetallePagoCliente, b: DetallePagoCliente) => {
    const aSeleccionado = seleccionadosIds.has(a.id);
    const bSeleccionado = seleccionadosIds.has(b.id);

    if (aSeleccionado && !bSeleccionado) return -1;
    if (!aSeleccionado && bSeleccionado) return 1;
    return 0;
  });
}

watch(selected, (newVal, oldVal) => {
  calcularMonto();
  if (newVal.length > oldVal.length) {
    nextTick(() => {
      moverSeleccionadoAlInicio();
    });
  }
});

onMounted(async () => {
  appStore.spiner = true;
  await appStore._getBanksList();
  await appStore.cargarClientes();
  await obtenerListado();
  await getListBanksDetailsCargar();
  await limpiarDatos();
  await obtenerDatos();
  await appStore._getCoinsList();

  appStore.spiner = false;
});
</script>

<template>
  <div>
    <v-container fluid>
      <v-col
        md="12"
        cols="12"
      >
        <h1 v-if="tipo == 'nuevo'">
          MONTO A COBRAR :{{ symbol }} {{ total }}
        </h1>
        <h1 v-else>
          MONTO TOTAL : {{ totalPagado }}
        </h1>
      </v-col>
      <!-- v-model="value" -->
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
          :disabled="step2"
        >
          STEP 2
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="ref1">
          <v-row class="mt-5">
            <v-col
              md="4"
              cols="4"
            >
              <v-autocomplete
                :items="clientes"
                item-title="namelong"
                item-value="id"
                label="Cliente"
                v-model="id_proveedor"
                return-object
                clearable
                :readonly="tipo == 'ver'"
                @update:model-value="obtenerListado()"
              />
            </v-col>

            <v-col
              md="12"
              cols="12"
              v-if="appStore.listPagosXProveedorCxP.length > 0"
            >
              <v-data-table
                :headers="headers"
                :items="listPagosXProveedorCxP"
                show-select
                item-value="id"
                return-object
                v-model="selected"
                @item-selected="validarAprobacion"
              >
                <template #[`item.moneda`]="{ item }">
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    v-model="id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                  />
                </template>
                <template #[`item.montopagar`]="{ item }">
                  <v-text-field
                    :prefix="symbol"
                    v-model="item.montopagar"
                    type="number"
                    :max="item.montopagar"
                    :disabled="
                      selected.filter((v) => v.index == item.index).length == 0
                    "
                    @blur="calcularTotal()"
                    :error-messages="item.err"
                  />
                </template>
                <template #[`item.maxpagar`]="{ item }">
                  {{ item.symbol }} {{ item.max_pagar }}
                </template>
                <template #[`item.tipocambio`]="{ item }">
                  <v-text-field
                    v-model="item.tipocambio"
                    @blur="calcularMonto()"
                    type="number"
                    :disabled="
                      selected.filter((v) => v.index == item.index).length == 0
                    "
                  />
                </template>
              </v-data-table>
            </v-col>
            <v-col
              md="12"
              cols="12"
              v-if="appStore.listPagosXProveedorCxP.length > 0"
            >
              <div
                class="text-right"
                v-if="tipo == 'nuevo'"
              >
                <v-btn
                  color="success"
                  @click="continuar()"
                >
                  Continuar
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-tabs-window-item>
        <v-tabs-window-item value="ref2">
          <v-row class="mt-5">
            <v-col
              md="4"
              cols="4"
            >
              <v-text-field
                v-model="nro_operacion"
                label="Nro Operacion"
                v-if="tipo == 'nuevo'"
                @blur="ValidateNroOperacion()"
                id="nro_operacion"
                :error-messages="errorNroOperacion"
                :messages="successMessages"
              />
            </v-col>
            <v-col
              cols="4"
              md="4"
            >
              <v-text-field
                type="date"
                v-model="date"
                label="Fecha "
              />
            </v-col>
            <v-col
              md="6"
              cols="6"
              v-if="tipo == 'nuevo'"
            >
              <!-- <div>
                <v-file-input
                  v-model="payfile"
                  label="Cargar Archivo"
                  show-size
                  truncate-length="50"
                  hide-details
                  @change="uploadFile()"
                >
                </v-file-input>
              </div> -->
            </v-col>
            <!-- <v-col md="2" cols="2" v-if="!boolFile && tipo == 'nuevo'">
              <v-btn color="info" @click="_uploadFile()">
                <v-icon class="mx-1" dense small>
                  mdi-cloud-upload-outline
                </v-icon>
                Upload
              </v-btn>
            </v-col> -->
            <v-col
              md="6"
              v-if="tipo != 'nuevo'"
            >
              <h6>DOCUMENTO:</h6>
              <v-table>
                <tbody>
                  <tr>
                    <td>{{ name_path }}</td>
                    <td>
                      <v-btn
                        variant="text"
                        icon
                        color="red"
                        :href="url_documento"
                        target="_blank"
                      >
                        <v-icon>mdi-file-pdf-box</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
            <v-col
              md="4"
              cols="4"
            >
              <v-autocomplete
                :items="(cuentas || []).filter((v) => v.symbol == symbol)"
                item-title="label"
                item-value="id"
                label="Cuenta Destino (PIC)"
                v-model="id_cuenta"
                return-object
                :readonly="tipo == 'ver'"
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
                v-if="tipo == 'nuevo'"
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
                v-if="tipo == 'nuevo'"
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
                v-if="tipo == 'nuevo'"
              />
            </v-col>
            <v-col
              md="4"
              cols="4"
            >
              <v-select
                :items="appStore.itemsDataBanksList"
                v-model="id_banco_origen"
                label="Banco Origen"
                item-title="acronym"
                item-value="id"
              />
            </v-col>
            <v-col
              md="12"
              cols="12"
            >
              <ArrastraYSolarComponent @id-archivo-cargado="recibirId" />
            </v-col>
            <v-col
              md="12"
              cols="12"
              v-if="tipo == 'nuevo'"
            >
              <div class="text-right">
                <v-btn
                  :loading="loading"
                  :disabled="
                    !id_cuenta.id || !nro_operacion || !id_banco_origen
                  "
                  color="success"
                  @click="_putPayForProveedor()"
                >
                  PROCESAR PAGO
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </div>
</template>

<style></style>
