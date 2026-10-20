<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useBankStore } from "@/stores/bank";
import type {
  ClientePago,
  CuentaDestinoCliente,
  DetalleCobroCliente,
  DetallePagoCliente,
} from "@/types/banks";
import { sessionBranchId } from "@/utils/sesion";

const props = defineProps<{ tipo?: string }>();

const rootStore = useStore();
const route = useRoute();
const router = useRouter();
const bankStore = useBankStore();
const listPagosXProveedorCxP = computed<DetallePagoCliente[]>(() => rootStore.state.listPagosXProveedorCxP);
const clientes = computed(() => rootStore.state.clientes);

const loading = ref(false);
const date = ref("");
const symbol = ref("USD");
const payfile = ref<File[]>([]);
const selected = ref<DetallePagoCliente[]>([]);
const id_coins = ref<number | string>(1);
const payPath = ref("");
const id_proveedor = ref<ClientePago>("" as unknown as ClientePago);
const boolFile = ref(false);
const cuentas = ref<CuentaDestinoCliente[]>([]);
const id_cuenta = ref<CuentaDestinoCliente>("" as unknown as CuentaDestinoCliente);
const tab = ref<string | null>(null);
const total = ref<number | string>(0);
const step2 = ref(true);
const name_path = ref("");
const url_documento = ref("");
const nro_operacion = ref("");
const id_banco_origen = ref<number | string>("");
const headers = [
  {
    title: "House",
    key: "tipo_gasto",
  },

  // {
  //   text: "Cliente Pagó",
  //   value: "statuspago",
  // },
  {
    title: "Monto Dolar",
    key: "montodolar",
  },

  // {
  //   text: "Monto Moneda Banco",
  //   value: "maxpagar",
  // },

  {
    title: "Moneda",
    key: "moneda",
  },
  {
    title: "Tipo Cambio",
    key: "tipocambio",
  },
  {
    title: "Pago Mon Ex",
    key: "monto_destino",
  },
  {
    title: "Acción",
    key: "action",
  },
];

