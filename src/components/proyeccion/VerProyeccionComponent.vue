<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { useProyeccionesStore } from "@/stores/proyecciones";
import { useBalancesStore } from "@/stores/balances";
import type {
  FilaProyeccion,
  MonedaProyeccion,
  SucursalSesionProyeccion,
  UsuarioSesionProyeccion,
} from "@/types/proyecciones";
import { sessionBranchId, sessionSucursal, sessionUser } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();
const appRouter = useRouter();
const balancesStore = useBalancesStore();
const proyeccionesStore = useProyeccionesStore();

const frmProyeccion = useTemplateRef("frmProyeccion");

const monExt = ref("");
const textSize = "2rem";
const headers = [
  { title: "Tipo de Gasto", key: "gasto", width: "10%" },
  { title: "Tipo de Subgasto", key: "subgasto", width: "10%" },
  { title: "Proveedor", key: "proveedor", width: "10%" },
  { title: "Descripción", key: "descripcion", width: "10%" },
  { title: "Día Vencimiento", key: "diavencimiento", width: "10%" },
  { title: "Moneda", key: "moneda", width: "10%" },
  {
    title: "Monto Moneda Original",
    key: "montomonoriginal",
    width: "10%",
  },
  { title: "Monto Final en USD", key: "montofinaldolar", width: "10%" },
  // { text: "Acciones", value: "action", width: "10%" },
];
const dias = [
  { value: 1, text: "01" },
  { value: 2, text: "02" },
  { value: 3, text: "03" },
  { value: 4, text: "04" },
  { value: 5, text: "05" },
  { value: 6, text: "06" },
  { value: 7, text: "07" },
  { value: 8, text: "08" },
  { value: 9, text: "09" },
  { value: 10, text: "10" },
  { value: 11, text: "11" },
  { value: 12, text: "12" },
  { value: 13, text: "13" },
  { value: 14, text: "14" },
  { value: 15, text: "15" },
  { value: 16, text: "16" },
  { value: 17, text: "17" },
  { value: 18, text: "18" },
  { value: 19, text: "19" },
  { value: 20, text: "20" },
  { value: 21, text: "21" },
  { value: 22, text: "22" },
  { value: 23, text: "23" },
  { value: 24, text: "24" },
  { value: 25, text: "25" },
  { value: 26, text: "26" },
  { value: 27, text: "27" },
  { value: 28, text: "28" },
];
const items = ref<FilaProyeccion[]>([]);
const moneda = ref<string | never[]>([]);
const id_month = ref<number | string | undefined>("");
const id_year = ref<number | string | undefined>("");
const tipocambio = ref<number | string | null | undefined>("");
const totalmonlocal = ref<number | string>(0.0);
const montoconversiondolar = ref<number | string>(0.0);
const totaldolar = ref<number | string>(0.0);
const totalfinal = ref<number | string>(0.0);
const aprobado = ref<boolean | undefined>(false);

function agregarFila(item: FilaProyeccion): void {
  const data = {
    id_gasto: "",
    id_tiposubgasto: "",
    id_entitie: "",
    id_coin: "",
    description: "",
    monto_monlocal: 0.0,
    monto_monext: 0.0,
  };
  items.value.push(data);

  calcularMontoFinal(item);
  calcularTotales();
}

function calcularMontoFinal(item: FilaProyeccion): void {
  const symbol = (rootStore.state.itemsCoinsList as MonedaProyeccion[]).filter(
    (v) => v.id == item.id_coin,
  )[0]!.symbol;
  if (symbol != "USD") {
    item.monto_monext = parseFloat(
      String(Number(item.monto_monlocal) / Number(tipocambio.value)),
    ).toFixed(2);
  } else {
    item.monto_monext = parseFloat(String(item.monto_monlocal)).toFixed(2);
  }
  calcularTotales();
}

