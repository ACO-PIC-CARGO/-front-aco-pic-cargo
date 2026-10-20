<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useBancosStore } from "@/stores/bancos";
import { useControlGastosStore } from "@/stores/controlGastos";
import { sessionBranchId } from "@/utils/sesion";

withDefaults(defineProps<{ editable?: boolean }>(), { editable: true });

const Ingresos = defineAsyncComponent(() => import("./IngresosControlGastos.vue"));
const Egresos = defineAsyncComponent(() => import("./EgresosControlGastos.vue"));

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const controlGastosStore = useControlGastosStore();
const bancosStore = useBancosStore();
const enterprisesStore = useEnterprisesStore();

const id_coins = ref<number | string | null>(null);
const ingreso_pr = ref(0);
const egreso_pr = ref(0);
const ingreso_op = ref(0);
const egreso_op = ref(0);
// dialogDebs: false,
const prFlag = ref(false);
const opFlag = ref(false);
// dialogNewDebs: false,
const statusBtn = ref(1);
const payPath = ref("");
// date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
//   .toISOString()
//   .substr(0, 10),
const number = ref("");
const monto = ref<number | string>(0.0);
const monto_abonado = ref<number | string>("");
const id_cuenta_pic = ref("");
const tipocambio = ref(1);
const comentario = ref("");
// sufmoneda: "",
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let date: string;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payfile: unknown;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let boolFile: boolean;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let codigo_master: unknown;

