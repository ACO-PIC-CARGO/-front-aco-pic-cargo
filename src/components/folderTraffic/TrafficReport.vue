<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { usePermissions } from "@/composables/usePermissions";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficFile, TrafficFilters } from "@/types/traffic";
import { reportDay } from "@/utils/operationalReports";
import { hasFailed } from "@/utils/request";
import { trafficStatusLabel } from "@/utils/trafficSend";
import { recentMonths, toTrafficFilters, type TrafficReportForm } from "./trafficReportFilters";

const STATE_OPTIONS = [
  { label: "Todos", value: null },
  { label: "Pendientes", value: "PENDING" },
  { label: "Enviados a operaciones", value: "SENT" },
] as const;
const MONTH_OPTIONS = recentMonths();
const HEADERS = [
  { title: "N° Tráfico", key: "code_traffic" },
  { title: "Creado", key: "created_at", value: (file: TrafficFile) => reportDay(file.created_at) },
  { title: "Cotización", key: "quote_number" },
  { title: "Sentido", key: "namemodality" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },
  { title: "Cliente", key: "nameconsigner" },
  { title: "Pricing", key: "namepricing" },
  { title: "Estatus", key: "status_name", value: trafficStatusLabel },
  { title: "Master", key: "code_master" },
];

const trafficStore = useTrafficStore();
const canExport = usePermissions().can("reportsTraffic", "EXPORTAR");

const form = ref<TrafficReportForm>({ state: null, status: null, months: [], desde: null, hasta: null });
const appliedFilters = shallowRef<TrafficFilters>({});
const filtersOpen = shallowRef(false);
const loading = shallowRef(false);

const sentCount = computed(() => trafficStore.files.filter((file) => file.sent_at).length);
const pendingCount = computed(() => trafficStore.files.length - sentCount.value);

async function search() {
  loading.value = true;
  appliedFilters.value = toTrafficFilters(form.value);
  const answer = await trafficStore.loadFiles(appliedFilters.value);
  loading.value = false;
  if (hasFailed(answer)) {
    Swal.fire({ icon: "error", text: answer.mensaje });
    return;
  }
  filtersOpen.value = false;
}

const exportPdf = () => trafficStore.exportReport(appliedFilters.value);

onMounted(() => {
  trafficStore.loadStatuses();
  search();
});
</script>

<template>
  <div>
    <v-dialog
      v-model="filtersOpen"
      width="600"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2">
          Filtros
        </v-card-title>

        <v-card-text class="mt-5">
          <p class="my-0 py-0">
            Estado
          </p>
          <v-radio-group
            id="traffic-report-state"
            v-model="form.state"
            inline
            density="compact"
          >
            <v-radio
              v-for="option in STATE_OPTIONS"
              :key="option.label"
              :label="option.label"
              :value="option.value"
            />
          </v-radio-group>
          <v-select
            id="traffic-report-status"
            v-model="form.status"
            :items="trafficStore.statuses"
            item-title="name"
            item-value="id"
            label="Estatus"
            clearable
            density="compact"
          />
          <v-select
            id="traffic-report-months"
            v-model="form.months"
            :items="MONTH_OPTIONS"
            label="Meses"
            hint="Si eliges meses, se buscan esos meses completos y se ignoran las fechas desde y hasta."
            persistent-hint
            multiple
            chips
            closable-chips
            clearable
            density="compact"
          />
          <FormatFecha
            id="traffic-report-from"
            v-model="form.desde"
            label="Desde"
            dense
            clearable
          />
          <FormatFecha
            id="traffic-report-to"
            v-model="form.hasta"
            label="Hasta"
            dense
            clearable
          />
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            :loading="loading"
            @click="search"
          >
            Buscar
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="filtersOpen = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        Expedientes de tráfico
        <v-btn
          class="ml-4"
          rounded
          elevation="0"
          color="primary"
          :loading="loading"
          @click="filtersOpen = true"
        >
          Filtrar
        </v-btn>
        <v-btn
          v-if="canExport"
          class="ml-4"
          rounded
          elevation="0"
          color="success"
          :loading="loading"
          @click="exportPdf"
        >
          Exportar PDF
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="HEADERS"
        :items="trafficStore.files"
        item-value="id_traffic"
        :loading="loading"
        loading-text="Buscando expedientes de tráfico..."
        no-data-text="No hay expedientes de tráfico con esos filtros. Cambia las fechas o el estado y busca de nuevo."
        :items-per-page="-1"
        fixed-header
        disable-sort
        hide-default-footer
        height="650"
        density="compact"
      />

      <v-container class="border-t">
        <v-row>
          <v-col
            cols="12"
            md="4"
          >
            Pendientes: {{ pendingCount }}
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            Enviados a operaciones: {{ sentCount }}
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            Total: {{ trafficStore.files.length }}
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </div>
</template>

