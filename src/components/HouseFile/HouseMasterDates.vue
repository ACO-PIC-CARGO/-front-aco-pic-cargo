<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { request } from "@/utils/request";
import { calendarDateLabel } from "./houseTrackingFormat";
import MasterDateHistory from "@/components/folderMaster/MasterDateHistory.vue";
import type { CampoFechaMaster } from "@/types/operaciones";

interface MasterDates {
  fecha_etd: string | null;
  salidaflag: boolean | null;
  fecha_eta: string | null;
  llegadaflag: boolean | null;
  fecha_disponibilidad: string | null;
  disponibilidadflag: boolean | null;
}

const LOAD_ERROR = "No pudimos cargar las fechas del master. Recarga la página para intentarlo de nuevo.";

const props = defineProps<{ masterId: number | null | undefined }>();
const master = shallowRef<MasterDates | null>(null);
const loadError = shallowRef("");

watch(
  () => props.masterId,
  async (masterId) => {
    master.value = null;
    loadError.value = "";
    if (!masterId) return;
    const response = await request<MasterDates>({ method: "post", url: `getMasterId/${masterId}` });
    master.value = response.data[0] ?? null;
    if (!master.value) loadError.value = LOAD_ERROR;
  },
  { immediate: true },
);

const dates = computed(() => [
  {
    campo: "fecha_etd" as CampoFechaMaster,
    column: "ETD",
    label: "Salida (ETD)",
    date: calendarDateLabel(master.value?.fecha_etd),
    confirmedLabel: "Salida Confirmada",
    confirmed: master.value?.salidaflag,
  },
  {
    campo: "fecha_eta" as CampoFechaMaster,
    column: "ETA",
    label: "Llegada (ETA)",
    date: calendarDateLabel(master.value?.fecha_eta),
    confirmedLabel: "Llegada Confirmada",
    confirmed: master.value?.llegadaflag,
  },
  {
    campo: "fecha_disponibilidad" as CampoFechaMaster,
    column: "Disponibilidad",
    label: "Fecha de Disponibilidad",
    date: calendarDateLabel(master.value?.fecha_disponibilidad),
    confirmedLabel: "Confirmación Disponibilidad",
    confirmed: master.value?.disponibilidadflag,
  },
]);
</script>

<template>
  <div>
    <h3>Fechas</h3>
    <v-alert
      v-if="loadError"
      type="warning"
      variant="tonal"
      density="compact"
      :text="loadError"
    />
    <v-row
      v-else
      density="compact"
    >
      <template
        v-for="item in dates"
        :key="item.label"
      >
        <v-col
          cols="12"
          md="6"
        >
          <v-text-field
            :model-value="item.date"
            :label="item.label"
            readonly
          />
          <MasterDateHistory
            :master-id="masterId"
            :campo="item.campo"
            :title="item.label"
            :column="item.column"
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
          class="d-flex align-center"
        >
          <v-chip
            class="confirmation-chip"
            :class="{ 'confirmation-chip--on': item.confirmed }"
            size="small"
            variant="flat"
            :color="item.confirmed ? 'teal-darken-1' : 'grey'"
            :prepend-icon="item.confirmed ? 'mdi-check-circle' : 'mdi-close-circle'"
          >
            {{ item.confirmedLabel }}
          </v-chip>
        </v-col>
      </template>
    </v-row>
  </div>
</template>

<style scoped>
.confirmation-chip {
  font-weight: 600;
}
</style>
