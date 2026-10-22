<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import HouseStepItem from "./HouseStepItem.vue";
import HouseStepConfirmDialog from "./HouseStepConfirmDialog.vue";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import type { HouseTrackingStep } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; loadError: string }>();
const emit = defineEmits<{ retry: [] }>();

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
      Seguimiento del expediente
    </h2>
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
    <ol
      v-else
      class="house-step-list__steps"
    >
      <HouseStepItem
        v-for="step in allSteps"
        :key="step.id"
        :house-id="props.houseId"
        :step="step"
        :blocked-by="step.state === 'blocked' ? nextStepName : null"
        @confirm="openConfirm(step)"
      />
    </ol>
    <HouseStepConfirmDialog
      v-model="dialog"
      :house-id="props.houseId"
      :step="selected"
    />
  </section>
</template>

<style scoped>
.house-step-list {
  padding: var(--aco-space-5);
}

.house-step-list__steps {
  margin: var(--aco-space-4) 0 0;
  padding: 0;
  list-style: none;
}

.house-step-list__empty {
  margin-top: var(--aco-space-4);
  color: rgb(var(--v-theme-text-muted));
}
</style>
