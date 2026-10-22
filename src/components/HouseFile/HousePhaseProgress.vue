<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { dateLabel, phaseProgress } from "./houseTrackingFormat";
import type { HouseTrackingPhase } from "@/types/houseTracking";

const STATUS_LABELS = { completed: "Completado", in_progress: "En curso", pending: "Pendiente" } as const;

const { phases } = storeToRefs(useHouseTrackingStore());
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const currentIndex = computed(() => phases.value.findIndex((phase) => phase.status === "in_progress"));

const subtitle = (phase: HouseTrackingPhase) =>
  phase.completed_at
    ? `${STATUS_LABELS[phase.status]} · ${dateLabel(phase.completed_at, timeZone.value)}`
    : STATUS_LABELS[phase.status];
</script>

<template>
  <v-stepper
    v-if="phases.length"
    :model-value="currentIndex"
    alt-labels
    flat
    border
    rounded="lg"
    aria-label="Progreso por fases"
  >
    <v-stepper-header class="elevation-0">
      <template
        v-for="(phase, index) in phases"
        :key="phase.id"
      >
        <v-progress-linear
          v-if="index"
          :model-value="phaseProgress(phases[index - 1]!)"
          :aria-label="`Avance de ${phases[index - 1]!.name}`"
          color="primary"
          bg-color="border"
          :bg-opacity="1"
          height="4"
          rounded
          class="phase-connector"
        />
        <v-stepper-item
          :value="index"
          :title="phase.name"
          :subtitle="subtitle(phase)"
          :icon="phase.icon"
          :complete-icon="phase.icon"
          :complete="phase.status === 'completed'"
          :color="phase.status === 'pending' ? 'neutral' : 'primary'"
        />
      </template>
    </v-stepper-header>
  </v-stepper>
</template>

<style scoped>
.phase-connector {
  flex: 1 1 0;
  align-self: flex-start;
  margin: 34px -67px 0;
}
</style>
