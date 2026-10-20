<script setup lang="ts">
import { onBeforeMount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import dataHouse from "./DataHouse.vue";
import ingresos from "./IngresosControlGastos.vue";
import egresos from "./EgresosControlGastos.vue";
import services from "./ServicesBilling.vue";
import totalesProveedor from "./TotalesProveedor.vue";
import totales from "./TotalesBilling.vue";
import axios from '@/api/http';
import moment from "moment";
import Swal from "sweetalert2";
import { useEnterprisesStore } from "@/stores/enterprises";
import type { ApiResponse } from "@/types/api";
import type { AbonoCliente, DatosFactura, RespuestaFactura, SucursalFactura } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();
const enterprisesStore = useEnterprisesStore();

const panel = ref([0]);
const panels = ref([0]);
const items = 1;
const dialogDebs = ref(false);
const dialogNewDebs = ref(false);
const dialogFacturar = ref(false);
const obtenerDatosHouse = ref(false);
const payPath = ref("");
const payfile = ref("" as unknown as File | File[]);
const boolFile = ref<boolean | string>("");
const itemsDebsClient = ref<AbonoCliente[]>([]);
const branch = ref<SucursalFactura[]>([]);
const id_branch = ref<number | string>("");
const number = ref("");
const id_banks = ref("");
const id_coins = ref("");
const monto = ref("");
const comentario = ref("");
const datosFactura = ref<DatosFactura>([] as unknown as DatosFactura);
const date = ref<string | null>(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10));
const menu = ref(false);
const dateOnOpen = ref<string | null>(null);
const headersdebs = [
  {
    title: "Documento",
    align: "start",
    sortable: false,
    key: "name",
  },
  {
    title: "Fecha",
    key: "date",
  },
  {
    title: "Monto",
    key: "monto_letra",
  },
  {
    title: "Comentario de Admin.",
    key: "comentario_admin",
  },
  {
    title: "Status",
    key: "status",
  },
  {
    title: "Ver",
    key: "accion",
  },
] as const;

