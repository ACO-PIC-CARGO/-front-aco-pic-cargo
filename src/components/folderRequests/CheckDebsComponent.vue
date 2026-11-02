<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { sessionBranchId } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, hasFailed, request } from "@/utils/request";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import type { AbonoCliente, ConceptoSolicitudPago } from "@/types/requests";

const appStore = useAppStore();
const appRouter = useRouter();

const itemsSPayment = ref<unknown[]>([]);
const search = ref("");
const dialogProcess = ref(false);
const date = ref(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10));
const security = JSON.parse(sessionStorage.getItem("security") as string);
const checkComision = ref<boolean | string>(false);
const montocomision = ref("");
const comentarioadmin = ref("");
const payfile = ref("" as unknown as File | File[]);
const pathRuta = ref("");
const itemsSPaymentConceptos = ref<ConceptoSolicitudPago[]>([]);
const dialogPath = ref(false);
const sPaymentId = ref("");
const paymentname = ref("");
const paymentMaster = ref("");
const paymentmonto = ref("");
const payPath = ref("");
const nameproveedor = ref("");
const itemsDebsClient = ref<AbonoCliente[]>([]);
const pathfileAll = ref("");
const boolFile = ref(false);
const errorNroOp = ref("");
const nro_operacion = ref("");
const headersdebs = [
  {
    title: "Documento",
    align: "start" as const,
    sortable: false,
    key: "name",
  },
  {
    title: "Expediente",
    key: "nro_master",
  },
  {
    title: "Nro Operación",
    key: "nro_operacion",
  },

  {
    title: "Cliente",
    key: "nameconsigner",
  },
  {
    title: "Fecha",
    key: "date",
  },
  {
    title: "Monto Factura Cliente (USD)",
    key: "monto_letra_pic",
  },
  {
    title: "Tipo de Cambio",
    key: "tipocambio",
  },
  {
    title: "Monto ingresado al Banco",
    key: "monto_letra",
  },

  {
    title: "Monto a pagar a proveedores",
    key: "monto_pagar_pro",
  },
  // {
  //   text: "total cobrado al cliente",
  //   value: "monto_cobrado",
  // },
  {
    title: "Comentario del solicitante",
    key: "comentario_usuario",
  },
  {
    title: "Status",
    key: "status",
  },

  {
    title: "Ver",
    key: "accion",
  },
  {
    title: "Instructivo",
    key: "instructivo",
  },

  {
    title: "Acciones",
    key: "accions",
  },
];
const dataList = ref(false);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payoperacion: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let paybanco: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let paymoneda: string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let paymonto: string | undefined;

