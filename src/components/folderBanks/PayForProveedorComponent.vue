<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from '@/api/http';
import Swal from "sweetalert2";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
import type { CuentaBancariaPic } from "@/types/operaciones";
import type {
  CuentaSalidaPago,
  DetallePagoProveedor,
} from "@/types/banksProveedor";
import type { ProveedorRaiz } from "@/types/app";
import { sessionBranchId } from "@/utils/sesion";

const props = defineProps<{ tipo?: string }>();

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const listPagosXProveedorCxP = computed<DetallePagoProveedor[]>(() => appStore.listPagosXProveedorCxP);
const provedores = computed(() => appStore.provedores);
const frmRegister = useTemplateRef("frmRegister");

const loading = ref(false);
const successMessages = ref("");
const search = ref("");
const montoMonExt = ref<number | string>(0);
const selected = ref<DetallePagoProveedor[]>([]);
const nro_operacion = ref("");
const id_coins = ref(1);
const date = ref(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10));
const payfile = ref<File[]>([]);
const payPath = ref("");
const id_proveedor = ref<ProveedorRaiz>("" as unknown as ProveedorRaiz);
const boolFile = ref(false);
const cuentas = ref<CuentaBancariaPic[]>([]);
const id_cuenta = ref<CuentaSalidaPago>("" as unknown as CuentaSalidaPago);
const tab = ref<string | number | null>(null);
const total = ref<number | string>(0);
const step2 = ref(true);
const name_path = ref("");
const url_documento = ref("");
const totalPagado = ref<number | string>(0);
const tipocambio = ref<number | string>(1);
const comentarios = ref("");
const loadingFile = ref(false);
const errfile = ref("");
const msgfile = ref("");
const headers = [
  {
    title: "Factura",
    key: "nro_factura",
  },

  {
    title: "Expediente",
    key: "codigo_house",
  },
  {
    title: "Procedencia",
    key: "procedencia",
  },

  {
    title: "Monto",
    key: "monto_pagar",
  },

  {
    title: "Monto Deuda",
    key: "monto_deuda",
  },

  {
    title: "Moneda Pagar",
    key: "item_moneda",
  },
  {
    title: "Tipo de Cambio",
    key: "tipo_cambio",
  },
  {
    title: "Monto Pagar",
    key: "monto_pagar_ex",
    shortable: false,
  },
];
const msgNroOperacion = ref("");

const symbol = computed(() => {
  let symbol = "";
  const coin = appStore.itemsCoinsList.find(
    (v: { id: number }) => v.id == id_coins.value,
  );
  if (coin) {
    symbol = coin.symbol;
  }
  return symbol;
});

