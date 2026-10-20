<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useProyeccionesStore } from "@/stores/proyecciones";
import { useBalancesStore } from "@/stores/balances";
import type {
  FilaProyeccion,
  MonedaProyeccion,
  RespuestaValidacionAprobacion,
  SucursalSesionProyeccion,
  UsuarioSesionProyeccion,
} from "@/types/proyecciones";
import { sessionBranchId, sessionSucursal, sessionUser } from "@/utils/sesion";

const appStore = useAppStore();
const route = useRoute();
const appRouter = useRouter();
const balancesStore = useBalancesStore();
const proyeccionesStore = useProyeccionesStore();

const frmProyeccion = useTemplateRef("frmProyeccion");

const monExt = ref("");
const textSize = "2rem";
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
  { title: "Acciones", key: "action", width: "10%" },
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
const dialogn = ref(false);
const id_monthn = ref<number | string>("");
const id_yearn = ref<number | string>("");
const loading = ref(false);
const dialog = ref(false);

function agregarFila(item: FilaProyeccion): void {
  const data = {
    id_gasto: "",
    id_tiposubgasto: "",
    id_entitie: "",
    id_coin: "",
    description: "",
    monto_monlocal: 0.0,
    monto_monext: 0.0,
    estado: true,
  };
  items.value.push(data);

  calcularMontoFinal(item);
  calcularTotales();
}
function agregarFilaNueva(item?: FilaProyeccion): void {
  const data = {
    id_gasto: "",
    id_tiposubgasto: "",
    id_entitie: "",
    id_coin: "",
    description: "",
    monto_monlocal: 0.0,
    monto_monext: 0.0,
    estado: true,
  };
  items.value.unshift(data);

  calcularMontoFinal(item!);
  calcularTotales();
}

