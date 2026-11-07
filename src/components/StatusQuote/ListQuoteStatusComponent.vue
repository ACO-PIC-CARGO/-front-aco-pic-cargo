<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
import type { EstadoCotizacion } from "@/types/cotizacion";
import { sessionBranchId } from "@/utils/sesion";
import { usePermissions } from "@/composables/usePermissions";

const QuoteStatusStore = useQuoteStatusStore();
const { can } = usePermissions();
const masterusuariosStore = useMasterusuariosStore();

const search = ref("");
const loading = ref(false);
const headers = [
  { title: "Acciones", key: "action", sortable: false },
  { title: "Código", key: "code" },
  { title: "Nombre", key: "name" },
  // { text: "Descripción", value: "description" },
  { title: "Temperatura del lead ", key: "temperatura" },
  { title: "Posición ", key: "position" },
  // temperatura
  // temperaturadescripcion
  // backgroundtemperatura
  // { text: "Posición Listado Llamadas", value: "position_calls" },
  // { text: "Posición Reportes", value: "position_report" },
  // { text: "Posición Registro", value: "position_select" },
  // { text: "Uso Llamadas", value: "statuscalls" },
  // { text: "Uso Todas Llamadas", value: "statuscalls_all" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },
  { title: "Última Actualización", key: "updated_at" },
] as const;

function estadoActivo(item: EstadoCotizacion): boolean {
  return item.status === 1 || item.status === true || item.status === "1";
}

onMounted(async () => {
  loading.value = true;
  await QuoteStatusStore.GetListQuoteStatus();
  loading.value = false;
  masterusuariosStore.cargarTemperaturaLeds();
});

function ver(item: EstadoCotizacion) {
  const datos = { ...item };
  QuoteStatusStore.tipo = "ver";
  QuoteStatusStore.StatusModel = datos;
  QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
}
function editar(item: EstadoCotizacion) {
  const datos = { ...item };
  QuoteStatusStore.tipo = "editar";
  QuoteStatusStore.StatusModel = datos;
  QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
}
function nuevo() {
  QuoteStatusStore.tipo = "nuevo";
  QuoteStatusStore.StatusModel = {
    id: "",
    name: "",
    code: "",
    position: QuoteStatusStore.max_position,
    position_calls: QuoteStatusStore.max_position_calls,
    position_report: QuoteStatusStore.max_position_report,
    position_select: QuoteStatusStore.max_position_select,
    status_calls: "",
    status_calls_all: "",
    description: "",
    status: 1,
    id_branch: sessionBranchId(),
  };
  QuoteStatusStore.drawer = !QuoteStatusStore.drawer;
}
async function eliminar(item: EstadoCotizacion) {
  Swal.fire({
    icon: "question",
    title: "¿Estás seguro?",
    text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
    allowOutsideClick: false,
    confirmButtonText: "Si, inactivar",
    confirmButtonColor: "red",
    cancelButtonText: "Cancelar",
    cancelButtonColor: "orange",
    showCancelButton: true,
  }).then(async (res) => {
    if (res.isConfirmed) {
      item.status = 0;
      QuoteStatusStore.StatusModel = item;
      loading.value = true;
      await QuoteStatusStore.actualizarQuoteStatus();
      await QuoteStatusStore.GetListQuoteStatus();
      loading.value = false;
    }
  });
}
</script>

<template>
  <v-card class="quote-status-card px-5">
    <v-card-title class="quote-status-toolbar d-flex align-center flex-wrap">
      <v-text-field
        v-model="search"
        class="quote-status-search"
        label="Buscar estado"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        single-line
        hide-details
        clearable
      />
      <v-spacer />
      <v-btn
        class="quote-status-filter"
        variant="flat"
        prepend-icon="mdi-filter-outline"
        @click="
          (QuoteStatusStore.drawer =
            !QuoteStatusStore.drawer) &&
            (QuoteStatusStore.tipo = 'filter')
        "
      >
        Filtrar
      </v-btn>
      <v-btn
        v-if="can('listQuoteStatus', 'NUEVO')"
        class="quote-status-new"
        color="#075ae0"
        prepend-icon="mdi-plus"
        @click="nuevo()"
      >
        Nuevo Estado
      </v-btn>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="QuoteStatusStore.statusQuoteList"
      class="quote-status-table"
      item-value="id"
      :loading="loading"
      :search="search"
      :items-per-page="10"
    >
      <template #[`item.estado`]="{ item }">
        <v-chip
          size="small"
          :color="estadoActivo(item) ? 'success' : 'grey'"
          :prepend-icon="estadoActivo(item) ? 'mdi-check-circle' : 'mdi-close-circle'"
        >
          {{ estadoActivo(item) ? "Activo" : "Inactivo" }}
        </v-chip>
      </template>
      <template #[`item.statuscalls`]="{ item }">
        <v-chip color="green" v-if="item.status_calls == 1">Si</v-chip>
        <v-chip color="red" v-else>No</v-chip>
      </template>
      <template #[`item.statuscalls_all`]="{ item }">
        <v-chip color="green" v-if="item.status_calls_all == 1">Si</v-chip>
        <v-chip color="red" v-else>No</v-chip>
      </template>
      <template #[`item.action`]="{ item }">
        <div class="d-flex align-center ga-1">
          <v-tooltip location="bottom" text="Ver">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                class="quote-status-action quote-status-action-view"
                variant="flat"
                size="small"
                icon="mdi-eye"
                color="primary"
                aria-label="Ver estado"
                @click="ver(item)"
              />
            </template>
          </v-tooltip>
          <v-tooltip v-if="can('listQuoteStatus', 'MODIFICAR')" location="bottom" text="Editar">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                class="quote-status-action quote-status-action-edit"
                variant="flat"
                size="small"
                icon="mdi-pencil"
                color="warning"
                aria-label="Editar estado"
                @click="editar(item)"
              />
            </template>
          </v-tooltip>
          <v-tooltip v-if="estadoActivo(item) && can('listQuoteStatus', 'ELIMINAR')" location="bottom" text="Eliminar">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                class="quote-status-action quote-status-action-delete"
                variant="flat"
                size="small"
                icon="mdi-delete"
                color="error"
                aria-label="Eliminar estado"
                @click="eliminar(item)"
              />
            </template>
          </v-tooltip>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
.quote-status-card {
  border-radius: 18px;
}

.quote-status-toolbar {
  gap: 12px;
  padding: 20px 4px 16px;
}

.quote-status-search {
  flex: 0 1 400px;
  min-width: 220px;
}

.quote-status-toolbar .v-btn {
  text-transform: none;
  letter-spacing: normal;
}

.quote-status-filter {
  color: #17448e;
  background-color: #e8f0fe;
}

.quote-status-new {
  font-weight: 600;
}

.quote-status-table {
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  overflow: hidden;
}

.quote-status-table :deep(> .v-table__wrapper > table > thead) {
  color: #14264e;
  background-color: #e8effb;
}

.quote-status-table :deep(> .v-table__wrapper > table > tbody > tr:nth-of-type(even)) {
  background-color: #f5f7fb;
}

.quote-status-table :deep(> .v-table__wrapper > table > tbody > tr > td) {
  padding-top: 8px;
  padding-bottom: 8px;
}

.quote-status-action {
  border-radius: 9px;
}

.quote-status-action-view {
  color: #0758b8 !important;
  background-color: #e8efff !important;
}

.quote-status-action-edit {
  color: #ad5700 !important;
  background-color: #fff3da !important;
}

.quote-status-action-delete {
  color: #bd2424 !important;
  background-color: #ffebeb !important;
}
</style>
