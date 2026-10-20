<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from "@/api/http";
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";
import BarraFiltro from "../BarraMostrarFiltro/BarraFiltro.vue";
import { useSecuritysStore } from "@/stores/securitys";
import { sessionBranchId } from "@/utils/sesion";
import type { CuentaListado } from "@/types/modulesPays";

const router = useRouter();
const appStore = useAppStore();
const securitysStore = useSecuritysStore();

const itemsListInvoice = ref<CuentaListado[]>([]);
const searchFactura = ref("");
const dialogPayment = ref(false);
const id_pro = ref<string | number>("");
const id_gasto = ref(null);
const id_subgasto = ref(null);
const fechapagodesde = ref(moment().format("YYYY-01-01"));
const fechapagohasta = ref(moment().format("YYYY-MM-DD"));
const id_proveedor = ref<number | null>(null);
const factura = ref<string | null>(null);
const serie = ref<string | null>(null);
const expanded = ref<string[]>([]);
const filtroflag = ref(false);
const headersFacturas = [
  {
    title: "",
    key: "action",
  },
  {
    title: "Tipo",
    key: "paymentname",
  },
  {
    title: "Gasto",
    key: "gasto_description",
  },
  {
    title: "Sub Gasto",
    key: "subgasto_description",
  },

  {
    title: "Fecha Emisión",
    key: "fecha",
  },
  // {
  //   text: "Fecha Vencimiento",
  //   value: "fechavencimiento",
  // },
  {
    title: "Expediente",
    key: "nro_master",
  },
  {
    title: "Proveedor",
    key: "nameconsigner",
  },
  {
    title: "Nro. Factura",
    key: "nro_factura",
  },
  {
    title: "Nro. Serie",
    key: "nro_serie",
  },

  {
    title: "Total",
    key: "total",
    headerProps: { class: "totalcss" },
  },
  {
    title: "Tipo de Cambio",
    key: "tipocambio",
  },
  {
    title: "Total",
    key: "totaldolar",
    headerProps: { class: "montodolarcss" },
  },
  {
    title: "Estado",
    key: "accion",
  },
];

let payfile: string | Blob;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let boolFile: boolean;
let payPath: string;
let date: string;
let factura_pago: string;
let serie_pago: string;
let banco_pago: string;
let moneda_pago: string;
let monto_pago: string;

