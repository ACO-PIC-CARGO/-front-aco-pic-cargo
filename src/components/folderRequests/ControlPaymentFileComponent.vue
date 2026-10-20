<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from "@/api/http";
import moment from "moment";
import type { EgresoExpediente, ExpedienteSinSolicitud } from "@/types/requests";

const appStore = useAppStore();
const appRouter = useRouter();
const itemsHouseListAll = computed<ExpedienteSinSolicitud[]>(() => appStore.itemsHouseListAll);

const search = ref("");
const dialogPayment = ref(false);
const nameconsigner = ref("");
const boolFile = ref(false);
const paybanco = ref("");
const paymoneda = ref("");
const paymonto = ref("");
const payfile = ref("" as unknown as File | File[]);
const payPath = ref<string | never[]>("");
const pathfile = ref("");
const date = ref(
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .substr(0, 10),
);
const menu = ref(false);
const dateOnOpen = ref<string | null>(null);
const id_house = ref("");
const nro_master = ref("");
const itemsEgresos = ref<EgresoExpediente[]>([]);
const selected = ref<EgresoExpediente[]>([]);

const headersEgresos = ref([
  { title: "Concepto", key: "concepto" },

  { title: "Monto Pricing", key: "total_pr" },
  { title: "Monto Operaciones", key: "total_op" },
  { title: "Status", key: "status" },
]);

const headers = ref([
  { title: "Master", key: "code_master" },
  {
    title: "Codigo",
    align: "start" as const,
    key: "code_house",
  },

  { title: "Expediente", key: "nro_master" },
  { title: "Sentido", key: "namemodality" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },

  { title: "Consignatario", key: "nameconsigner" },
  { title: "Fecha Disponibilidad", key: "fecha_disponibilidad" },

  { title: "Notify", key: "namenotify" },
  { title: "Pagado", key: "pagadode" },

  { title: "Pagar", key: "actions" },
]);

let payoperacion: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let dialogProcess: boolean | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payFile: string | undefined;

function setDate(value: string) {
  date.value = moment(value).format("YYYY-MM-DD");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function editHouse(id: number) {
  appRouter.push("/home/folderHouse/control/" + id);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function selectHouse(id: number) {
  appRouter.push("/home/folderBilling/billControlGastos/" + id);
}
function setPayment(id: string, masterNumber: string, consignerName: string) {
  nro_master.value = masterNumber;
  nameconsigner.value = consignerName;
  id_house.value = id;
  getEgresosExpedientes();
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

function openPaymentFile(path: string) {
  window.open(path, "_blank");
}

async function _setSPaymentFile() {
  Swal.fire({
    icon: "info",
    title: "Procesando pago...",
    text: "Por favor espere",
  });
  const data = {
    fecha_operacion: date.value,
    nro_operacion: payoperacion,
    id_banks: paybanco.value,
    id_coins: paymoneda.value,
    monto: paymonto.value,
    id_path: payPath.value,
    status: 1,
    id_request: "",
    itemsSPaymentConceptos: selected.value,
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
      dialogProcess = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function cleandData() {
  date.value = "";
  payoperacion = "";
  paybanco.value = "";
  paymoneda.value = "";
  paymonto.value = "";
  payPath.value = [];
  payFile = "";
  pathfile.value = "";
  boolFile.value = false;
  selected.value = [];

  setTimeout(() => {
    getEgresosExpedientes();
  }, 1000);
}
function getEgresosExpedientes() {
  const data = {
    id_house: id_house.value,
  };
  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN + "getEgresosExpediente/" + id_house.value,
    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      itemsEgresos.value = response.data.data;
      dialogPayment.value = true;
    })
    .catch(function (error) {
      console.error(error);
    });
}

watch(menu, (open) => {
  if (open) dateOnOpen.value = date.value;
  else date.value = dateOnOpen.value as string;
});

onMounted(() => {
  appStore._getHouseListAll();
});
</script>

<template>
  <div>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        Pagar Expedientes sin Solicitud
        <v-spacer />
        <v-text-field
          v-model="search"
          label="Buscar"
        />
      </v-card-title>
      <v-card-text>
        <v-data-table
          v-if="appStore.dataHouse"
          :headers="headers"
          :items="itemsHouseListAll"
          :search="search"
        >
          <template #[`item.actions`]="{ item }">
            <!-- @vue-expect-error statusList is not defined -->
            <v-icon
              v-if="statusList != '2'"
              size="large"
              color="dark"
              class="mr-2"
              @click="setPayment(item.id, item.nro_master, item.nameconsigner)"
            >
              mdi-cash-check
            </v-icon>

            <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="dialogPayment"
      max-width="900"
    >
      <v-card>
        <v-card-title>
          Procesar pago para el Expediente {{ nro_master }} de
          {{ nameconsigner }}
        </v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row density="compact">
              <v-col cols="12">
                <v-data-table
                  v-model="selected"
                  :headers="headersEgresos"
                  :items="itemsEgresos"
                  item-value="id"
                  return-object
                  show-select
                  class="elevation-0"
                >
                  <template
                    #[`item.data-table-select`]="{ item, props }"
                  >
                    <v-checkbox-btn
                      v-bind="props"
                      :readonly="item.pagado == 1"
                      :disabled="item.pagado == 1"
                    />
                  </template>
                  <template #[`item.status`]="{ item }">
                    <v-chip
                      v-if="item.pagado == 1"
                      class="ma-2 text-white"
                      color="green"
                      size="small"
                      variant="flat"
                    >
                      {{ item.status == 1 ? "Pagado" : "" }}
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
                </v-data-table>
              </v-col>
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
                  :items="appStore.itemsDataBanksList"
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
                  :items="appStore.itemsCoinsList"
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
            GUARDAR PAGO
          </v-btn>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="red"
            @click="dialogPayment = !dialogPayment"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