async function obtenerListado() {
  rootStore.state.listPagosXProveedorCxP.listPagosXProveedorCxP = [];
  date.value = "";
  payfile.value = [];
  boolFile.value = false;
  id_cuenta.value = "" as unknown as CuentaDestinoCliente;
  id_banco_origen.value = "";
  nro_operacion.value = "";
  if (id_proveedor.value.id && props.tipo == "nuevo") {
    await rootStore.dispatch("_getListaPagosXProveedorCxC", id_proveedor.value.id);
  } else {
    selected.value = [];
  }
}
async function actualizarCobro() {
  const res = await bankStore.actualizarPagoRealizado(
    bankStore.record.details,
  );

  Swal.fire({
    icon: res!.estadoflag ? "success" : "error",
    text: res!.mensaje,
  }).then((response) => {
    if (response.isConfirmed) {
      router.go(-1);
    }
  });
}
function getMontoTotal() {
  let monto = 0;
  (bankStore.record.details as DetalleCobroCliente[]).forEach((element) => {
    monto += parseFloat(String(element.monto_destino));
  });
  return parseFloat(String(monto)).toFixed(2);
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
function obtenerSymbol() {
  symbol.value = rootStore.state.itemsCoinsList.filter(
    (v: { id: number }) => v.id == id_coins.value,
  )[0].symbol;
}
function calcularMonto() {
  if (selected.value.length > 0) {
    selected.value.forEach((element) => {
      id_coins.value = element.id_coins;
      symbol.value = rootStore.state.itemsCoinsList.filter(
        (v: { id: number }) => v.id == selected.value[0]!.id_coins,
      )[0].symbol;
      element.montopagar = parseFloat(
        String((element.monto_pagar as number) * (element.tipocambio as number)),
      ).toFixed(2);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (element.montopagar as unknown as number) > (element.max_pagar as number)
        ? (element.err = "Monto Superior a la deuda ")
        : (element.err = "");
    });
    calcularTotal();
    obtenerSymbol();
  }
}
function calcularTotal() {
  let sum = 0;
  selected.value.forEach((element) => {
    sum += parseFloat(String(element.montopagar));
  });
  total.value = parseFloat(String(sum)).toFixed(4);
}
async function anularCobro(item: DetalleCobroCliente) {
  await Swal.fire({
    icon: "question",
    text: "¿Está seguro que desea anular el cobro realizado. ? Recuerde que este cambio no es reversible.",
    confirmButtonText: "Si, anular",
    cancelButtonText: "Cancelar",
    showDenyButton: false,
    showCancelButton: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      await bankStore.anularCobroRealizado(item);
      router.go(-1);
    }
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _uploadFile() {
  const data = new FormData();
  data.append("name", "Prueba");
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
      payPath.value = JSON.stringify(response.data.data[0].insertid);
    })
    .catch(function (error) {
      console.error(error);
    });
}
function validar(registro = false) {
  let validacion = true;
  let msg = "";
  listPagosXProveedorCxP.value.forEach((element) => {
    let monto_deuda: number | string = 0;
    monto_deuda = parseFloat(String(element.monto_deuda)).toFixed(4);
    let max_pagar: number | string = 0;
    max_pagar = parseFloat(String(element.max_pagar)).toFixed(4);

    if (parseFloat(String(monto_deuda)) > parseFloat(String(max_pagar))) {
      validacion = false;
      msg = "No puede realizar un pago mayor a la deuda. ";
    }
  });
  if (!payPath.value && registro) {
    validacion = false;
    msg += "Por favor, seleccione un documento para soporte de pago. ";
  }
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _putPayForProveedor() {
  try {
    if (validar(true)) {
      loading.value = true;
      const data = {
        id_proveedor: id_proveedor.value.id,
        id_path: payPath.value,
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
              text: response.data.data.msg,
            });
            limpiarDatos();
          }
        })
        .catch(function (error) {
          console.error(error);
        });
      loading.value = false;
    }
  } catch (e) {
    console.error(e);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuar() {
  if (validar()) {
    step2.value = false;
    tab.value = "ref2";
  }
}
function limpiarDatos() {
  payfile.value = [];
  payPath.value = "";
  id_proveedor.value = "" as unknown as ClientePago;
  selected.value = [];
  boolFile.value = false;
  tab.value = "ref1";
  step2.value = true;
  total.value = 0;
  rootStore.state.listPagosXProveedorCxP = [];
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
        rootStore.state.listPagosXProveedorCxP = data.details;
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
function abrirSoporte(url: unknown) {
  window.open(url as string, "_blank");
}

watch(selected, () => {
  calcularMonto();
});

onMounted(async () => {
  rootStore.state.spiner = true;
  await rootStore.dispatch("_getBanksList");
  await rootStore.dispatch("cargarClientes");
  await obtenerListado();
  await getListBanksDetailsCargar();
  await getListBanksDetailsCargar();
  await limpiarDatos();
  await obtenerDatos();
  await rootStore.dispatch("_getCoinsList");
  await bankStore.verCobroRealizado(route.params.nro_operacion as string);
  rootStore.state.spiner = false;
  rootStore.state.drawer = false;
});
</script>

<template>
  <v-card
    elevation="5"
    class="pb-5"
  >
    <!-- v-model="value" -->
    <v-col
      md="12"
      cols="12"
    >
      <h1>MONTO A COBRAR :{{ symbol }} {{ getMontoTotal() }}</h1>
    </v-col>
    <v-tabs
      color="#A43542"
      slider-color="primary"
      fixed-tabs
      v-model="tab"
    >
      <v-tab value="ref1">
        STEP 1
      </v-tab>
      <v-tab value="ref2">
        STEP 2
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        value="ref1"
        class="px-5"
      >
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
              v-model="bankStore.record.id_cliente"
              readonly
              @update:model-value="obtenerListado()"
            />
          </v-col>

          <v-col
            md="12"
            cols="12"
          >
            <!-- @vue-expect-error the record details are not typed -->
            <v-data-table
              :headers="headers"
              :items="bankStore.record.details"
            >
              <!-- eslint-disable-next-line vue/no-unused-vars -->
              <template #[`item.moneda`]="{ item }">
                <v-autocomplete
                  :items="rootStore.state.itemsCoinsList"
                  v-model="id_coins"
                  item-title="acronym"
                  item-value="id"
                  label="Moneda"
                  @blur="obtenerSymbol()"
                />
              </template>
              <template #[`item.montodolar`]="{ item }">
                <v-text-field
                  :prefix="symbol"
                  v-model="item.montodolar"
                  type="number"
                  :max="item.montodolar"
                  @blur="calcularTotal()"
                  :error-messages="item.err"
                />
              </template>
              <template #[`item.montopagar`]="{ item }">
                <v-text-field
                  :prefix="symbol"
                  v-model="item.montopagar"
                  type="number"
                  :max="item.montopagar"
                  @blur="calcularTotal()"
                  :error-messages="item.err"
                />
              </template>
              <template #[`item.monto_destino`]="{ item }">
                <v-text-field
                  v-model="item.monto_destino"
                  type="number"
                  :max="item.monto_destino"
                  @blur="calcularTotal()"
                  :error-messages="item.err"
                />
              </template>
              <template #[`item.tipocambio`]="{ item }">
                <v-text-field
                  v-model="item.tipocambio"
                  @blur="calcularMonto()"
                  type="number"
                />
              </template>
              <template #[`item.action`]="{ item }">
                <v-btn
                  variant="text"
                  icon
                >
                  <v-icon
                    color="red"
                    @click="anularCobro(item)"
                  >
                    mdi-circle-off-outline
                  </v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="ref2"
        class="px-5"
      >
        <v-row class="mt-5">
          <v-col
            md="4"
            cols="4"
          >
            <v-text-field
              v-model="bankStore.record.nro_operacion"
              label="Nro Operacion"
            />
          </v-col>
          <v-col
            cols="4"
            md="4"
          >
            <v-text-field
              type="date"
              v-model="bankStore.record.fecha_pago"
              label="Fecha "
            />
          </v-col>
          <v-col
            md="4"
            cols="4"
          >
            <v-btn
              variant="text"
              @click="abrirSoporte(bankStore.record.ruta)"
            >
              <v-icon color="red">
                mdi-file-pdf-box
              </v-icon>
              {{ bankStore.record.nombre_archivo }}
            </v-btn>
            <div>
              <v-file-input
                v-model="payfile"
                label="Soporte de Pago"
                show-size
                truncate-length="50"
                hide-details
                v-if="!boolFile"
              />
            </div>
          </v-col>

          <v-col
            md="4"
            cols="4"
          >
            <!-- @vue-expect-error the record fields are not typed -->
            <v-autocomplete
              :items="cuentas"
              item-title="label"
              item-value="id"
              label="Cuenta Destino (PIC)"
              v-model="bankStore.record.id_cuentadestino"
              return-object
            />
          </v-col>
          <!-- <v-col md="4" cols="4">
            <v-text-field
              readonly
              v-model="id_cuenta.banco"
              label="Banco:"
            ></v-text-field>
          </v-col>
          <v-col md="4" cols="4">
            <v-text-field
              readonly
              v-model="id_cuenta.moneda"
              label="Moneda:"
            ></v-text-field>
          </v-col> -->
          <!-- <v-col md="4" cols="4"
            ><v-text-field
              readonly
              v-model="id_cuenta.cuenta"
              label="N° Cuenta:"
            ></v-text-field
          ></v-col> -->
          <v-col
            md="4"
            cols="4"
          >
            <v-select
              :items="rootStore.state.itemsDataBanksList"
              v-model="bankStore.record.id_banco_origin"
              label="Banco Origen"
              item-title="acronym"
              item-value="id"
            />
          </v-col>

          <v-col
            md="12"
            cols="12"
          >
            <div class="text-right">
              <v-btn
                :loading="loading"
                color="success"
                @click="actualizarCobro()"
              >
                Actualizar
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>

<style></style>
