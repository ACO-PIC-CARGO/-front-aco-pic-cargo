<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { request } from "@/utils/request";

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
  { label: "Salida (ETD)", date: master.value?.fecha_etd, confirmedLabel: "Salida Confirmada", confirmed: master.value?.salidaflag },
  { label: "Llegada (ETA)", date: master.value?.fecha_eta, confirmedLabel: "Llegada Confirmada", confirmed: master.value?.llegadaflag },
  {
    label: "Fecha de Disponibilidad",
    date: master.value?.fecha_disponibilidad,
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
            :model-value="item.date ?? ''"
            type="date"
            :label="item.label"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-checkbox
            :model-value="Boolean(item.confirmed)"
            :label="item.confirmedLabel"
            density="compact"
            hide-details
            readonly
          />
        </v-col>
      </template>
    </v-row>
  </div>
</template>