function calcularTotales(): void {
  let monto_monext = 0;
  let montolocal = 0;
  let totalmonlocalSuma = 0;
  let totalfinalSuma = 0;
  const id_dolar = (rootStore.state.itemsCoinsList as MonedaProyeccion[]).filter(
    (v) => v.symbol == "USD",
  )[0]!.id;
  items.value
    .filter((v) => v.id_coin == id_dolar)
    .forEach((element) => {
      monto_monext += parseFloat(String(element.monto_monext));
    });
  items.value
    .filter((v) => v.id_coin != id_dolar)
    .forEach((element) => {
      montolocal += parseFloat(String(element.monto_monext));
      totalmonlocalSuma += parseFloat(String(element.monto_monlocal));
    });
  items.value.forEach((element) => {
    totalfinalSuma += parseFloat(String(element.monto_monext));
  });
  totaldolar.value = parseFloat(String(monto_monext)).toFixed(2);
  montoconversiondolar.value = parseFloat(String(montolocal)).toFixed(2);
  totalmonlocal.value = parseFloat(String(totalmonlocalSuma)).toFixed(2);
  totalfinal.value = parseFloat(String(totalfinalSuma)).toFixed(2);
}
function calcularTotalTipoCambio(): void {
  let symbol = "";
  items.value.forEach((item) => {
    if (item.id_coin) {
      symbol = (rootStore.state.itemsCoinsList as MonedaProyeccion[]).filter(
        (v) => v.id == item.id_coin,
      )[0]!.symbol;
      if (symbol != "USD") {
        item.monto_monext = parseFloat(
          String(Number(item.monto_monlocal) / Number(tipocambio.value)),
        ).toFixed(2);
      } else {
        item.monto_monext = parseFloat(String(item.monto_monlocal)).toFixed(2);
      }
    }
  });

  calcularTotales();
}
async function exportar(): Promise<void> {
  rootStore.state.spiner = true;
  await proyeccionesStore.exportarVerProyeccion(route.params.id as string);
  rootStore.state.spiner = false;
}

