<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useBancosStore } from "@/stores/bancos";
import { useControlGastosStore } from "@/stores/controlGastos";
import { sessionBranchId } from "@/utils/sesion";
import { downloadPdf } from "@/utils/pdfDownload";
import { usePermissions } from "@/composables/usePermissions";
import { useModoVer } from "@/composables/useModoVer";
import "@/styles/control-gastos-responsive.css";

const { smAndDown } = useDisplay();
const props = withDefaults(defineProps<{ editable?: boolean }>(), { editable: true });
// Modo ver: se muestra igual que el editar; las acciones se bloquean con un aviso (useModoVer)
const modoVer = computed(() => !props.editable);

const Ingresos = defineAsyncComponent(() => import("./IngresosControlGastos.vue"));
const Egresos = defineAsyncComponent(() => import("./EgresosControlGastos.vue"));
const SolicitudesPago = defineAsyncComponent(() => import("./SolicitudesPagoControlGastos.vue"));
const SolicitudesCobro = defineAsyncComponent(() => import("./SolicitudesCobroControlGastos.vue"));

const appStore = useAppStore();
const { can } = usePermissions();
const route = useRoute();
const router = useRouter();
const controlGastosStore = useControlGastosStore();
const bancosStore = useBancosStore();
const enterprisesStore = useEnterprisesStore();
const solicitudesPago = useTemplateRef<{ cargar: () => Promise<void> }>("solicitudesPago");
const egresos = useTemplateRef<{ cargarSolicitudesExistentes: () => Promise<void> }>("egresos");
const idMasterSolicitudes = computed(() => controlGastosStore.listControlGastos[0]?.master_id ?? null);

// cabecera
const master = computed(() => controlGastosStore.listControlGastos[0]);
const escapar = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const valor = (v: unknown, sufijo = "") => (v === null || v === undefined || v === "" ? "—" : `${escapar(v)}${sufijo}`);
const gruposCabecera = computed(() => {
  const m = master.value;
  if (!m) return [];
  return [
    {
      clave: "generales",
      titulo: "Datos generales",
      icono: "mdi-information-outline",
      datos: [
        { label: "Sentido", valor: valor(m.master_modality) },
        { label: "Tipo de embarque", valor: valor(m.master_shipment) },
        { label: "Puerto de origen", valor: valor(m.master_port_begin) },
        { label: "Puerto de destino", valor: valor(m.master_port_end) },
      ],
    },
    {
      clave: "embarque",
      titulo: "Datos del embarque",
      icono: "mdi-ferry",
      datos: [
        { label: "Agente", valor: valor(m.master_operador) },
        { label: "Consignatario", valor: valor(m.master_consigner) },
        { label: "Notify", valor: valor(m.master_notify) },
      ],
    },
    {
      clave: "carga",
      titulo: "Datos de la carga",
      icono: "mdi-package-variant-closed",
      datos: [
        { label: "Bultos", valor: valor(m.master_bultos) },
        { label: "Peso", valor: valor(m.master_peso, " Kg") },
        { label: "Volumen", valor: valor(m.master_volumen, " m<sup>3</sup>") },
        { label: "F. ETD", valor: valor(m.master_fechaetd) },
        { label: "F. ETA", valor: valor(m.master_fechaeta) },
        { label: "F. Disp.", valor: valor(m.master_fechadisponibilidad) },
      ],
    },
  ];
});
// celular: las acciones de la cabecera van en el menú del botón flotante
const accionesMovil = computed(() => {
  const url = master.value?.url_folderonedrive as string | undefined;
  return [
    modoVer.value && can("listControlGastos", "MODIFICAR")
      && { titulo: "Editar", icono: "mdi-pencil", color: "info", accion: () => irAEditar() },
    can("listControlGastos", "EXPORTAR")
      && { titulo: "Control detallado", icono: "mdi-printer-outline", color: "red", accion: () => imprimirControlDetallado(false) },
    can("listControlGastos", "EXPORTAR")
      && { titulo: "Guardar control detallado", icono: "mdi-content-save-all-outline", color: "teal-darken-4", accion: () => imprimirControlDetallado(true) },
    url && { titulo: "Abrir carpeta", icono: "mdi-folder", color: "amber-darken-2", accion: () => to_direct({ url }) },
  ].filter((a): a is { titulo: string; icono: string; color: string; accion: () => unknown } => !!a);
});
const profitPr = computed(() => Number(ingreso_pr.value || 0) - Number(egreso_pr.value || 0));
const profitOp = computed(() => Number(ingreso_op.value || 0) - Number(egreso_op.value || 0));

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

const guardModoVer = useModoVer({
  activo: () => modoVer.value,
  puedeEditar: () => can("listControlGastos", "MODIFICAR"),
  irAEditar: () => irAEditar(),
});

// ...mapAction([])
// --------------------
function irAEditar() {
  const id_branch = controlGastosStore.listControlGastos[0]?.id_branch;
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
  await downloadPdf(
    {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getPdfInstructivoDetallado",
      data: { ...route.params, guardarEnCarpeta, asociadoflag: false },
    },
    "CONTROL_DE_GASTOS_DETALLADO.pdf",
  );
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
  codigo_master = controlGastosStore.listControlGastos[0]?.master_nromaster;
  appStore.spiner = false;
});
</script>

