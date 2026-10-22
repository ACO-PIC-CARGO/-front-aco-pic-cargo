<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import HouseStepItem from "./HouseStepItem.vue";
import HouseStepConfirmDialog from "./HouseStepConfirmDialog.vue";
import { useHousesStore } from "@/stores/houses";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import type { HouseTrackingStep } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; loadError: string }>();
const emit = defineEmits<{ retry: [] }>();

const housesStore = useHousesStore();
const store = useHouseTrackingStore();
const { phases, loading } = storeToRefs(store);
const dialog = ref(false);
const selected = ref<HouseTrackingStep | null>(null);
const allSteps = computed(() => phases.value.flatMap((phase) => phase.steps));
const nextStepName = computed(() => allSteps.value.find((step) => step.state === "next")?.name ?? null);

function openConfirm(step: HouseTrackingStep) {
  selected.value = step;
  dialog.value = true;
}
</script>

<template>
  <section
    class="aco-card house-step-list"
    aria-labelledby="house-step-list-title"
  >
    <h2
      id="house-step-list-title"
      class="aco-title-card"
    >
      Servicios a Realizar
    </h2>
    <div class="house-step-list__toolbar">
      <div class="house-step-list__incoterm">
        <v-icon
          icon="mdi-web"
          color="primary"
          size="22"
        />
        <span class="aco-title-row">Incoterm</span>
        <span class="house-step-list__incoterm-value">{{ housesStore.house.incoterms || "—" }}</span>
      </div>
      <p class="house-step-list__hint">
        <v-icon
          icon="mdi-information-outline"
          color="primary"
          size="18"
        />
        Confirma cada paso en orden. Los pasos visibles al cliente aparecen en su tracking.
      </p>
    </div>
    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mt-4"
      :text="loadError"
    >
      <template #append>
        <v-btn
          variant="text"
          @click="emit('retry')"
        >
          Reintentar
        </v-btn>
      </template>
    </v-alert>
    <v-skeleton-loader
      v-else-if="loading && !allSteps.length"
      type="list-item-avatar-two-line@4"
    />
    <p
      v-else-if="!allSteps.length"
      class="aco-body house-step-list__empty"
    >
      Tu empresa aún no tiene pasos de seguimiento. Configúralos en Ficheros › Fases y pasos.
    </p>
    <template v-else>
      <div
        class="house-step-list__head"
        aria-hidden="true"
      >
        <span>#</span>
        <span>Servicio</span>
        <span>Fecha</span>
        <span>Estado</span>
        <span class="house-step-list__head-center">Enviar a Tracking</span>
        <span />
      </div>
      <ol class="house-step-list__steps">
        <HouseStepItem
          v-for="step in allSteps"
          :key="step.id"
          :house-id="props.houseId"
          :step="step"
          :blocked-by="step.state === 'blocked' ? nextStepName : null"
          @confirm="openConfirm(step)"
        />
      </ol>
    </template>
    <HouseStepConfirmDialog
      v-model="dialog"
      :house-id="props.houseId"
      :step="selected"
    />
  </section>
</template>

<style scoped>
.house-step-list {
  --house-step-columns: 28px minmax(0, 1fr) 136px 112px 92px 32px;

  padding: var(--aco-space-5);
}

.house-step-list__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-3) var(--aco-space-4);
  margin: var(--aco-space-4) 0;
}

.house-step-list__incoterm {
  display: flex;
  align-items: center;
  gap: var(--aco-space-3);
}

.house-step-list__incoterm-value {
  min-width: 120px;
  padding: var(--aco-space-2) var(--aco-space-3);
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: var(--aco-radius-control);
  font-size: 13px;
  font-weight: 600;
}

.house-step-list__hint {
  display: flex;
  flex: 1 1 260px;
  align-items: center;
  gap: var(--aco-space-2);
  margin: 0;
  padding: var(--aco-space-2) var(--aco-space-3);
  border-radius: var(--aco-radius-control);
  background: rgba(var(--v-theme-primary-soft), 0.6);
  font-size: 13px;
  color: rgb(var(--v-theme-text-muted));
}

.house-step-list__head {
  display: grid;
  grid-template-columns: var(--house-step-columns);
  gap: var(--aco-space-3);
  padding: var(--aco-space-2) 0;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-muted));
}

.house-step-list__head-center {
  text-align: center;
}

.house-step-list__steps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.house-step-list__empty {
  margin-top: var(--aco-space-4);
  color: rgb(var(--v-theme-text-muted));
}

@media (max-width: 760px) {
  .house-step-list {
    padding: var(--aco-space-4);
  }

  .house-step-list__head {
    display: none;
  }
}
</style>
