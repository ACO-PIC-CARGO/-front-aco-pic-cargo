<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { clientSteps, dayMonth, stepDateTimeLabel } from "./houseTrackingFormat";

const { phases } = storeToRefs(useHouseTrackingStore());
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const steps = computed(() => clientSteps(phases.value));
const expanded = ref<number[]>([]);

const toggle = (id: number) => {
  expanded.value = expanded.value.includes(id) ? expanded.value.filter((item) => item !== id) : [...expanded.value, id];
};
const shortDay = (iso: string) => {
  const { day, month } = dayMonth(iso, timeZone.value);
  return `${day} ${month}`;
};
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    class="pa-3"
    aria-labelledby="client-preview-title"
  >
    <div class="d-flex ga-2 mb-2">
      <v-icon
        icon="mdi-eye-outline"
        color="primary"
      />
      <div>
        <h2
          id="client-preview-title"
          class="text-title-medium font-weight-bold ma-0"
        >
          Vista de Tracking (Cliente)
        </h2>
        <p class="text-body-small text-medium-emphasis">
          Así ve tu cliente lo que le enviaste.
        </p>
      </div>
    </div>
    <p
      v-if="!steps.length"
      class="text-body-medium text-medium-emphasis"
    >
      Aún no envías nada al tracking del cliente. Confirma un paso y envía uno de sus comentarios con «Enviar a tracking».
    </p>
    <v-timeline
      v-else
      side="end"
      align="start"
      density="compact"
      truncate-line="both"
      line-thickness="2"
    >
      <v-timeline-item
        v-for="step in steps"
        :key="step.id"
        :dot-color="step.confirmed_at ? 'primary' : 'neutral'"
        size="small"
        width="100%"
        fill-dot
      >
        <template #icon>
          <span class="text-label-small font-weight-bold">{{ step.number }}</span>
        </template>
        <v-card
          variant="flat"
          border
          rounded="lg"
          class="pa-2"
        >
          <div class="d-flex align-center ga-2">
            <v-icon
              :icon="step.icon"
              :color="step.confirmed_at ? 'primary' : 'neutral'"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-medium font-weight-medium">
                {{ step.name }}
              </div>
              <div class="d-flex flex-wrap align-center ga-2">
                <AcoStatusChip
                  :tone="step.confirmed_at ? 'success' : 'neutral'"
                  :label="step.confirmed_at ? 'Confirmado' : 'Pendiente'"
                />
                <span
                  v-if="step.confirmed_at"
                  class="text-body-small text-medium-emphasis"
                >{{ shortDay(step.confirmed_at) }}</span>
              </div>
            </div>
            <v-btn
              icon
              variant="text"
              size="x-small"
              :aria-expanded="expanded.includes(step.id)"
              :aria-label="`Ver detalle de ${step.name}`"
              @click="toggle(step.id)"
            >
              <v-icon :icon="expanded.includes(step.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
            </v-btn>
          </div>
          <div
            v-if="expanded.includes(step.id)"
            class="d-flex flex-column ga-1 mt-2 text-body-small"
          >
            <span class="text-medium-emphasis">
              {{ step.confirmed_at ? `Confirmado el ${stepDateTimeLabel(step.confirmed_at, timeZone)}` : "Aún pendiente" }}
            </span>
            <span
              v-for="comment in step.comments"
              :key="comment.id"
              class="text-break"
            >{{ comment.comment }}</span>
          </div>
        </v-card>
      </v-timeline-item>
    </v-timeline>
  </v-card>
</template>
