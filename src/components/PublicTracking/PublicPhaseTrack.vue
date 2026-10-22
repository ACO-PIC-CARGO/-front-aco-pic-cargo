<script setup lang="ts">
import { computed } from "vue";
import { useDisplay } from "vuetify";
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import type { PublicTrackingPhase } from "@/types/publicTracking";

defineProps<{ phases: PublicTrackingPhase[] }>();

const STATUS = {
  completed: { tone: "success", label: "Completado", color: "primary" },
  in_progress: { tone: "primary", label: "En curso", color: "primary" },
  pending: { tone: "neutral", label: "Pendiente", color: "neutral" },
} as const;

const { xs } = useDisplay();
const circle = computed(() => (xs.value ? 44 : 64));
const connectorTop = computed(() => `${circle.value / 2 - 2}px`);
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    class="pa-4"
  >
    <div
      role="list"
      aria-label="Fases del envío"
      class="phase-track"
      :class="{ 'phase-track--vertical': xs }"
    >
      <template
        v-for="(phase, index) in phases"
        :key="phase.id"
      >
        <div
          v-if="index"
          class="phase-track__connector"
          aria-hidden="true"
        >
          <div
            v-if="xs"
            class="phase-track__rail bg-border"
          >
            <div
              class="bg-primary"
              :style="{ height: `${phases[index - 1]!.progress}%` }"
            />
          </div>
          <v-progress-linear
            v-else
            :model-value="phases[index - 1]!.progress"
            color="primary"
            bg-color="border"
            :bg-opacity="1"
            height="4"
            rounded
          />
        </div>
        <div
          role="listitem"
          class="phase-track__phase"
        >
          <v-avatar
            :size="circle"
            :color="STATUS[phase.status].color"
            :class="{ 'phase-track__halo': phase.status === 'in_progress' }"
          >
            <v-icon
              :icon="phase.icon"
              :size="circle / 2"
            />
          </v-avatar>
          <span class="text-title-small font-weight-bold">{{ phase.name }}</span>
          <AcoStatusChip
            :tone="STATUS[phase.status].tone"
            :label="STATUS[phase.status].label"
          />
        </div>
      </template>
    </div>
  </v-card>
</template>

<style scoped>
.phase-track {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
}
.phase-track__phase {
  display: flex;
  flex: 0 1 128px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  text-align: center;
}
.phase-track__connector {
  flex: 1 1 0;
  min-width: 12px;
  margin-top: v-bind(connectorTop);
}
.phase-track--vertical {
  flex-direction: column;
  align-items: stretch;
}
.phase-track--vertical .phase-track__phase {
  flex: none;
  flex-direction: row;
  gap: 12px;
  text-align: start;
}
.phase-track--vertical .phase-track__connector {
  flex: none;
  height: 20px;
  margin: 4px 0 4px calc(v-bind(connectorTop));
}
.phase-track__rail {
  width: 4px;
  height: 100%;
  overflow: hidden;
  border-radius: 2px;
}
.phase-track__halo {
  box-shadow: 0 0 0 6px rgb(var(--v-theme-primary-soft));
}
</style>
