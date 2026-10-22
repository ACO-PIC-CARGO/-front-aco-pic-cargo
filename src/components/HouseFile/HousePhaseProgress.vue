<script setup lang="ts">
import { storeToRefs } from "pinia";
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { dateLabel } from "./houseTrackingFormat";
import type { PhaseStatus } from "@/types/houseTracking";

const STATUS: Record<PhaseStatus, { tone: "success" | "primary" | "neutral"; label: string; tile: "solid" | "primary" | "neutral" }> = {
  completed: { tone: "success", label: "Completado", tile: "solid" },
  in_progress: { tone: "primary", label: "En curso", tile: "primary" },
  pending: { tone: "neutral", label: "Pendiente", tile: "neutral" },
};

const { phases } = storeToRefs(useHouseTrackingStore());
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
</script>

<template>
  <section
    v-if="phases.length"
    class="aco-card house-phase-progress"
    aria-label="Progreso por fases"
  >
    <ol class="house-phase-progress__list">
      <li
        v-for="phase in phases"
        :key="phase.id"
        class="house-phase-progress__phase"
        :class="`is-${phase.status}`"
      >
        <p class="aco-title-row">
          {{ phase.name }}
        </p>
        <span class="house-phase-progress__tile">
          <AcoIconTile
            :icon="phase.icon"
            size="lg"
            :tone="STATUS[phase.status].tile"
          />
          <v-icon
            v-if="phase.status === 'completed'"
            class="house-phase-progress__check"
            icon="mdi-check-circle"
            color="primary"
            size="22"
          />
        </span>
        <p class="aco-caption">
          {{ dateLabel(phase.completed_at, timeZone) }}
        </p>
        <AcoStatusChip
          :tone="STATUS[phase.status].tone"
          :label="STATUS[phase.status].label"
        />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.house-phase-progress {
  padding: var(--aco-space-5);
}

.house-phase-progress__list {
  display: grid;
  grid-auto-columns: minmax(140px, 1fr);
  grid-auto-flow: column;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
}

.house-phase-progress__phase {
  position: relative;
  display: grid;
  justify-items: center;
  gap: var(--aco-space-2);
  text-align: center;
}

.house-phase-progress__phase:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 62px;
  left: calc(50% + 40px);
  width: calc(100% - 80px);
  border-top: 3px dashed rgb(var(--v-theme-border));
}

.house-phase-progress__phase.is-completed:not(:last-child)::after {
  border-top-style: solid;
  border-top-color: rgb(var(--v-theme-primary));
}

.house-phase-progress__tile {
  position: relative;
}

.house-phase-progress__check {
  position: absolute;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
}

@media (max-width: 600px) {
  .house-phase-progress__list {
    grid-auto-flow: row;
    gap: var(--aco-space-4);
  }

  .house-phase-progress__phase::after {
    display: none;
  }
}
</style>
