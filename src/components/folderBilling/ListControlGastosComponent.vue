<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import modalListHouse from "@/components/modal/ModalListFile.vue";
import GuardarUrlMaster from "../comun/GuardarUrlMaster.vue";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { useReportesStore } from "@/stores/reportes";
import type { RegistroConUrlCarpeta } from "@/types/archivos";
import type { MasterListadoControlGasto } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";
import { usePermissions } from "@/composables/usePermissions";
import BarraFiltro from "@/components/BarraMostrarFiltro/BarraFiltro.vue";
import { RANGOS_CONTROL_GASTOS, problemaRangoExportar } from "@/utils/controlGastosFechas";
import type { FiltroBarra } from "@/types/filtros";

defineProps<{ statusReport?: boolean }>();

const appStore = useAppStore();
const router = useRouter();
const { can } = usePermissions();
const pricingStore = usePricingStore();
const masterusuariosStore = useMasterusuariosStore();
const reportesStore = useReportesStore();

const dialogUrl = ref(false);
const url_folderonedrive = ref("");
const search = ref("");
const masterEditar = ref<RegistroConUrlCarpeta>({});
const statusDialog = ref(false);

const headers = [
  { title: "Master", key: "code_master" },
  // {
  //   text: "Codigo",
  //   align: "start",
  //   value: "code_control",
  // },

  { title: "Versión", key: "posicion" },
  { title: "Nro MBL", key: "nro_mbl" },
  { title: "Sentido", key: "namemodality" },
  { title: "Embarque", key: "nameshipment" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },

  { title: "Consignatario", key: "nameconsigner" },
  { title: "Fecha Etd", key: "fecha_etd" },
  { title: "Fecha Eta", key: "fecha_eta" },

  { title: "Acciones", key: "actions", sortable: false, align: "center" },
] as const;
const page = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [
  { value: 10, title: "10" },
  { value: 25, title: "25" },
  { value: 50, title: "50" },
  { value: 100, title: "100" },
];

const itemsDataControlList = computed<MasterListadoControlGasto[]>(() => appStore.itemsDataControlList);

// Mismos registros que muestra la tabla con la búsqueda escrita: es lo que se exporta.
const SEARCH_KEYS = headers.map((header) => header.key).filter((key) => key !== "actions");
const itemsVisibles = computed(() => {
  const text = search.value.trim().toLowerCase();
  if (!text) return itemsDataControlList.value;
  return itemsDataControlList.value.filter((item) =>
    SEARCH_KEYS.some((key) => String(item[key] ?? "").toLowerCase().includes(text)),
  );
});

const STATUS_LABELS: Record<string, string> = { "0": "Abiertos", "1": "Cerrados" };
// Solo las fechas del filtro: la barra "Filtro Por" muestra las que tienen valor.
const fechasFiltro = computed(() => {
  const filtro = appStore.controlgastosfiltro;
  return Object.fromEntries(
    RANGOS_CONTROL_GASTOS.flatMap((rango) => [
      [rango.desde, filtro[rango.desde] ?? null],
      [rango.hasta, filtro[rango.hasta] ?? null],
    ]),
  ) as FiltroBarra;
});

const exportando = ref(false);
async function exportar() {
  const filtro = appStore.controlgastosfiltro;
  const problema = problemaRangoExportar(filtro);
  if (problema) {
    Swal.fire({ icon: "info", text: problema });
    return;
  }
  const sentido = appStore.itemsModality.find((modality: { id: unknown }) => modality.id == filtro.id_sentido);
  exportando.value = true;
  try {
    await reportesStore.exportControlGastos(
      itemsVisibles.value.map((item) => item.id),
      {
        sentido: sentido?.name ?? null,
        status_operativo: STATUS_LABELS[String(filtro.status_operativo)] ? filtro.status_operativo : null,
        status_administrativo: STATUS_LABELS[String(filtro.status_administrativo)] ? filtro.status_administrativo : null,
        ...fechasFiltro.value,
      },
    );
  } finally {
    exportando.value = false;
  }
}

onMounted(async () => {
  await Promise.all([
    appStore._getControlList(),
    pricingStore.getModulesEntities(),
    pricingStore.getQuoteNoAsignadoHouse(),
    masterusuariosStore.cargarMasterDetalleCanal(),
    appStore._getModality(),
    appStore._getProveedor(),
    appStore._getShipment(),
  ]);
});