function _setControl(...args: unknown[]) {
  return rootStore.dispatch("_setControl", ...args);
}
function setDate(value: moment.MomentInput) {
  date.value = moment(value).format("YYYY-MM-DD");
}
function openDoc(path: string) {
  window.open(path, "_blank");
}
function all() {
  panel.value = [...Array(items).keys()].map((k, i) => i);
}
function _newDebs() {
  dialogNewDebs.value = true;
}
function _openDebs() {
  dialogDebs.value = true;
}
async function cargarBranch() {
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      "CargarBranch/" +
      (JSON.parse(sessionStorage.getItem("dataUser") as string) as { id_user: number }[])[0]!.id_user,

    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios<RespuestaFactura & { data: SucursalFactura[] }>(config).then(function (response) {
    if (response.data.statusBol == true) {
      branch.value = response.data.data;
    }
  });
}
function abrirModalFacturar() {
  dialogFacturar.value = true;
}
async function obtenerDatos() {
  obtenerDatosHouse.value = true;
  datosFactura.value = [] as unknown as DatosFactura;
  const config = {
    method: "get",
    url: `${import.meta.env.VITE_URL_MAIN}data_factura/${route.params.id_house}/${id_branch.value}`,

    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios<RespuestaFactura & { data: DatosFactura[] }>(config).then(function (response) {
    if (response.data.statusBol == true) {
      datosFactura.value = response.data.data[0]!;
    }
  });
  obtenerDatosHouse.value = false;
}
async function generarDocumento() {
  obtenerDatosHouse.value = true;
  const data = datosFactura.value;
  const config = {
    method: "post",
    url: `${import.meta.env.VITE_URL_MAIN}factura`,
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  const res = await axios<RespuestaFactura>(config).then(function (response) {
    return response;
  });

  if (res.data.statusBol == true) {
    registrarFactura(res.data);
    dialogFacturar.value = false;
    id_branch.value = "";
  }
  obtenerDatosHouse.value = false;
}
async function registrarFactura(data: RespuestaFactura) {
  const dataFactura = {
    id_house: route.params.id_house,
    nro_factura: data.nro_factura,
    url_documento: import.meta.env.VITE_URL_MAIN + data.path,
    total_monto: datosFactura.value.total_monto,
    total_igv: datosFactura.value.total_igv,
    total: datosFactura.value.total,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "registrar_factura",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: dataFactura,
  };
  await axios(config);
  window.open(import.meta.env.VITE_URL_MAIN + data.path, "_blank");
}
function cleandData() {
  date.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .substr(0, 10);
  number.value = "";
  monto.value = "";
  comentario.value = "";
  payfile.value = [];
  payPath.value = "";
  boolFile.value = false;
}
async function _delDebsClient(id: number) {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "delDebsClient/" + id,

    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function () {
      _getDebsClient();
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _setDebsClient() {
  Swal.fire({
    icon: "info",
    title: "Cargando pago...",
    text: "Por favor espere",
  });
  const data = {
    id_house: route.params.id_house,
    date: date.value,
    number: number.value,
    id_banks: id_banks.value,
    id_coins: id_coins.value,
    monto: monto.value,
    comentario_usuario: comentario.value,
    id_path: payPath.value,
    status: 1,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setDebsClient",

    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      //vm._getRequestPayment();
      //vm.itemsSPayment = response.data.data;
      Swal.fire({
        icon: "success",
        title: "Pago Cargado",
        text: "El pago ha sido cargado correctamente",
      });

      _getDebsClient();

      cleandData();
      dialogNewDebs.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getDebsClient() {
  const data = {
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN +
      "getDebsClient/" +
      route.params.id_house,

    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios<RespuestaFactura & { data: AbonoCliente[] }>(config)
    .then(function (response) {
      itemsDebsClient.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _uploadFile() {
  const data = new FormData();
  data.append("name", "Prueba");
  data.append("file", payfile.value as Blob);

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios<ApiResponse<{ insertid: number }[]>>(config)
    .then(function (response) {
      boolFile.value = true;
      payPath.value = JSON.stringify(response.data.data[0]!.insertid);
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _generatePDF() {
  Swal.fire({
    icon: "info",
    title: "Generando PDF...",
    text: "Por favor espere",
  });
  let sentido;
  if (rootStore.state.report_id_sentido == "") {
    sentido = "";
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sentido = rootStore.state.report_id_sentido;
  }
  const data = {
    nombre_impuesto: enterprisesStore.impuesto.nombre_impuesto,
    nro_control: rootStore.state.dataControl_Numero,
    profit: (
      (rootStore.state.totalTotalIngresos
        ? rootStore.state.totalTotalIngresos
        : 0) -
      (rootStore.state.totalTotalEgresos
        ? rootStore.state.totalTotalEgresos
        : 0)
    ).toFixed(2),
    code_master: rootStore.state.dataHouse_code_master,
    code_house: rootStore.state.dataHouse_code_house,
    sentido: rootStore.state.dataHouse_modality,
    tipo_embarque: rootStore.state.dataHouse_shipment,
    puerto_origen: rootStore.state.dataHouse_port_begin,
    puerto_destino: rootStore.state.dataHouse_port_end,
    agente: rootStore.state.dataHouse_agente,
    consignatario: rootStore.state.dataHouse_consigners,
    notify: rootStore.state.dataHouse_notify,
    bultos: rootStore.state.dataHouse_bultos,
    peso: rootStore.state.dataHouse_peso,
    volumen: rootStore.state.dataHouse_volumen,
    itemsIngreso: rootStore.state.itemsDataIngresosList,
    itemsEgreso: rootStore.state.itemsDataEgresosList,
    itemsTotalesProveedores: rootStore.state.itemsDataTotalesProveedor,
    ruc: rootStore.state.dataHouse_ruc,
    totalIngreso: rootStore.state.totalIngresos,
    totalIngresoOp: rootStore.state.totalIngresosOp,
    totalEgreso: rootStore.state.totalEgresos,
    totalEgresoOp: rootStore.state.totalEgresosOp,
    exp: rootStore.state.dataHouse_exp,
    totalIgv: rootStore.state.dataHouse_exp,
    totalIgvEgresos: rootStore.state.totalIgvEgresos,
    totalIgvEgresosOp: rootStore.state.totalIgvEgresosOp,
    totalTotalEgresos: rootStore.state.totalTotalEgresos,
    totalTotalEgresosOp: rootStore.state.totalTotalEgresosOp,
    totalIgvIngresos: rootStore.state.totalIgvIngresos,
    totalIgvIngresosOp: rootStore.state.totalIgvIngresosOp,
    totalTotalIngresos: rootStore.state.totalTotalIngresos,
    totalTotalIngresosOp: rootStore.state.totalTotalIngresosOp,
    gananciapr: (
      (rootStore.state.totalTotalIngresos
        ? rootStore.state.totalTotalIngresos
        : 0) -
      (rootStore.state.totalTotalEgresos
        ? rootStore.state.totalTotalEgresos
        : 0)
    ).toFixed(2),
    igvpr: Math.abs(
      (
        rootStore.state.totalIgvIngresos -
        rootStore.state.totalIgvEgresos
      ).toFixed(2) as unknown as number
    ),
    subtotalpr: (
      rootStore.state.totalTotalIngresos -
      rootStore.state.totalTotalEgresos
    ).toFixed(2),
    gananciaop: (
      (rootStore.state.totalTotalIngresosOp
        ? rootStore.state.totalTotalIngresosOp
        : 0) -
      (rootStore.state.totalTotalEgresosOp
        ? rootStore.state.totalTotalEgresosOp
        : 0)
    ).toFixed(2),
    igvop: Math.abs(
      (
        rootStore.state.totalIgvIngresosOp -
        rootStore.state.totalIgvEgresosOp
      ).toFixed(2) as unknown as number
    ),
    subtotalop: (
      rootStore.state.totalTotalIngresosOp -
      rootStore.state.totalTotalEgresosOp
    ).toFixed(2),
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getPdfInstructivo",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      Swal.fire({
        icon: "success",
        title: "PDF Generado",
        text: "El PDF se descargará automaticamente",
      });

      window.open(
        import.meta.env.VITE_URL_MAIN + "INSTRUCTIVO.pdf",
        "_blank"
      );
    })
    .catch(function (error) {
      console.error(error);
    });
}

watch(menu, (open) => {
  if (open) dateOnOpen.value = date.value;
  else date.value = dateOnOpen.value;
});

onBeforeMount(() => {
  _getDebsClient();
});
onMounted(() => {
  rootStore.state.dataControl_id_house = route.params.id_house;
  all();
  rootStore.dispatch("_getBanksList");
  rootStore.dispatch("_getCoinsList");
  cargarBranch();
  if (route.params.id_control) {
    rootStore.state.drawer = false;
    rootStore.state.dataControl_id_user = (JSON.parse(
      sessionStorage.getItem("dataUser") as string
    ) as { id: number }[])[0]!.id;
  }
  rootStore.state.drawer = false;
});
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col
          cols="9"
          md="8"
        >
          <v-card class="cardHouse">
            <v-card-text>
              <dataHouse />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col>
          <v-btn
            v-if="!route.params.id_control"
            block
            @click="_setControl"
            :disabled="rootStore.state.dataControl_Numero != ''"
            color="primary"
          >
            GENERAR CONTROL
          </v-btn>
          <v-btn
            v-if="route.params.id_control"
            block
            @click="_setControl"
            :disabled="rootStore.state.dataControl_Numero != ''"
            color="primary"
          >
            GENERAR NUEVA VERSION DE CONTROL
          </v-btn>

          <v-btn
            :disabled="!route.params.id_control"
            @click="_generatePDF()"
            block
            color="orange"
            class="mt-2"
          >
            IMPRIMIR CONTROL
          </v-btn>

          <v-btn
            :disabled="rootStore.state.dataControl_Numero == ''"
            block
            color="primary"
            class="mt-2"
            @click="_openDebs()"
          >
            CARGAR ABONOS DEL CLIENTE
          </v-btn>
          <v-btn
            :disabled="rootStore.state.dataControl_Numero == ''"
            block
            color="pink"
            class="mt-2"
            @click="abrirModalFacturar()"
          >
            EMITIR FACTURA A CLIENTE
          </v-btn>
        </v-col>
        <v-col
          cols="12"
          md="8"
        >
          <v-expansion-panels
            v-model="panel"
            multiple
          >
            <v-expansion-panel
              v-for="(item, i) in items"
              :key="i"
            >
              <v-expansion-panel-title>
                <b>Ingresos </b>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <ingresos />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-expansion-panels
            class="mt-5"
            v-model="panels"
            multiple
          >
            <v-expansion-panel
              v-for="(item, i) in items"
              :key="i"
            >
              <v-expansion-panel-title>
                <b>Costos </b>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <egresos />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-card
            class="mt-5"
            :disabled="rootStore.state.dataControl_Numero == ''"
          >
            <v-card-text>
              <totales />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <b>Servicios a Realizar</b>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <services />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-card
            class="mt-5"
            :disabled="rootStore.state.dataControl_Numero == ''"
          >
            <v-card-text>
              <totalesProveedor />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" />

        <v-dialog
          max-width="900"
          v-model="dialogDebs"
        >
          <v-card>
            <v-card-title class="d-flex align-center flex-wrap">
              Abonos del cliente
              <v-spacer />
              <v-btn
                variant="outlined"
                color="primary"
                @click="_newDebs()"
              >
                CARGAR NUEVO ABONO
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="headersdebs"
                :items="itemsDebsClient"
              >
                <template #[`item.accion`]="{ item }">
                  <v-icon
                    class="btn_add mr-2"
                    size="large"
                    color="grey"
                    @click="openDoc(item.path)"
                  >
                    mdi-eye
                  </v-icon>

                  <v-icon
                    class="btn_add mr-2"
                    size="large"
                    color="red"
                    v-if="item.status == 1"
                    @click="_delDebsClient(item.id)"
                  >
                    mdi-delete
                  </v-icon>
                </template>
                <template #[`item.status`]="{ item }">
                  <v-chip
                    block
                    v-if="item.status == 2"
                    size="small"
                    class=""
                    color="success"
                    variant="outlined"
                  >
                    <v-icon start>
                      mdi-check
                    </v-icon>
                    Confirmado
                  </v-chip>
                  <v-chip
                    block
                    v-if="item.status == 1"
                    size="small"
                    class=""
                    color="orange"
                    variant="outlined"
                  >
                    <v-icon start>
                      mdi-warning
                    </v-icon>
                    Por Confirmar
                  </v-chip>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-dialog
          max-width="800"
          v-model="dialogNewDebs"
        >
          <v-card>
            <v-card-title class="d-flex align-center flex-wrap">
              Cargar un nuevo abono
              <v-spacer />
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
                          :model-value="date"
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
                      v-model="number"
                      label="No. Operación"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="4"
                  >
                    <v-autocomplete
                      :items="rootStore.state.itemsDataBanksList"
                      v-model="id_banks"
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
                      v-model="id_coins"
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
                      v-model="monto"
                      type="number"
                      label="Monto"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    md="12"
                  >
                    <v-textarea
                      rows="2"
                      v-model="comentario"
                      label="Comentario"
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
                    <!-- @vue-expect-error comparing an array by reference is always false -->
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
                @click="_setDebsClient()"
                :disabled="!boolFile"
              >
                GUARDAR ABONO
              </v-btn>
              <v-spacer />
              <v-btn
                variant="outlined"
                color="red"
                @click="dialogNewDebs = !dialogNewDebs"
              >
                Cerrar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
    </v-container>
    <v-dialog
      v-model="dialogFacturar"
      scrollable
      persistent
      :overlay="false"
      max-width="50%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          GENERAR FACTURA
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <v-autocomplete
                :items="branch"
                item-title="trade_name"
                item-value="id"
                label="Sucursal"
                placeholder="Seleccione una sucursal"
                v-model="id_branch"
                @update:model-value="obtenerDatos()"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            :loading="obtenerDatosHouse"
            :disabled="id_branch == ''"
            @click="generarDocumento()"
          >
            Generar Facturar
          </v-btn>
          <v-btn
            color="warning"
            @click="dialogFacturar = !dialogFacturar"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
.cardHouse {
  height: 150px;
  overflow-y: scroll;
}

.cardHouse::-webkit-scrollbar {
  width: 0px;
}
</style>
