<script setup lang="ts">
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import "@/styles/aco-ui.css";
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import TrackingPhaseCard from "@/components/TrackingCatalog/TrackingPhaseCard.vue";
import TrackingPhaseDialog from "@/components/TrackingCatalog/TrackingPhaseDialog.vue";
import TrackingStepDialog from "@/components/TrackingCatalog/TrackingStepDialog.vue";
import { useTrackingCatalogStore } from "@/stores/trackingCatalog";
import type { TrackingPhase, TrackingStep } from "@/types/trackingCatalog";

const store = useTrackingCatalogStore();
const { phases, loading } = storeToRefs(store);

const loadError = ref("");
const phaseDialog = ref(false);
const editingPhase = ref<TrackingPhase | null>(null);
const stepDialog = ref(false);
const editingStep = ref<TrackingStep | null>(null);
const stepPhaseId = ref<number | null>(null);

async function load() {
  loadError.value = (await store.loadCatalog()) ?? "";
}

function openPhase(phase: TrackingPhase | null) {
  editingPhase.value = phase;
  phaseDialog.value = true;
}

function openStep(phaseId: number, step: TrackingStep | null) {
  stepPhaseId.value = phaseId;
  editingStep.value = step;
  stepDialog.value = true;
}

onMounted(() => {
  load();
  store.loadValidations();
  store.loadDateDefaults();
});
</script>

<template>
  <v-theme-provider
    theme="aco"
    with-background
    class="aco-ui tracking-catalog"
  >
    <header class="tracking-catalog__header">
      <div>
        <h1 class="aco-title-page">
          Fases y pasos del seguimiento
        </h1>
        <p class="aco-caption">
          Agrupa los pasos en fases y ordénalos como se cumplen. Una fase se cierra al confirmar su último paso.
        </p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openPhase(null)"
      >
        Agregar fase
      </v-btn>
    </header>

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="loadError"
    >
      <template #append>
        <v-btn
          variant="text"
          @click="load"
        >
          Reintentar
        </v-btn>
      </template>
    </v-alert>

    <div
      v-if="loading && !phases.length"
      class="tracking-catalog__list"
      aria-busy="true"
    >
      <v-skeleton-loader
        v-for="placeholder in 3"
        :key="placeholder"
        class="aco-card"
        type="list-item-avatar-two-line, list-item-avatar, list-item-avatar"
      />
    </div>
    <div
      v-else-if="!phases.length && !loadError"
      class="aco-card tracking-catalog__empty"
    >
      <AcoIconTile
        icon="mdi-format-list-numbered"
        size="lg"
      />
      <p class="aco-body">
        Aún no tienes fases. Crea la primera para agrupar los pasos del seguimiento.
      </p>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openPhase(null)"
      >
        Agregar fase
      </v-btn>
    </div>
    <div
      v-else
      class="tracking-catalog__list"
    >
      <TrackingPhaseCard
        v-for="(phase, index) in phases"
        :key="phase.id"
        :phase="phase"
        :is-first="index === 0"
        :is-last="index === phases.length - 1"
        @edit-phase="openPhase(phase)"
        @add-step="openStep(phase.id, null)"
        @edit-step="(step) => openStep(phase.id, step)"
      />
    </div>

    <TrackingPhaseDialog
      v-model="phaseDialog"
      :phase="editingPhase"
    />
    <TrackingStepDialog
      v-model="stepDialog"
      :step="editingStep"
      :phase-id="stepPhaseId"
    />
  </v-theme-provider>
</template>

<style scoped>
.tracking-catalog {
  min-height: 100%;
  padding: var(--aco-space-5);
}

.tracking-catalog__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--aco-space-4);
  margin-bottom: var(--aco-space-5);
}

.tracking-catalog__list {
  display: grid;
  gap: var(--aco-space-4);
}

.tracking-catalog__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--aco-space-4);
  padding: var(--aco-space-6);
  text-align: center;
}

@media (max-width: 600px) {
  .tracking-catalog {
    padding: var(--aco-space-4);
  }
}
</style>