const filtro = computed(() => {
  return {
    id_proveedor: id_proveedor.value,
    fechapagodesde: fechapagodesde.value,
    fechapagohasta: fechapagohasta.value,
    factura: factura.value,
    serie: serie.value,
  };
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function filterOnlyCapsText(value: unknown, search: string | null) {
  const text = search ? search.toLocaleUpperCase() : null;
  return (
    value != null &&
    search != null &&
    typeof value === "string" &&
    value.toString().toLocaleUpperCase().indexOf(text!) !== -1
  );
}
function toPageAdd() {
  router.push({ name: "addAccountPays" });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function uploadPayment(id: string | number) {
  id_pro.value = id;
  dialogPayment.value = true;
}
function eyePro(id: number) {
  // window.open(id, "_blank");
  router.push({ name: "viewAccountPays", params: { id: id } });
}
function penPro(id: number) {
  // window.open(id, "_blank");
  router.push({ name: "EditAccountPays", params: { id: id } });
}
async function penProConClaveAdmin(id: number) {
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
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value.trim();
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value.trim();
      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }
      return { usuario: input1, clave: input2 };
    },
  }).then(async (result) => {
    if (!result.isConfirmed) {
      // Usuario canceló
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
      text: msg,
    });
    return false;
  }
  router.push({ name: "EditAccountPays", params: { id: id } });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _uploadFile() {
  const data = new FormData();
  data.append("name", "Prueba");
  data.append("file", payfile);

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
      boolFile = true;
      payPath = JSON.stringify(response.data.data[0].insertid);
    })
    .catch(function (error) {
      console.error(error);
    });
}
function cleanData() {
  payfile = "";
  date = "";
  payPath = "";
  factura_pago = "";
  serie_pago = "";
  banco_pago = "";
  moneda_pago = "";
  monto_pago = "";
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _putInvoice() {
  const data = {
    id_pago: payPath,
    fecha_pago: date,
    factura_pago: factura_pago,
    serie_pago: serie_pago,
    id_bank_pago: banco_pago,
    id_coin_pago: moneda_pago,
    monto_pago: monto_pago,
    status: 2,
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "paymentInvoiceAdmin/" + id_pro.value,

    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      //vm.dialogListInvoince = true;
      // vm.itemsListInvoice = response.data.data;
      Swal.fire({
        icon: "success",
        title: "Documento Cargado",
        text: "El documento ha sido cargado correctamente",
      });
      dialogPayment.value = false;
      cleanData();
      _getInvoiceAdmin();
    })
    .catch(function (error) {
      console.error(error);
    });
}
function limpiar() {
  filtroflag.value = false;
  id_gasto.value = null;
  id_subgasto.value = null;
  fechapagodesde.value = moment().format("YYYY-01-01");
  fechapagohasta.value = moment().format("YYYY-MM-DD");
  id_proveedor.value = null;
  factura.value = null;
  serie.value = null;
  _getInvoiceAdmin();
}
async function _getInvoiceAdmin() {
  appStore.spiner = true;
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getInvoiceAdmin",
    params: {
      id_branch: sessionBranchId(),
      id_gasto: id_gasto.value,
      id_subgasto: id_subgasto.value,
      fechapagodesde: fechapagodesde.value,
      fechapagohasta: fechapagohasta.value,
      id_proveedor: id_proveedor.value,
      factura: factura.value,
      serie: serie.value,
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      const res = response.data;
      if (res.estadoflag) {
        itemsListInvoice.value = response.data.data;
      } else {
        itemsListInvoice.value = [];
        Swal.fire({
          icon: "error",
          text: res.mensaje,
        });
      }
    })
    .catch(function (error) {
      console.error(error);
    });
  appStore.spiner = false;
  filtroflag.value = false;
}
async function delPro(id: number) {
  let val = true;
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
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value.trim();
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value.trim();
      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }
      return { usuario: input1, clave: input2 };
    },
  }).then(async (result) => {
    if (!result.isConfirmed) {
      // Usuario canceló
      val = false;
      // @ts-expect-error msg is not declared in delPro
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
        // @ts-expect-error msg is not declared in delPro
        msg = res?.mensaje || "Credenciales incorrectas";
      }
    } else {
      val = false;
      // @ts-expect-error msg is not declared in delPro
      msg = "Debe ingresar las credenciales";
    }
  });

  if (!val) {
    // @ts-expect-error swal is not defined
    await swal.fire({
      icon: "error",
      // @ts-expect-error msg is not declared in delPro
      text: msg,
    });
    return false;
  }

  await EliminarCuenta(id);
  await limpiar();
}
async function EliminarCuenta(id: number) {
  const data = {
    id: id,
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "delPro",

    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      _getInvoiceAdmin();
    })
    .catch(function (error) {
      console.error(error);
    });
}

