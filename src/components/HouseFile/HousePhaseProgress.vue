<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { dateLabel } from "./houseTrackingFormat";
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
        <v-divider
          v-if="index"
          :thickness="2"
          :color="phases[index - 1]!.status === 'completed' ? 'primary' : undefined"
          :class="{ 'border-opacity-100': phases[index - 1]!.status === 'completed' }"
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