<template>
  <v-container
    fluid
    class="py-0 mx-0"
    :class="{ 'px-2': smAndDown }"
  >
    <v-row>
      <!-- web: cabecera de siempre -->
      <template v-if="!smAndDown">
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
                    <p>
                      F. ETD:
                      {{
                        (controlGastosStore.listControlGastos[0] &&
                          controlGastosStore.listControlGastos[0]
                            .master_fechaetd) ||
                          ""
                      }}
                    </p>
                    <p>
                      F. ETA:
                      {{
                        (controlGastosStore.listControlGastos[0] &&
                          controlGastosStore.listControlGastos[0]
                            .master_fechaeta) ||
                          ""
                      }}
                    </p>
                    <p>
                      F. Disp.:
                      {{
                        (controlGastosStore.listControlGastos[0] &&
                          controlGastosStore.listControlGastos[0]
                            .master_fechadisponibilidad) ||
                          ""
                      }}
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
            v-if="modoVer && can('listControlGastos', 'MODIFICAR')"
            @click="irAEditar()"
          >
            <v-icon class="mx-1">
              mdi-pencil
            </v-icon> EDITAR
          </v-btn>
          <v-btn
            v-if="can('listControlGastos', 'EXPORTAR')"
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
            v-if="can('listControlGastos', 'EXPORTAR')"
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
      </template>
      <!-- celular / tablet: datos del master en tarjetas, profit y acciones en cuadrícula -->
      <template v-else>
        <v-col
          cols="12"
          lg="8"
        >
          <section
            v-if="master"
            class="cg-head"
          >
            <div class="cg-head__exp">
              <span class="cg-head__label">Expediente</span>
              <span class="cg-head__code">{{ master.master_codemaster || "—" }}</span>
            </div>
            <div class="cg-head__grid">
              <div
                v-for="g in gruposCabecera"
                :key="g.titulo"
                class="cg-head__grupo"
                :class="`cg-head__grupo--${g.clave}`"
              >
                <h4>
                  <v-icon size="18">
                    {{ g.icono }}
                  </v-icon>
                  {{ g.titulo }}
                </h4>
                <dl>
                  <template
                    v-for="d in g.datos"
                    :key="d.label"
                  >
                    <dt>{{ d.label }}</dt>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <dd v-html="d.valor" />
                  </template>
                </dl>
              </div>
            </div>
          </section>
        </v-col>
        <v-col
          cols="12"
          lg="4"
        >
          <section class="cg-profit">
            <div class="cg-profit__title">
              <v-icon>mdi-currency-usd</v-icon> Profit
            </div>
            <div class="cg-profit__vals">
              <div :class="profitPr < 0 ? 'cg-profit--neg' : 'cg-profit--pos'">
                <span>Pricing</span>
                <b>{{ profitPr.toFixed(2) }} USD</b>
              </div>
              <div :class="profitOp < 0 ? 'cg-profit--neg' : 'cg-profit--pos'">
                <span>Operaciones</span>
                <b>{{ profitOp.toFixed(2) }} USD</b>
              </div>
            </div>
          </section>
          <!-- acciones en un botón flotante (arriba a la derecha) -->
          <v-menu
            v-if="accionesMovil.length"
            location="bottom end"
          >
            <template #activator="{ props: menu }">
              <v-btn
                v-bind="menu"
                class="cg-fab"
                color="primary"
                icon="mdi-dots-vertical"
                size="large"
                elevation="5"
                aria-label="Acciones del control de gastos"
              />
            </template>
            <v-list
              density="comfortable"
              class="cg-fab__menu"
            >
              <v-list-item
                v-for="acc in accionesMovil"
                :key="acc.titulo"
                :title="acc.titulo"
                @click="acc.accion()"
              >
                <template #prepend>
                  <v-icon :color="acc.color">
                    {{ acc.icono }}
                  </v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-col>
      </template>
      <v-col
        cols="12"
        v-bind="guardModoVer"
      >
        <Ingresos
          @recargar-datos="recargarDatos()"
          :pr-flag="prFlag"
          :op-flag="opFlag"
          :ingreso_pr="ingreso_pr"
          :ingreso_op="ingreso_op"
          @recalcular-profit="calcularProfit()"
          :editable="true"
          :master_houses="controlGastosStore.master_houses"
        />
      </v-col>
      <!-- EGRESOS -->
      <v-col
        cols="12"
        v-bind="guardModoVer"
      >
        <Egresos
          ref="egresos"
          :status-btn="statusBtn"
          :pr-flag="prFlag"
          :op-flag="opFlag"
          :egreso_pr="egreso_pr"
          :egreso_op="egreso_op"
          @recalcular-profit="calcularProfit()"
          @status-btn="statusBtn = $event"
          @recargar-datos="recargarDatos()"
          :editable="true"
          :master_egresos="controlGastosStore.master_egresos"
        />
      </v-col>
      <!-- SOLICITUDES DE COBRO (debajo de Costos, encima de Pagos) -->
      <v-col
        cols="12"
        v-bind="guardModoVer"
      >
        <h3
          v-if="!smAndDown"
          class="mb-2"
        >
          Solicitudes de Cobro Administración
        </h3>
        <div
          v-else
          class="cg-seccion"
        >
          <h3 class="cg-seccion__titulo">
            <v-icon color="success">
              mdi-cash-check
            </v-icon>
            Solicitudes de Cobro Administración
          </h3>
        </div>
        <SolicitudesCobro :id-master="idMasterSolicitudes" />
      </v-col>
      <!-- SOLICITUDES DE PAGO -->
      <v-col
        cols="12"
        v-bind="guardModoVer"
      >
        <h3
          v-if="!smAndDown"
          class="mb-2"
        >
          Solicitudes de Pagos Administración
        </h3>
        <div
          v-else
          class="cg-seccion"
        >
          <h3 class="cg-seccion__titulo">
            <v-icon color="primary">
              mdi-file-send-outline
            </v-icon>
            Solicitudes de Pagos Administración
          </h3>
        </div>
        <SolicitudesPago
          ref="solicitudesPago"
          :id-master="idMasterSolicitudes"
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