function calcularMontoFinal(item: FilaProyeccion): void {
  const symbol = (appStore.itemsCoinsList as MonedaProyeccion[]).filter(
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
  const id_dolar = (appStore.itemsCoinsList as MonedaProyeccion[]).filter(
    (v) => v.symbol == "USD",
  )[0]!.id;
  items.value
    .filter((v) => v.id_coin == id_dolar && !!v.estado)
    .forEach((element) => {
      monto_monext += parseFloat(String(element.monto_monext));
    });
  items.value
    .filter((v) => v.id_coin != id_dolar && !!v.estado)
    .forEach((element) => {
      montolocal += parseFloat(String(element.monto_monext));
      totalmonlocalSuma += parseFloat(String(element.monto_monlocal));
    });
  items.value
    .filter((v) => !!v.estado)
    .forEach((element) => {
      totalfinalSuma += parseFloat(String(element.monto_monext));
    });
  totaldolar.value = parseFloat(String(monto_monext)).toFixed(2);
  montoconversiondolar.value = parseFloat(String(montolocal)).toFixed(2);
  totalmonlocal.value = parseFloat(String(totalmonlocalSuma)).toFixed(2);
  totalfinal.value = parseFloat(String(totalfinalSuma)).toFixed(2);
}
function calcularTotalTipoCambio(): void {
  let symbol = "";
  items.value
    .filter((v) => !!v.estado)
    .forEach((item) => {
      if (item.id_coin) {
        symbol = (appStore.itemsCoinsList as MonedaProyeccion[]).filter(
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
function eliminarfila(item: FilaProyeccion): void {
  item.estado = false;
  calcularTotales();
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
function seleccionEditar(): void {
  Swal.fire({
    icon: "question",
    text: "¿Desea actualizar los datos de la proyección para el mes y año actuales o crear una nueva proyección con un mes y/o año distintos?",
    showConfirmButton: true,
    confirmButtonColor: "#1B5E20",
    confirmButtonText: "Actualizar proyección actual.",
    showDenyButton: true,
    denyButtonText: "Crear una nueva proyección.",
    denyButtonColor: "#E65100",
  }).then((result) => {
    if (result.isConfirmed) {
      editar();
    }
    if (result.isDenied) {
      dialogn.value = true;
    }
  });
}
async function editar(): Promise<void> {
  let validaciondetails = true;
  // let data = data;
  if ((await frmProyeccion.value!.validate()).valid) {
    items.value
      .filter((v) => v.estado == true)
      .forEach((item) => {
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
        if (!item.nrodias) {
          item.errrnodias = ["Dato Requerido"];
          validaciondetails = false;
        } else {
          item.errrnodias = "";
        }
      });
  }
  if (!!validaciondetails) {
    const data = {
      id_branch: sessionBranchId(),
      id_month: id_month.value,
      id_year: id_year.value,
      id: route.params.id,
      id_user: (sessionUser() as UsuarioSesionProyeccion).id_user,
      tipocambio: tipocambio.value,
      total_monlocal: totalmonlocal.value,
      total_conversionext: montoconversiondolar.value,
      total_monext: totaldolar.value,
      total_proyectado_ext: totalfinal.value,
      details: items.value,
    };
    await proyeccionesStore.updateProyeccion(data);
  }
}
async function validateAprobacion(): Promise<void> {
  appStore.spiner = true;
  const data = { id_month: id_month.value, id_year: id_year.value };
  const res = (await proyeccionesStore.validateProyeccionAprobacion(
    data,
  )) as RespuestaValidacionAprobacion;
  appStore.spiner = false;
  if (!!res.estado) {
    Swal.fire({
      icon: "question",
      text: res.mensaje,
      confirmButtonText: "Si",
      denyButtonText: "No",
      showDenyButton: true,
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        apProyeccion();
      }
      if (result.isDenied) {
        dialog.value = false;
      }
    });
  } else {
    apProyeccion();
  }
}
async function apProyeccion(): Promise<void> {
  appStore.spiner = true;
  const data = {
    id: route.params.id,
  };
  await proyeccionesStore.aprobarProyeccion(data);
  await proyeccionesStore.verProyeccion(route.params.id as string);
  setData();
  appStore.spiner = false;
}
async function copyProyeccion(): Promise<void> {
  loading.value = true;
  const data = {
    id: route.params.id,
    id_month: id_monthn.value,
    id_year: id_yearn.value,
    id_branch: sessionBranchId(),
    id_user: (sessionUser() as UsuarioSesionProyeccion).id_user,
  };

  await proyeccionesStore.copiarProyeccion(data);
  appRouter.go(-1);
}

onMounted(async () => {
  monExt.value = moneda.value = (sessionSucursal() as SucursalSesionProyeccion).moneda[0]!.symbol;
  appStore.spiner = true;
  await balancesStore.getCargarTipoGastos();
  await balancesStore.getCargarTipoSubGastos();
  await appStore._getCoinsList();
  await appStore.cargarProveedores();
  await appStore._getChargeYear();
  await appStore._getChargeMonth();
  await proyeccionesStore.verProyeccion(route.params.id as string);

  setTimeout(() => {
    setData();
    appStore.spiner = false;
    appStore.drawer = false;
  }, 2000);
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
        <v-col cols="12">
          <v-form ref="frmProyeccion">
            <v-row>
              <v-col
                cols="12"
                md="2"
              >
                <v-select
                  :items="appStore.month"
                  v-model="id_month"
                  label="Mes"
                  density="compact"
                  item-title="description"
                  item-value="id"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>

              <v-col
                cols="12"
                md="2"
              >
                <v-select
                  :items="Array.isArray(appStore.year) ? appStore.year : []"
                  v-model="id_year"
                  label="Año"
                  density="compact"
                  item-title="description"
                  item-value="id"
                  :rules="[(v) => !!v || 'Dato requerido']"
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
                md="3"
                offset-md="9"
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
                md="3"
                offset-md="9"
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
        <v-col>
          <v-btn
            size="small"
            class="mx-1"
            color="info"
            rounded
            @click="agregarFilaNueva()"
          >
            Añadir Detalle
          </v-btn>
        </v-col>
        <v-col
          cols="12"
          v-if="!!tipocambio"
        >
          <v-data-table
            :headers="headers"
            :items="items.filter((v) => !!v.estado)"
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
              />
            </template>
            <template #[`item.subgasto`]="{ item }">
              <v-select
                :items="
                  balancesStore.tiposubgastos.filter(
                    (v) => v.id_gasto == item.id_gasto
                  )
                "
                placeholder="Tipo de SubGasto"
                v-model="item.id_tiposubgasto"
                item-title="description"
                item-value="id"
              />
            </template>
            <template #[`item.proveedor`]="{ item }">
              <v-autocomplete
                :items="appStore.provedores"
                v-model="item.id_entitie"
                item-title="namelong"
                placeholder="Proveedor"
                item-value="id"
                density="compact"
                :error-messages="item.errproveedor"
              />
            </template>
            <template #[`item.descripcion`]="{ item }">
              <v-textarea
                density="compact"
                placeholder="Descripcion"
                v-model="item.description"
                rows="1"
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
              />
            </template>
            <template #[`item.moneda`]="{ item }">
              <v-select
                :items="appStore.itemsCoinsList"
                item-title="symbol"
                v-model="item.id_coin"
                label="Moneda"
                item-value="id"
                @update:model-value="calcularMontoFinal(item)"
                :error-messages="item.errmoneda"
              />
            </template>
            <template #[`item.montofinaldolar`]="{ item }">
              {{ item.monto_monext }}
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
            <template #[`item.diavencimiento`]="{ item }">
              <v-select
                item-title="text"
                :items="dias"
                v-model="item.nrodias"
                label="Día de vencimiento"
                :error-messages="item.errrnodias"
              />
            </template>
          </v-data-table>
        </v-col>
      </v-card-text>
    </v-card>
    <v-card-actions>
      <v-spacer />
      <v-btn
        size="small"
        class="mx-1"
        color="success"
        v-if="!aprobado"
        @click="seleccionEditar()"
        rounded
      >
        Guardar
      </v-btn>

      <v-btn
        size="small"
        class="mx-1"
        v-if="!aprobado"
        @click="validateAprobacion()"
        color="info"
        rounded
      >
        APROBAR
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
    </v-card-actions>
    <v-dialog
      v-model="dialogn"
      persistent
      :overlay="false"
      max-width="30%"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          REALIZAR COPIA
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="defaul"
            @click="dialogn = !dialogn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                :items="appStore.month"
                v-model="id_monthn"
                label="Mes"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                :items="Array.isArray(appStore.year) ? appStore.year : []"
                v-model="id_yearn"
                label="Año"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            class="mx-1"
            @click="copyProyeccion()"
            :loading="loading"
          >
            Copiar
          </v-btn>
          <v-btn
            color="red"
            class="mx-1"
            @click="dialogn = !dialogn"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.importante {
  font-size: 10rem;
}
</style>