// ...mapAction([])
// --------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function irAEditar(_ignored?: boolean) {
  const id_branch =
    controlGastosStore.listControlGastos[0]!.id_branch;
  if (
    !(
      sessionBranchId() ==
      id_branch
    )
  ) {
    Swal.fire({
      icon: "error",
      text: "El expediente pertenece a otra sucursal, por favor logueese con la otra sucursal.",
    });
    return;
  }
  router.push({
    name: "editControlGasto",
    params: {
      id: route.params.id,
      id_branch: id_branch,
    },
  });
}
function to_direct({ url }: { url: string }) {
  window.open(url, "_blank");
}
// --------------------
async function recargarDatos() {
  appStore.spiner = true;
  await Promise.all([
    controlGastosStore.getListControlGastos(route.params.id as string),
    controlGastosStore.getListControlGastosHouses(route.params.id as string),
    controlGastosStore.getListControlGastosMaster(route.params.id as string),
  ]);
  appStore.spiner = false;
  appStore._getCoinsList();
}
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calcularMontoDolar() {
  monto.value = parseFloat(
    String(((monto_abonado.value ? monto_abonado.value : 0) as number) / tipocambio.value),
  ).toFixed(2);
}
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function openDoc(path: string) {
  window.open(path, "_blank");
}
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cleandData() {
  date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .substr(0, 10);
  number.value = "";
  monto.value = 0;
  comentario.value = "";
  payfile = [];
  payPath.value = "";
  boolFile = false;
  id_cuenta_pic.value = "";
  tipocambio.value = 1;
  id_coins.value = "";
  monto_abonado.value = "";
  number.value = "";
}
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function currentDate() {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const current = new Date();
  const date = `${current.getDate()} de ${
    monthNames[current.getMonth()]
  } del ${current.getFullYear()}`;
  return date;
}
function calcularProfit() {
  nextTick(() => {
    setTimeout(() => {
      const house = controlGastosStore.master_houses || [];
      const egr = controlGastosStore.master_egresos || [];
      ingreso_pr.value = house
        .map((element) => {
          return element.total_total_pr_ingresos as number;
        })
        .reduce((a, b) => {
          return a + b;
        }, 0);
      ingreso_op.value = house
        .map((element) => {
          return element.total_total_op_ingresos as number;
        })
        .reduce((a, b) => {
          return a + b;
        }, 0);

      egreso_pr.value = egr
        .map((element) => {
          return element.total_total_pr as number;
        })
        .reduce((a, b) => {
          return a + b;
        }, 0);
      egreso_op.value = egr
        .map((element) => {
          return element.total_total_op as number;
        })
        .reduce((a, b) => {
          return a + b;
        }, 0);
    }, 1000);
  });
}
async function imprimirControlDetallado(guardarEnCarpeta: boolean) {
  // vm._calcularTotales();
  if (!guardarEnCarpeta) {
    Swal.fire({
      icon: "info",
      title: "Generando PDF...",
      text: "Por favor espere",
    });
  } else {
    Swal.fire({
      icon: "warning",
      title: "Moviendo",
      text: "Se avisará cuando se haya guardado",
      timer: 2000,
    });
  }
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getPdfInstructivoDetallado",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      ...route.params,
      guardarEnCarpeta: guardarEnCarpeta,
      asociadoflag:false,
      folders_quote:
        controlGastosStore.listControlGastos[0]!.folders_quote,
    },
  };
  await axios<{ path: string }>(config)
    .then(function (response) {
      Swal.fire({
        icon: "success",
        title: guardarEnCarpeta ? "PDF Guardado" : "PDF Generado",
        text: guardarEnCarpeta
          ? "Se guardó en la carpeta el pdf."
          : "El PDF se descargará automaticamente",
      });
      if (!guardarEnCarpeta) {
        window.open(
          import.meta.env.VITE_URL_MAIN + response.data.path,
          "_blank",
        );
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}

// ----------------------------------------------------------
function departamentoSesion() {
  return (JSON.parse(sessionStorage.getItem("dataUser") as string) as { departamento: number }[])[0]!.departamento;
}

onMounted(async () => {
  appStore.spiner = true;
  prFlag.value =
    departamentoSesion() == 1
      ? true
      : false;
  opFlag.value =
    departamentoSesion() == 2
      ? true
      : false;
  controlGastosStore.getListControlGastos(route.params.id as string);
  await Promise.all([
    controlGastosStore.getListControlGastosHouses(route.params.id as string),
    controlGastosStore.getListControlGastosMaster(route.params.id as string),
  ]);
  appStore.spiner = false;
  await Promise.all([
    enterprisesStore.obtenerImpuestoXEmpresa(route.params.id_branch as string),
    controlGastosStore.cargarCorrelativo(),
    appStore.cargarBranch(),
    appStore._getBanksList(),
    appStore._getCoinsList(),
    bancosStore.getListBanksDetailsCargar(),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  await appStore._getProveedor(), calcularProfit();
  codigo_master =
    controlGastosStore.listControlGastos[0]!.master_nromaster;
  appStore.spiner = false;
});
</script>

<template>
  <v-container
    fluid
    class="py-0 mx-0"
  >
    <v-row>
      <v-col
        cols="12"
        md="8"
        xl="8"
        lg="8"
      >
        <v-card
          class="cardHouse"
          v-if="controlGastosStore"
        >
          <v-card-text>
            <v-row>
              <v-col
                cols="12"
                xl="3"
                lg="3"
              >
                <div class="divExped">
                  <!-- <h3>N° CONTROL: {{ $store.state.dataControl_Numero }}</h3> -->
                  <h3 class="mt-4">
                    Master:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_codemaster) ||
                        ""
                    }}
                  </h3>
                  <h3 class="mt-1">
                    <!-- House: {{ $store.state.dataHouse_code_house }} -->
                  </h3>
                </div>
              </v-col>
              <v-col
                cols="12"
                xl="3"
                lg="3"
              >
                <h3>Datos Generales</h3>

                <div>
                  <p>
                    Sentido:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_modality) ||
                        ""
                    }}
                  </p>
                  <p>
                    Tipo de Embarque:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_shipment) ||
                        ""
                    }}
                  </p>
                  <p>
                    Puerto de Origen:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_port_begin) ||
                        ""
                    }}
                  </p>
                  <p>
                    Puerto de Destino:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_port_end) ||
                        ""
                    }}
                  </p>
                </div>
              </v-col>
              <v-col
                cols="12"
                xl="3"
                lg="3"
              >
                <h3>Datos del Embarque</h3>

                <div>
                  <p>
                    Agente:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_operador) ||
                        ""
                    }}
                  </p>
                  <p>
                    Consignatario:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_consigner) ||
                        ""
                    }}
                  </p>
                  <p>
                    Notify:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_notify) ||
                        ""
                    }}
                  </p>
                </div>
              </v-col>
              <v-col
                cols="12"
                xl="3"
                lg="3"
              >
                <h3>Datos de la carga</h3>

                <div>
                  <p>
                    Bultos:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_bultos) ||
                        ""
                    }}
                  </p>
                  <p>
                    Peso:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_peso) ||
                        ""
                    }}
                    Kg
                  </p>
                  <p>
                    Volumen:
                    {{
                      (controlGastosStore.listControlGastos[0] &&
                        controlGastosStore.listControlGastos[0]
                          .master_volumen) ||
                        ""
                    }}
                    m<sup>3</sup>
                  </p>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        lg="4"
        xl="4"
        md="4"
      >
        <v-alert
          class="my-1 text-center"
          border="start"
          border-color="deep-purple-accent-4"
          elevation="2"
          variant="outlined"
          prominent
          density="compact"
        >
          <template #prepend>
            <v-icon color="deep-purple-accent-4">
              mdi-currency-usd
            </v-icon>
          </template>
          <h2>
            PROFIT PR:
            {{ parseFloat(String(ingreso_pr - egreso_pr)).toFixed(2) }} USD / OP:
            {{ parseFloat(String(ingreso_op - egreso_op)).toFixed(2) }} USD
          </h2>
        </v-alert>

        <v-btn
          color="info"
          class="my-1"
          block
          size="small"
          v-if="!editable"
          @click="irAEditar(false)"
        >
          <v-icon class="mx-1">
            mdi-pencil
          </v-icon> EDITAR
        </v-btn>
        <v-btn
          color="red"
          class="my-1"
          block
          size="small"
          @click="imprimirControlDetallado(false)"
        >
          <v-icon class="mx-1">
            mdi-printer-outline
          </v-icon> CONTROL DETALLADO
        </v-btn>
        <v-btn
          color="teal-darken-4"
          class="my-1"
          block
          size="small"
          @click="imprimirControlDetallado(true)"
        >
          <v-icon class="mx-1">
            mdi-content-save-all-outline
          </v-icon> CONTROL
          DETALLADO
        </v-btn>
        <v-btn
          color="#FFD600"
          class="my-1"
          size="small"
          block
          v-if="
            Object.keys(controlGastosStore.listControlGastos).length >
              0 &&
              controlGastosStore.listControlGastos[0]!.url_folderonedrive
          "
          @click="
            to_direct({
              url: controlGastosStore.listControlGastos[0]!
                .url_folderonedrive as string,
            })
          "
        >
          <v-icon class="mx-2">
            mdi-folder
          </v-icon> ABRIR CARPETA
        </v-btn>
      </v-col>
      <v-col cols="12">
        <Ingresos
          @recargar-datos="recargarDatos()"
          :pr-flag="prFlag"
          :op-flag="opFlag"
          :ingreso_pr="ingreso_pr"
          :ingreso_op="ingreso_op"
          @recalcular-profit="calcularProfit()"
          :editable="editable"
          :master_houses="controlGastosStore.master_houses"
        />
      </v-col>
      <!-- EGRESOS -->
      <v-col cols="12">
        <Egresos
          :status-btn="statusBtn"
          :pr-flag="prFlag"
          :op-flag="opFlag"
          :egreso_pr="egreso_pr"
          :egreso_op="egreso_op"
          @recalcular-profit="calcularProfit()"
          @status-btn="statusBtn = $event"
          @recargar-datos="recargarDatos()"
          :editable="editable"
          :master_egresos="controlGastosStore.master_egresos"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.divExped {
  background: #eaeaea;
  border-radius: 5px;
  padding: 10px;
}

p {
  margin: 0px;
}
</style>