async function cerrarDialog() {
  dialogUrl.value = false;
  appStore.spiner = true;
  await appStore._getControlList();
  appStore.spiner = false;
}
function abrirCaperta(item: MasterListadoControlGasto) {
  console.log("item:", item);
  masterEditar.value = { ...item };
  url_folderonedrive.value = "";
  dialogUrl.value = true;
  // window.open(url, "_blank");
}
function editControlGasto(master: MasterListadoControlGasto) {
  if (
    !(
      master.id_branch ==
      sessionBranchId()
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
      id: master.id,
      id_branch: master.id_branch,
    },
  });
}
function verControlGasto(master: MasterListadoControlGasto) {
  router.push({
    name: "verControlGasto",
    params: {
      id: master.id,
      id_branch: master.id_branch,
    },
  });
}
</script>

<template>
  <div>
    <BarraFiltro
      :filtro="fechasFiltro"
      class="mb-2"
    />
    <v-card elevation="0">
      <v-card-text class="pt-4 pb-2">
        <div class="d-flex align-center flex-wrap ga-4">
          <v-text-field
            v-model="search"
            placeholder="Buscar"
            variant="solo-filled"
            flat
            density="compact"
            hide-details
            prepend-icon="mdi-magnify"
            class="list-control__search"
            @update:model-value="page = 1"
          />
          <v-btn
            color="primary"
            elevation="0"
            @click="appStore.cg_filtrarData = true"
          >
            FILTRAR
          </v-btn>
          <v-btn
            v-if="can('listControlGastos', 'EXPORTAR')"
            color="primary"
            variant="outlined"
            prepend-icon="mdi-file-pdf-box"
            :loading="exportando"
            :disabled="!appStore.dataGastos || !itemsVisibles.length"
            @click="exportar"
          >
            EXPORTAR
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="can('listControlGastos', 'NUEVO')"
            color="primary"
            elevation="0"
            prepend-icon="mdi-plus"
            @click="statusDialog = !statusDialog"
          >
            NUEVO CONTROL
          </v-btn>
        </div>
      </v-card-text>

      <v-container
        v-if="!appStore.dataGastos"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
            Cargando información
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="primary"
              indeterminate
              rounded
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>
      <v-data-table
        v-if="appStore.dataGastos"
        class="list-control"
        :headers="headers"
        :items="itemsDataControlList"
        :search="search"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :items-per-page-options="itemsPerPageOptions"
        density="compact"
        hover
      >
        <template #[`item.code_master`]="{ item }">
          <span class="font-weight-medium text-no-wrap">{{ item.code_master }}</span>
        </template>

        <template #[`item.nro_mbl`]="{ item }">
          <span class="text-no-wrap">{{ item.nro_mbl }}</span>
        </template>

        <template #[`item.nameconsigner`]="{ item }">
          <span class="list-control__consignatario">{{ item.nameconsigner }}</span>
        </template>

        <template #[`item.fecha_etd`]="{ item }">
          <span class="text-no-wrap">{{ item.fecha_etd }}</span>
        </template>

        <template #[`item.fecha_eta`]="{ item }">
          <span class="text-no-wrap">{{ item.fecha_eta }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex align-center justify-center ga-1">
            <v-icon
              color="#FFD600"
              size="small"
              title="Carpeta"
              @click.stop="abrirCaperta(item)"
            >
              mdi-folder
            </v-icon>
            <v-icon
              color="primary"
              size="small"
              title="Ver control de gastos"
              aria-label="Ver control de gastos"
              @click.stop="verControlGasto(item)"
            >
              mdi-eye-outline
            </v-icon>
            <v-icon
              v-if="can('listControlGastos', 'MODIFICAR')"
              color="orange"
              size="small"
              title="Editar control de gastos"
              @click.stop="editControlGasto(item)"
            >
              mdi-pencil
            </v-icon>
          </div>
        </template>
      </v-data-table>
      <v-container v-if="statusReport">
        <v-row>
          <v-col>
            <v-btn
              color="primary"
              elevation="0"
            >
              GENERAR REPORTE
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <modalListHouse v-model:dialog="statusDialog" />
    <GuardarUrlMaster
      :dialog-url="dialogUrl"
      :master-editar="masterEditar"
      :editable="can('listControlGastos', 'MODIFICAR')"
      @cerrar="cerrarDialog"
    />
  </div>
</template>

<style scoped>
.list-control__search {
  max-width: 640px;
}
.list-control :deep(thead th) {
  background: #f1f3f5 !important;
  font-weight: 700 !important;
  font-size: 0.8rem;
  line-height: 1.2;
  white-space: normal;
}
.list-control :deep(tbody td) {
  font-size: 0.8rem;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
.list-control__consignatario {
  display: block;
  min-width: 160px;
  max-width: 260px;
  font-size: 0.75rem;
  line-height: 1.25;
}
</style>