function eliminarfila(item: FilaProyeccion): void {
  const index = items.value.indexOf(item);
  if (index > 0) {
    items.value.splice(index, 1);
  }
  if (index == 0) {
    items.value[0]!.id_gasto = "";
    items.value[0]!.id_tiposubgasto = "";
    items.value[0]!.id_entitie = "";
    items.value[0]!.id_coin = "";
    items.value[0]!.description = "";
    items.value[0]!.monto_monlocal = "";
    items.value[0]!.monto_monext = "";
  }
  calcularTotales();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function registrar(): Promise<void> {
  let validaciondetails = true;
  // @ts-expect-error data is read before it is initialized
  let data: Record<string, unknown> = data;
  if ((await frmProyeccion.value!.validate()).valid) {
    items.value.forEach((item) => {
      if (!item.id_gasto) {
        item.errgasto = ["Dato Requerido"];
        validaciondetails = false;
      } else {
        item.errgasto = "";
      }
      if (!item.id_tiposubgasto) {
        item.errsubgasto = ["Dato Requerido"];
        validaciondetails = false;
      } else {
        item.errsubgasto = "";
      }
      if (!item.id_entitie) {
        item.errproveedor = ["Dato Requerido"];
        validaciondetails = false;
      } else {
        item.errproveedor = "";
      }
      if (!item.id_coin) {
        item.errmoneda = ["Dato Requerido"];
        validaciondetails = false;
      } else {
        item.errmoneda = "";
      }
      if (!item.monto_monlocal) {
        item.errmontomonoriginal = ["Dato Requerido"];
        validaciondetails = false;
      } else {
        item.errmontomonoriginal = "";
      }
    });
  }
  if (!!validaciondetails) {
    data = {
      id_branch: sessionBranchId(),
      id_month: id_month.value,
      id_year: id_year.value,
      id_user: (sessionUser() as UsuarioSesionProyeccion).id_user,
      tipocambio: tipocambio.value,
      total_monlocal: totalmonlocal.value,
      total_conversionext: montoconversiondolar.value,
      total_monext: totaldolar.value,
      total_proyectado_ext: totalfinal.value,
      details: items.value,
    };
    await proyeccionesStore.setProyeccion(data);
  }
}
function volver(): void {
  appRouter.go(-1);
}
function setData(): void {
  id_month.value = proyeccionesStore.proyeccion.id_month;
  id_year.value = proyeccionesStore.proyeccion.id_year;
  tipocambio.value = proyeccionesStore.proyeccion.tipocambio;
  items.value = proyeccionesStore.proyeccion.details as FilaProyeccion[];
  aprobado.value = proyeccionesStore.proyeccion.aprobadoflag;

  calcularTotalTipoCambio();
}
function editar(): void {
  appRouter.push({
    name: "editarProyeccion",
    params: { id: route.params.id as string },
  });
}

onMounted(async () => {
  monExt.value = moneda.value = (sessionSucursal() as SucursalSesionProyeccion).moneda[0]!.symbol;
  rootStore.state.spiner = true;

  await proyeccionesStore.verProyeccion(route.params.id as string);
  await rootStore.dispatch("_getCoinsList");
  await balancesStore.getCargarTipoGastos();
  await balancesStore.getCargarTipoSubGastos();
  await rootStore.dispatch("_getChargeYear");
  await rootStore.dispatch("_getChargeMonth");
  await rootStore.dispatch("cargarProveedores");
  setData();
  rootStore.state.spiner = false;
  rootStore.state.drawer = false;
});
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap">
        Datos Principales:
        <v-spacer />
        <b :style="{ fontSize: textSize }">{{ totalfinal }} USD</b>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-form ref="frmProyeccion">
              <v-row>
                <v-col
                  cols="12"
                  md="2"
                >
                  <v-select
                    :items="rootStore.state.month"
                    v-model="id_month"
                    label="Mes"
                    density="compact"
                    item-title="description"
                    item-value="id"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    readonly
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="2"
                >
                  <v-select
                    :items="Array.isArray(rootStore.state.year) ? rootStore.state.year : []"
                    v-model="id_year"
                    label="Año"
                    density="compact"
                    item-title="description"
                    item-value="id"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    readonly
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="2"
                >
                  <v-text-field
                    v-model="tipocambio"
                    label="Tipo Cambio"
                    density="compact"
                    @blur="calcularTotalTipoCambio()"
                    :rules="[(v) => !!v || 'Dato requerido']"
                    readonly
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="totalmonlocal"
                    :label="`Total Proyectado(${monExt})`"
                    density="compact"
                    readonly
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="montoconversiondolar"
                    label="Conversión a Dolares(USD)"
                    density="compact"
                    readonly
                  />
                </v-col>
                <v-col
                  cols="12"
                  lg="3"
                >
                  <v-text-field
                    v-model="totaldolar"
                    label="Gastos(USD)"
                    density="compact"
                    readonly
                  />
                </v-col>

                <v-col
                  cols="12"
                  lg="3"
                >
                  <v-text-field
                    v-model="totalfinal"
                    :label="`Total Proyectado(${monExt})`"
                    density="compact"
                    readonly
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-col>
          <v-col
            cols="12"
            v-if="!!tipocambio"
          >
            <v-data-table
              :headers="headers"
              :items="items"
              class="elevation-1"
              item-value="index"
              disable-sort
            >
              <template #[`item.gasto`]="{ item }">
                <v-select
                  :items="
                    balancesStore.tipogastos.filter((v) => v.id != 0)
                  "
                  placeholder="Tipo de Gasto"
                  v-model="item.id_gasto"
                  density="compact"
                  item-title="description"
                  item-value="id"
                  :error-messages="item.errgasto"
                  readonly
                />
              </template>
              <template #[`item.subgasto`]="{ item }">
                <v-select
                  :items="
                    balancesStore.tiposubgastos.filter(
                      (subgasto) => subgasto.id_gasto === item.id_gasto
                    )
                  "
                  v-model="item.id_tiposubgasto"
                  density="compact"
                  placeholder="Subtipo de Gasto"
                  item-title="description"
                  item-value="id"
                  :error-messages="item.errsubgasto"
                  readonly
                />
              </template>
              <template #[`item.proveedor`]="{ item }">
                <v-autocomplete
                  :items="rootStore.state.provedores"
                  v-model="item.id_entitie"
                  item-title="namelong"
                  placeholder="Proveedor"
                  item-value="id"
                  density="compact"
                  :error-messages="item.errproveedor"
                  readonly
                />
              </template>
              <template #[`item.descripcion`]="{ item }">
                <v-textarea
                  density="compact"
                  placeholder="Descripcion"
                  v-model="item.description"
                  rows="1"
                  readonly
                />
              </template>
              <template #[`item.montomonoriginal`]="{ item }">
                <v-text-field
                  placeholder="Monto Moneda Local"
                  v-model="item.monto_monlocal"
                  type="number"
                  @keydown.enter="agregarFila(item)"
                  @blur="calcularMontoFinal(item)"
                  :error-messages="item.errmontomonoriginal"
                  readonly
                />
              </template>
              <template #[`item.moneda`]="{ item }">
                <v-select
                  :items="rootStore.state.itemsCoinsList"
                  item-title="symbol"
                  v-model="item.id_coin"
                  label="Moneda"
                  item-value="id"
                  @update:model-value="calcularMontoFinal(item)"
                  :error-messages="item.errmoneda"
                  readonly
                />
              </template>
              <template #[`item.montofinaldolar`]="{ item }">
                {{ item.monto_monext }}
              </template>
              <template #[`item.diavencimiento`]="{ item }">
                <v-select
                  item-title="text"
                  :items="dias"
                  v-model="item.nrodias"
                  label="Día de vencimiento"
                  :error-messages="item.errrnodias"
                  readonly
                />
              </template>
              <template #[`item.action`]="{ item }">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="eliminarfila(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card-actions>
      <v-spacer />
      <v-btn
        size="small"
        class="mx-1"
        v-if="!aprobado"
        color="success"
        @click="editar()"
        rounded
      >
        Ir a Editar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="success"
        @click="exportar()"
        rounded
      >
        Exportar Detalles
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="red"
        @click="volver()"
        rounded
      >
        Cancelar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        v-if="!aprobado"
        color="info"
        rounded
      >
        APROBAR
      </v-btn>
    </v-card-actions>
  </v-container>
</template>

<style scoped>
.importante {
  font-size: 10rem;
}
</style>
