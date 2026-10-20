<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import moment from "moment";
import { useFilesStore } from "@/stores/files";
import { sessionBranchId } from "@/utils/sesion";
import type { ConceptoSolicitudPago, FacturaSolicitudPago, SolicitudPago } from "@/types/requests";

const componentProps = defineProps<{ filtrarFlag?: string | boolean }>();

const ModalPagoControlGastoComponent = defineAsyncComponent(() =>
  import("../../components/modal/modalPagoControlGasto.vue"));

const rootStore = useStore();
const filesStore = useFilesStore();
const actualizar = computed(() => rootStore.state.actualizar);

const itemsSPayment = ref<SolicitudPago[]>([]);
const search = ref("");
const dialogPagoControlGasto = ref(false);
const dialogProcess = ref(false);
const date = ref(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10));
const menu = ref(false);
const dateOnOpen = ref<string | null>(null);
const security = JSON.parse(sessionStorage.getItem("security") as string);
const payoperacion = ref("");
const paybanco = ref("");
const paymoneda = ref("");
const paymonto = ref("");
const payfile = ref("" as unknown as File | File[]);
const itemsSPaymentConceptos = ref<ConceptoSolicitudPago[]>([]);
const dialogPath = ref(false);
const pathfile = ref("");
const sPaymentId = ref("");
const paymentname = ref("");
const paymentMaster = ref("");
const paymentmonto = ref("");
const payPath = ref<string | never[]>("");
const nameproveedor = ref("");
const dialogListInvoince = ref(false);
const itemsListInvoice = ref<FacturaSolicitudPago[]>([]);
const pathfileAll = ref("");
const boolFile = ref(false);
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
    title: "Ver",
    key: "path",
  },
];
const headersPdf = [
  /* {
    text: "Nombre",

    value: "path",
  }, */
  {
    title: "Expediente",
    key: "nro_master",
  },
  {
    title: "Fecha de Disponibilidad",
    key: "fecha_disponibilidad",
  },
  {
    title: "Proveedor",
    key: "name_proveedor",
  },
  {
    title: "Quote",
    key: "id_cot",
  },
  {
    title: "Monto",
    key: "monto_letra",
  },
  {
    title: "Consignatario",
    key: "name_cosigner",
  },
  {
    title: "Ver Facturas",
    key: "invoice",
  },
  {
    title: "Ver Solicitud",
    key: "accion",
  },

  {
    title: "Ver Instructivo",
    key: "inst",
  },
  {
    title: "Status de Cobro al cliente",
    key: "pago_completo",
  },
  {
    title: "Ganancia",
    key: "ganancia",
  },

  {
    title: "Status",
    key: "status",
  },

  {
    title: "Cargar Soporte de Pago",
    key: "accions",
  },
];
const dataList = ref(false);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payFile: string | undefined;