function getDebs() {
  appStore.spiner = true;
  _getDebsClient();
  appStore.spiner = false;
}
function editControl(id_master: number) {
  appRouter.push({
    name: "editControlGasto",
    params: {
      id: id_master,
      id_branch: sessionBranchId(),
    },
  });
  // window.open(
  //   "/home/folderBilling/editControlGastos/view/" + nro_master,
  //   "Instructivo",
  //   "width=1593,height=1293",
  //   "menubar=no",
  //   "location=no",
  //   "resizable=no"
  // );
}
function processPayment(id: string, path: string, master: string, monto: string, namelong: string) {
  sPaymentId.value = id;
  paymentname.value = path;
  pathRuta.value = path;
  paymentMaster.value = master;
  paymentmonto.value = monto;
  nameproveedor.value = namelong;
  errorNroOp.value = "";
  nro_operacion.value = "";
  dialogProcess.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function openDoc(path: string) {
  window.open(path, "_blank");
}
async function reversar(item: AbonoCliente) {
  Swal.fire({
    title: "Aviso",
    text: "¿Esta seguro que quiere reversar la confirmación de esta cuenta por cobrar?",
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
async function reversarProceso(item: AbonoCliente) {
  const answer = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "reversar_debscliente",
    data: { id: item.id },
  });
  Swal.fire({ icon: answer.estadoflag ? "success" : answer.tipomensaje === "TMSGERR" ? "error" : "info", text: answer.mensaje || CONNECTION_ERROR_MESSAGE });
  if (answer.estadoflag) getDebs();
}
function openPaymentFile(id: string, path: string, proveedor: string) {
  pathfileAll.value = path;
  dialogPath.value = true;
  nameproveedor.value = proveedor;
  _getRequestPaymentConceptos(id);
}
const _getInvoice = undefined as unknown as (id: number, idHouse: number) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function openInvoice(id: number, id_house: number, providerName: string) {
  _getInvoice(id, id_house);
  nameproveedor.value = providerName;
  //this.dialogInvoice = true;
}
async function _getDebsClient() {
  const answer = await request<AbonoCliente>({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getDebsClientList",
  });
  if (hasFailed(answer)) showRejectedResponse(answer);
  itemsDebsClient.value = answer.data;
  dataList.value = true;
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
function cleandData() {
  date.value = "";
  payoperacion = "";
  paybanco = "";
  paymoneda = "";
  paymonto = "";
  payPath.value = "";
  montocomision.value = "";
  checkComision.value = "";
  comentarioadmin.value = "";
}
async function _setCheckDebsClient() {
  if (!nro_operacion.value) {
    errorNroOp.value = "Escribe el número de operación del banco.";
    return;
  }
  Swal.fire({
    icon: "info",
    title: "Aprobando el abono...",
    text: "Espera un momento.",
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
  const answer = await request({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setCheckDebsClient",
    data: {
      id: sPaymentId.value,
      nro_operacion: nro_operacion.value,
      comentario_admin: comentarioadmin.value || null,
      checkComision: checkComision.value === true,
      comision: montocomision.value || null,
    },
  });
  if (!answer.estadoflag) {
    showRejectedResponse(answer);
    return;
  }
  Swal.fire({ icon: "success", title: "Abono aprobado", text: answer.mensaje });
  cleandData();
  dialogProcess.value = false;
  await _getDebsClient();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  window.open(pdf, "_blank");
}

onMounted(async () => {
  appStore.spiner = true;
  await _getDebsClient();
  await appStore._getBanksList();
  await appStore._getCoinsList();
  appStore.spiner = false;
});
</script>

<template>
  <div>
    <v-card
      elevation="0"
      class="mx-auto"
    >
      <v-card-text>
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar abono"
          single-line
          hide-details
        />
      </v-card-text>

      <v-data-table
        :headers="headersdebs"
        :items="itemsDebsClient"
        :search="search"
        no-data-text="No hay abonos de clientes por confirmar ni confirmados en tu empresa."
      >
        <template #[`item.status`]="{ item }">
          <v-chip
            v-if="item.status == 1"
            class="ma-2 text-white"
            color="orange"
            variant="flat"
          >
            {{ item.status == 1 ? "Por Confirmar" : "" }}
          </v-chip>
          <v-chip
            v-if="item.status == 2"
            class="ma-2 text-white"
            color="green"
            variant="flat"
          >
            {{ item.status == 2 ? "Confirmado" : "" }}
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
        <template #[`item.instructivo`]="{ item }">
          <v-icon
            color="info"
            class="mr-2"
            @click="editControl(item.id_master)"
          >
            mdi-pencil
          </v-icon>
        </template>

        <template #[`item.accions`]="{ item }">
          <v-icon
            v-if="item.status == 1"
            color="blue-grey-darken-2"
            class="mr-2"
            @click="
              processPayment(
                item.id,
                item.path,
                item.nro_master,
                item.monto_letra,
                item.name
              )
            "
          >
            mdi-check-circle
          </v-icon>
          <v-icon
            v-if="item.status == 2 && security == 1"
            color="blue-grey-darken-2"
            class="mr-2"
            @click="reversar(item)"
          >
            mdi-undo-variant
          </v-icon>

          <v-icon
            v-if="item.status == 3"
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
            Aprobar Pago por el Monto de
            {{ paymentmonto }} <br>
            {{ nameproveedor }}
          </h3>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row density="compact">
              <v-col cols="12">
                <iframe
                  width="100%"
                  height="400px"
                  :src="pathRuta"
                  frameborder="0"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  label="Nro operacion en Cuenta de Banco"
                  required
                  v-model="nro_operacion"
                  :error-messages="errorNroOp"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-checkbox
                  v-model="checkComision"
                  label="Aplica comisión"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="montocomision"
                  type="number"
                  v-if="checkComision"
                  label="Monto de la comisión"
                />
              </v-col>
              <v-col
                cols="12"
                md="12"
              >
                <v-textarea
                  v-model="comentarioadmin"
                  label="Comentario"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="_setCheckDebsClient()"
          >
            Aprobar Pago
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
  </div>
</template>