function obtenerListado() {
  tab.value = 0;
  appStore.listPagosXProveedorCxP = [];
  if (id_proveedor.value) {
    appStore._getListaPagosXProveedorCxP(id_proveedor.value.id);
  }
  selected.value = [];
}
function calcularTotalesInput() {
  montoMonExt.value = selected.value.reduce((sum: number, pago) => {
    console.log(pago);
    return sum + parseFloat(String(pago.monto_mon_ext));
  }, 0);
  // this.
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
  totalPagado.value = parseFloat(String(sum)).toFixed(4);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setearMonto(details: DetallePagoProveedor) {
  if (details.pagar) {
    listPagosXProveedorCxP.value.filter(
      (v) => v.id == details.id,
    )[0]!.cktotal = true;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    listPagosXProveedorCxP.value.filter(
      (v) => parseFloat(String(v.monto_deuda)) < parseFloat(String(v.max_pagar)),
    ).length > 0
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
  loading.value = true;
  if ((await frmRegister.value!.validate()).valid && !msgNroOperacion.value) {
    const data = {
      id_coins: id_coins.value,
      tipocambio: id_coins.value == 1 ? 1 : tipocambio.value,
      details: selected.value,
      fecha_pago: date.value,
      nro_operacion: nro_operacion.value,
      comentarios: comentarios.value,
      id_proveedor: id_proveedor.value.id,
      id_path: filesStore.payPath,
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
          
          filesStore.payPath = null;
          Swal.fire({
            icon: "success",
            title: "Aviso",
            text: response.data.data[0].mensaje,
          }).then((result) => {
            if (result.isConfirmed) {
              router.go(-1);
            }
          });
          // vm.$router.go(-1);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    loading.value = false;
  }
}
function continuar() {
  if (
    selected.value.some((v) => {
      const condicion =
        parseFloat(String(v.monto_deuda)) <
        (parseFloat(
          String(parseFloat(String(v.monto_mon_ext)) / parseFloat(String(tipocambio.value))),
        ).toFixed(2) as unknown as number);

      return condicion;
    })
  ) {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "No puede pagar más de la deuda. Verifique",
    });
    return false;
  }

  step2.value = false;
  tab.value = "ref2";
}
function calcularTotales() {
  let monex = 0;
  const coins = [...appStore.itemsCoinsList];
  const moneda = coins.filter((v) => v.id == id_coins.value)[0]!;

  if (selected.value.length > 0) {
    if (moneda.acronym != "USD") {
      selected.value.forEach((element) => {
        element.monto_mon_ext = parseFloat(
          String((tipocambio.value as number) * (element.monto_deuda as number)),
        ).toFixed(4);
        monex += parseFloat(element.monto_mon_ext);
      });
    }
    if (moneda.acronym == "USD") {
      tipocambio.value = 1;
      selected.value.forEach((element) => {
        console.log(element);
        element.monto_mon_ext = parseFloat(
          String((element.monto_deuda as number) / (tipocambio.value as number)),
        ).toFixed(4);
        // @ts-expect-error toFixed returns a string, so monex turns into text
        monex += parseFloat(element.monto_mon_ext).toFixed(2);
      });
    }
  }
  montoMonExt.value = parseFloat(String(monex)).toFixed(2);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculamonto_pagar_exrTotalesInput() {
  let monex = 0;
  if (selected.value.length > 0) {
    selected.value.forEach((element) => {
      monex += parseFloat(String(element.monto_mon_ext));
    });
  }
  montoMonExt.value = parseFloat(String(monex)).toFixed(2);
}
function limpiarDatos() {
  payfile.value = [];
  payPath.value = "";
  id_proveedor.value = "" as unknown as ProveedorRaiz;
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
        appStore.listPagosXProveedorCxP = data.details;
        id_cuenta.value = data.id_bank;
        name_path.value = data.documento;
        url_documento.value = data.link_documento;
        setTimeout(() => {
          calcularTotalPagado();
        }, 200);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
async function ValidaNroOp() {
  msgNroOperacion.value = "";
  successMessages.value = "";
  appStore.spiner = true;
  const res = await bancosStore.getValidaNroOp(nro_operacion.value);

  if (!!bancosStore.validacionBanco!.estadoflag) {
    msgNroOperacion.value = bancosStore.validacionBanco!.mensaje;
    document.getElementById("nro_operacion")!.focus();
  }

  if (res!.mensaje) {
    successMessages.value = `Existen Operaciones con Nro(s) Similiares: ${res!.mensaje}`;
  }

  appStore.spiner = false;
}
function moverSeleccionadoAlInicio() {
  const listaPagos = appStore.listPagosXProveedorCxP;

  const seleccionadosIds = new Set(selected.value.map((item) => item.id));

  listaPagos.sort((a: DetallePagoProveedor, b: DetallePagoProveedor) => {
    const aSeleccionado = seleccionadosIds.has(a.id);
    const bSeleccionado = seleccionadosIds.has(b.id);

    if (aSeleccionado && !bSeleccionado) return -1;
    if (!aSeleccionado && bSeleccionado) return 1;
    return 0;
  });
}
function recibirId(file: { inserid?: string; archivo: unknown }) {
  payPath.value = file.inserid as string;
  payfile.value = file.archivo as File[];

  msgfile.value = "Archivo procesado y vinculado correctamente.";
  errfile.value = "";
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
  console.log("ssss");
  filesStore.payPath = null;
  filesStore.datosPath = null;
  tab.value = 1;
  await appStore.cargarProveedores();
  await obtenerListado();
  await getListBanksDetailsCargar();
  await limpiarDatos();
  await appStore._getCoinsList();
  setTimeout(() => {
    obtenerDatos();
  }, 1000);
  appStore.drawer = false;
});
</script>

<template>
  <v-card class="px-5">
    <v-card-title primary-title>
      <v-row>
        <v-autocomplete
          :items="provedores"
          item-title="namelong"
          item-value="id"
          label="Proveedor"
          v-model="id_proveedor"
          return-object
          clearable
          :readonly="tipo == 'ver'"
          @update:model-value="obtenerListado()"
        />
        <v-spacer />
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="3">
          <v-text-field
            style="font-size: 20pt"
            label="Monto en que va a salir del banco"
            v-model="montoMonExt"
            readonly
            :prefix="symbol"
          />
          <!-- :prefix="acronym" -->
        </v-col>
      </v-row>
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
            <v-col
              md="12"
              cols="12"
            >
              <v-data-table
                :headers="headers"
                :items="listPagosXProveedorCxP"
                show-select
                item-value="id"
                return-object
                v-model="selected"
              >
                <template #[`item.item_moneda`]="{ item }">
                  <v-autocomplete
                    :items="appStore.itemsCoinsList"
                    v-model="id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    @update:model-value="calcularTotales"
                  />
                </template>
                <!--  -->
                <template #[`item.tipo_cambio`]="{ item }">
                  <v-text-field
                    v-model="tipocambio"
                    type="number"
                    step="0.01"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    @blur="calcularTotales()"
                  />
                </template>

                <template #[`item.monto_pagar_ex`]="{ item }">
                  <v-text-field
                    v-model="item.monto_mon_ext"
                    type="number"
                    :prefix="symbol"
                    @blur="calcularTotalesInput()"
                    :error-messages="item.errorEx"
                  />
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-tabs-window-item>
        <v-tabs-window-item value="ref2">
          <v-form ref="frmRegister">
            <v-row class="mt-5">
              <v-col
                md="3"
                cols="3"
              >
                <v-text-field
                  v-model="nro_operacion"
                  label="N° de Operación"
                  @blur="ValidaNroOp()"
                  :error-messages="msgNroOperacion"
                  id="nro_operacion"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                  :messages="successMessages"
                />
              </v-col>
              <v-col
                cols="3"
                md="3"
              >
                <v-text-field
                  type="date"
                  v-model="date"
                  label="Fecha de Pago"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                />
              </v-col>
              <v-col
                md="6"
                cols="6"
              >
                <!-- <v-file-input
                  label="Cargar Archivo"
                  v-model="payfile"
                  ref="fileInput"
                  @change="uploadFile()"
                  :messages="msgfile"
                  :error-messages="errfile"
                  :loading="loadingFile"
                >
                </v-file-input> -->
              </v-col>

              <v-col
                md="4"
                cols="4"
              >
                <v-autocomplete
                  :items="(cuentas || []).filter((v) => v.symbol == symbol)"
                  item-title="label"
                  item-value="id"
                  label="Cuenta de Salida de Banco"
                  v-model="id_cuenta"
                  return-object
                  :readonly="tipo == 'ver'"
                  :rules="[(v) => !!v || 'Datos Requerido']"
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
                <v-text-field
                  readonly
                  v-model="id_cuenta.cci"
                  label="CCI:"
                  v-if="tipo == 'nuevo'"
                />
              </v-col>
              <v-col
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
                <ArrastraYSolarComponent @id-archivo-cargado="recibirId" />
              </v-col>
              <v-col
                md="12"
                cols="12"
                v-if="tipo == 'nuevo'"
              >
                <div class="text-right">
                  <v-btn
                    color="success"
                    :loading="loading"
                    @click="_putPayForProveedor()"
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
</template>

<style></style>