function setDate(value: string) {
  date.value = moment(value).format("YYYY-MM-DD");
}
function onCerrarModal(cerrar: boolean) {
  if (cerrar) {
    dialogPagoControlGasto.value = !cerrar;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processPayment(id: string, path: string, master: string, monto: string, namelong: string) {
  sPaymentId.value = id;
  paymentname.value = path;
  paymentMaster.value = master;
  paymentmonto.value = monto;
  nameproveedor.value = namelong;
  _getRequestPaymentConceptos(sPaymentId.value);
  dialogProcess.value = true;
}
function openDoc(path: string) {
  window.open(path, "_blank");
}
function openPaymentFile(id: string, path: string, proveedor: string) {
  pathfileAll.value = path;
  dialogPath.value = true;
  nameproveedor.value = proveedor;
  _getRequestPaymentConceptos(id);
}
function openInvoice(id: number, id_house: number, providerName: string) {
  _getInvoice(id, id_house);
  nameproveedor.value = providerName;
  //this.dialogInvoice = true;
}
async function _getInvoice(id_proveedor: number, id_house: number) {
  const data = {
    id_house: id_house,
    id_proveedor: id_proveedor,
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getListInvoice",

    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      dialogListInvoince.value = true;
      itemsListInvoice.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
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
function editControl(nro_master: string) {
  window.open(
    "/home/folderBilling/editControlGastos/view/" + nro_master,
    "Instructivo",
    "width=1593,height=1293",
    // @ts-expect-error window.open takes three arguments
    "menubar=no",
    "location=no",
    "resizable=no",
  );
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

  setTimeout(() => {
    _getRequestPayment();
  }, 1000);
}
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

      cleandData();
      dialogProcess.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getRequestPayment() {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getRequestPayment",
    data: {
      id_branch: sessionBranchId(),
    },
    headers: {

      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsSPayment.value = response.data.data;
      dataList.value = true;
    })
    .catch(function (error) {
      console.error(error);
    });
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
function viewPdf(pdf: string) {
  window.open(import.meta.env.VITE_URL_MAIN + pdf, "_blank");
}
function abrirPagoProveedor() {
  // this.idProveedor = id;
  filesStore.payPath = null;
  dialogPagoControlGasto.value = true;
  rootStore.state.limpiar = !rootStore.state.limpiar;
}
async function reversar(item: SolicitudPago) {
  Swal.fire({
    title: "Aviso",
    text: "¿Esta seguro que quiere reversar la confirmación de esta cuenta por pagar?",
    icon: "question",
    confirmButtonText: "Si",
    denyButtonText: "No",
    showDenyButton: true,
  }).then((result) => {
    if (result.isConfirmed) {
      reversarProceso(item);
    }
  });
}
async function reversarProceso(item: SolicitudPago) {
  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "reversar_debsproveedor",

    headers: {

      "Content-Type": "application/json",
    },
    data: { id: item.id },
  };
  await axios(config)
    .then(function (response) {
      const res = response.data.data;

      Swal.fire({
        title: "Aviso",
        text: res[0].mensaje,
        icon: "info",
      });
      getDebs();
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function getDebs() {
  rootStore.state.spiner = true;
  await _getRequestPayment();
  rootStore.state.spiner = false;
}

watch(menu, (open) => {
  if (open) dateOnOpen.value = date.value;
  else date.value = dateOnOpen.value as string;
});
watch(() => componentProps.filtrarFlag, () => {
  if (componentProps.filtrarFlag == true) {
    itemsSPayment.value = itemsSPayment.value.filter((v) => v.status == 2);
  }
});
watch(actualizar, () => {
  dataList.value = false;
  itemsSPayment.value = [];
  setTimeout(() => {
    _getRequestPayment();
    rootStore.dispatch("_getBanksList");
    rootStore.dispatch("_getCoinsList");
  }, 100);
});

onMounted(async () => {
  rootStore.state.spiner = true;
  await _getRequestPayment();
  await rootStore.dispatch("_getBanksList");
  await rootStore.dispatch("_getCoinsList");
  rootStore.state.spiner = false;
});
</script>

<template>
  <div>
    <v-card
      elevation="0"
      class="mx-auto"
    >
      <v-card-title>
        <h3>Solicitudes de Pago</h3>
      </v-card-title>
      <v-card-subtitle>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="search"
              append-inner-icon="mdi-magnify"
              label="Buscar solicitud"
            />
          </v-col>
          <v-col
            cols="6"
            class="ml-auto"
          >
            <v-btn
              variant="text"
              color="orange"
              @click="abrirPagoProveedor()"
            >
              NUEVO PAGO
              <v-icon> mdi-cash-check </v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-subtitle>
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
          <v-col cols="6">
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
            v-if="item.status == 2 && item.ajusteflag == 0"
            class="ma-2 text-white"
            color="orange"
            variant="flat"
          >
            {{ item.status == 2 ? "Pendiente" : "" }}
          </v-chip>
          <v-chip
            v-if="item.status == 3 && item.ajusteflag == 0"
            class="ma-2 text-white"
            color="green"
            variant="flat"
          >
            {{ item.status == 3 ? "Pagado" : "" }}
          </v-chip>
          <v-chip
            v-if="item.ajusteflag == 1"
            class="ma-2 text-white"
            color="blue"
            variant="flat"
          >
            AJUSTADO
          </v-chip>
        </template>
        <!-- <template v-else>
          <v-chip class="ma-2 text-white" color="blue" variant="flat">
            AJUSTADO
          </v-chip>
        </template> -->
        <template #[`item.accion`]="{ item }">
          <v-icon
            class="mr-2"
            @click="viewPdf(item.path)"
          >
            mdi-eye
          </v-icon>
        </template>
        <template #[`item.pago_completo`]="{ item }">
          <v-chip
            v-if="item.pago_completo == 0"
            class="ma-2 text-white"
            color="orange"
            variant="flat"
          >
            {{ item.pago_completo == 0 ? "POR COBRAR" : "" }}
          </v-chip>
          <v-chip
            v-if="item.pago_completo == 1"
            class="ma-2 text-white"
            color="green"
            variant="flat"
          >
            {{ item.pago_completo == 1 ? "COBRADO" : "" }}
          </v-chip>
        </template>
        <template #[`item.invoice`]="{ item }">
          <v-icon
            class="mr-2"
            @click="
              openInvoice(item.id_proveedor, item.id_house, item.namelong)
            "
          >
            mdi-eye
          </v-icon>
        </template>
        <template #[`item.inst`]="{ item }">
          <v-icon
            class="mr-2"
            @click="editControl(item.code_master)"
          >
            mdi-eye
          </v-icon>
        </template>
        <template #[`item.accions`]="{ item }">
          <v-icon
            v-if="item.status == 3 && security == 1"
            color="blue-grey-darken-2"
            class="mr-2"
            @click="reversar(item)"
          >
            mdi-undo-variant
          </v-icon>

          <v-icon
            v-if="item.status == 3"
            size="large"
            color="green"
            class="mr-2"
            @click="openPaymentFile(item.id, item.pathfile, item.namelong)"
          >
            mdi-eye
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog
      width="700"
      persistent
      v-model="dialogProcess"
    >
      <v-card>
        <v-card-title>
          <h3>
            Procesar Pago del Exp. {{ paymentMaster }} por el Monto de
            {{ paymentmonto }} USD <br>
            {{ nameproveedor }}
          </h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row density="compact">
              <v-col
                cols="12"
                md="6"
              >
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  min-width="auto"
                >
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="date"
                      label="Fecha de Operación"
                      prepend-icon="mdi-calendar"
                      readonly

                      v-bind="props"
                    />
                  </template>
                  <v-locale-provider locale="es">
                    <v-date-picker
                      :model-value="date || undefined"
                      @update:model-value="setDate"
                      hide-header
                    >
                      <template #actions>
                        <v-spacer />
                        <v-btn
                          variant="text"
                          color="primary"
                          @click="menu = false"
                        >
                          Cancel
                        </v-btn>
                        <v-btn
                          variant="text"
                          color="primary"
                          @click="dateOnOpen = date; menu = false"
                        >
                          OK
                        </v-btn>
                      </template>
                    </v-date-picker>
                  </v-locale-provider>
                </v-menu>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="payoperacion"
                  label="No. Operación"
                />
              </v-col>

              <v-col
                cols="12"
                md="4"
              >
                <v-autocomplete
                  :items="rootStore.state.itemsDataBanksList"
                  v-model="paybanco"
                  item-title="acronym"
                  item-value="id"
                  label="Banco"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-autocomplete
                  :items="rootStore.state.itemsCoinsList"
                  v-model="paymoneda"
                  item-title="acronym"
                  item-value="id"
                  label="Moneda"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model="paymonto"
                  type="number"
                  label="Monto"
                />
              </v-col>
              <v-col
                cols="12"
                md="9"
              >
                <v-file-input
                  v-if="!boolFile"
                  v-model="payfile"
                  show-size
                  label="Adjuntar Pago"
                />

                <v-chip
                  block
                  v-if="boolFile"
                  size="large"
                  class=""
                  color="success"
                  variant="outlined"
                >
                  <v-icon start>
                    mdi-check
                  </v-icon>
                  Archivo cargado éxitosamente
                </v-chip>
              </v-col>
              <v-col cols="3">
                <!-- @vue-expect-error an array literal is never equal to the model -->
                <v-btn
                  :disabled="boolFile || payfile == []"
                  color="blue-grey"
                  block
                  class="ma-2 text-white"
                  size="large"
                  @click="_uploadFile()"
                >
                  Subir
                  <v-icon end>
                    mdi-cloud-upload
                  </v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="_setSPaymentFile()"
            :disabled="!boolFile"
          >
            Procesar Pago
          </v-btn>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="red"
            @click="dialogProcess = !dialogProcess"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      max-width="800"
      v-model="dialogListInvoince"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Facturas y Performance de {{ nameproveedor }}
          <v-spacer />
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersInvoice"
            :items="itemsListInvoice"
            density="compact"
            item-value="id"
            class="elevation-0"
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
              {{ item.type_pago == 1 ? "FACTURA" : "PERFORMANCE" }} -
              {{ item.number }}
            </template>
            <template #[`item.path`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                size="large"
                color="grey"
                @click="openDoc(item.path)"
              >
                mdi-eye
              </v-icon>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      width="80%"
      v-model="dialogPath"
    >
      <v-card>
        <v-card-title />
        <v-card-text>
          <v-row>
            <v-col cols="4">
              <h2>Proveedor</h2>
              <p class="text-headline-large mt-2">
                {{ nameproveedor }}
              </p>
              <h2>Conceptos pagados</h2>
              <p
                v-for="item in itemsSPaymentConceptos"
                :key="item.id"
                class="mt-5"
              >
                {{ item.name }}
              </p>
            </v-col>
            <v-col cols="8">
              <iframe
                :src="pathfileAll"
                width="100%"
                height="800px"
                frameborder="0"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogPagoControlGasto"
      max-width="80%"
      fullscreen
      transition="dialog-transition"
      persistent
      v-if="dialogPagoControlGasto"
    >
      <ModalPagoControlGastoComponent
        :limpar="true"
        @cerrar-modal="onCerrarModal"
        @cancelar="dialogPagoControlGasto = false"
      />
    </v-dialog>
  </div>
</template>