onMounted(async () => {
  appStore.spiner = true;

  await _getInvoiceAdmin();
  appStore.spiner = false;
  Promise.all([appStore.cargarProveedores()]);
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <BarraFiltro :filtro="filtro" />
      </v-col>
      <v-col
        cols="12"
        md="3"
        class="pt-0"
      >
        <v-text-field
          hide-details
          v-model="searchFactura"
          density="compact"
          id="id"
          variant="outlined"
          label="Buscar"
          placeholder="Buscar..."
          append-inner-icon="mdi-text-search"
        />
      </v-col>
      <v-col
        cols="12"
        md="9"
        class="text-right pt-0"
      >
        <v-btn
          class="mx-1"
          @click="filtroflag = true"
          color="default"
        >
          <v-icon size="small">
            mdi-filter
          </v-icon> Filtro
        </v-btn>
        <v-btn
          class="mx-1"
          @click="toPageAdd()"
          color="primary"
        >
          <v-icon size="small">
            mdi-plus
          </v-icon> NUEVA FACTURA
        </v-btn>
        <v-btn
          class="mx-1"
          @click="limpiar()"
          color="red"
          variant="outlined"
        >
          <v-icon size="small">
            mdi-filter-remove
          </v-icon> LIMPIAR
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headersFacturas"
          :items="itemsListInvoice"
          density="compact"
          expand-on-click
          item-value="id"
          v-model:expanded="expanded"
          :search="searchFactura"
        >
          <template #expanded-row="{ item }">
            <tr>
              <td :colspan="headersFacturas.length">
                <v-table>
                  <thead style="background: #e3f2fd; font-weight: bold">
                    <tr>
                      <td>Concepto</td>
                      <td>Monto</td>
                      <td>IGV</td>
                      <td>Total</td>
                      <td>Monto (USD)</td>
                      <td>IGV (USD)</td>
                      <td>Total (USD)</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(detalle, index) in item.detalle"
                      :key="index"
                    >
                      <td>{{ detalle.concepto }}</td>
                      <td>
                        {{ item.namecoins }}
                        {{ parseFloat(detalle.monto).toFixed(2) }}
                      </td>
                      <td>
                        {{ item.namecoins }}
                        {{ parseFloat(detalle.igv).toFixed(2) }}
                      </td>
                      <td>
                        {{ item.namecoins }}
                        {{ parseFloat(detalle.total).toFixed(2) }}
                      </td>
                      <td>USD {{ parseFloat(detalle.montodolar).toFixed(2) }}</td>
                      <td>USD {{ parseFloat(detalle.igvdolar).toFixed(2) }}</td>
                      <td>USD {{ parseFloat(detalle.totaldolar).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
            </tr>
          </template>
          <template #[`item.paymentname`]="{ item }">
            {{ item.paymentname.charAt(0) }}
          </template>
          <template #[`item.accion`]="{ item }">
            <v-chip
              block
              class="text-white"
              color="orange"
              variant="flat"
              v-if="item.status == 1"
            >
              Pendiente
            </v-chip>
            <v-chip
              block
              class=""
              color="success"
              v-if="item.status == 2"
            >
              Pagado
            </v-chip>
          </template>
          <template #[`item.totaldolar`]="{ item }">
            USD {{ item.total }}
          </template>
          <template #[`item.total`]="{ item }">
            {{ item.namecoins }}
            {{ item.total }}
          </template>
          <template #[`item.action`]="{ item }">
            <div class="d-flex align-center">
              <!-- @vue-expect-error icon is a boolean attribute left from the old template -->
              <v-icon
                class="btn_add mr-2"
                icon
                v-if="item.status == 1"
                color="red"
                @click="delPro(item.id)"
              >
                mdi-delete
              </v-icon>
              <!-- @vue-expect-error icon is a boolean attribute left from the old template -->
              <v-icon
                class="btn_add mr-2"
                icon
                v-if="item.status == 1"
                color="blue"
                @click="penPro(item.id)"
              >
                mdi-pencil
              </v-icon>
              <!-- @vue-expect-error icon is a boolean attribute left from the old template -->
              <v-icon
                class="btn_add mr-2"
                icon
                v-if="item.status == 2"
                color="blue"
                @click="penProConClaveAdmin(item.id)"
              >
                mdi-pencil
              </v-icon>
              <!-- @vue-expect-error icon is a boolean attribute left from the old template -->
              <v-icon
                class="btn_add mr-2"
                icon
                color="green"
                @click="eyePro(item.id)"
              >
                mdi-eye
              </v-icon>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <!-- seeción filtro -->

    <v-navigation-drawer
      v-model="filtroflag"
      location="right"
      
      width="40%"
      temporary
      class="filtro-container"
    >
      <v-card min-height="800px">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Filtro Para Facturas
          <v-spacer />
          <v-btn
            color="default"
            variant="text"
            @click="filtroflag = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-autocomplete
            :items="appStore.provedores"
            v-model="id_proveedor"
            item-title="namelong"
            item-value="id"
            clearable
            label="Proveedor"
            variant="outlined"
            density="compact"
          />

          <FormatFecha
            v-model="fechapagodesde"
            label="Fecha Emisión desde "
            :outlined="true"
            :dense="true"
          />
          <FormatFecha
            v-model="fechapagohasta"
            label="Fecha Emisión Hasta"
            :outlined="true"
            :dense="true"
          />
          <v-text-field
            v-model="factura"
            clearable
            variant="outlined"
            density="compact"
            label="Factura"
          />
          <v-text-field
            v-model="serie"
            clearable
            variant="outlined"
            density="compact"
            label="Serie"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="info"
            @click="_getInvoiceAdmin()"
          >
            <v-icon>mdi-filter-check-outline</v-icon> Filtrar
          </v-btn>
          <v-btn
            color="danger"
            @click="limpiar()"
          >
            <v-icon>mdi-filter-remove-outline</v-icon> Limpiar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<style scoped>
.totalcss {
  background: #adcaf5 !important;
}
.montodolarcss {
  background: #c7f7d7 !important;
}
</style>
<style>
.filtro-container {
  position: fixed !important;
  height: 100vh;
  z-index: 9999;
  overflow-y: auto;
}
</style>
