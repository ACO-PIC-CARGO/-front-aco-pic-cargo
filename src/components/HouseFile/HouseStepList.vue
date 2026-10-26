<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import HouseStepItem from "./HouseStepItem.vue";
import HouseStepConfirmDialog from "./HouseStepConfirmDialog.vue";
import { useHousesStore } from "@/stores/houses";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import type { HouseTrackingStep, StepDialogMode } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; loadError: string }>();
const emit = defineEmits<{ retry: [] }>();

const housesStore = useHousesStore();
const store = useHouseTrackingStore();
const { phases, loading } = storeToRefs(store);
const dialog = ref(false);
const selected = ref<HouseTrackingStep | null>(null);
const dialogMode = ref<StepDialogMode>("confirm");
const allSteps = computed(() => phases.value.flatMap((phase) => phase.steps));
const nextStepName = computed(() => allSteps.value.find((step) => step.state === "next")?.name ?? null);

function openDialog(step: HouseTrackingStep, mode: StepDialogMode) {
  selected.value = step;
  dialogMode.value = mode;
  dialog.value = true;
}
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    class="pa-3"
    aria-labelledby="house-step-list-title"
  >
    <h2
      id="house-step-list-title"
      class="text-title-medium font-weight-bold ma-0"
    >
      Servicios a Realizar
    </h2>
    <div class="d-flex flex-wrap align-center ga-2 my-2">
      <v-chip
        prepend-icon="mdi-web"
        variant="outlined"
        size="small"
        label
      >
        Incoterm <strong class="ms-1">{{ housesStore.house.incoterms || "—" }}</strong>
      </v-chip>
      <v-alert
        density="compact"
        variant="tonal"
        color="primary"
        icon="mdi-information-outline"
        class="flex-grow-1 text-body-small"
        text="Confirma cada paso en orden. Los pasos visibles al cliente aparecen en su tracking."
      />
    </div>
    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
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
      type="table-row@6"
    />
    <p
      v-else-if="!allSteps.length"
      class="text-body-medium text-medium-emphasis"
    >
      Tu empresa aún no tiene pasos de seguimiento. Configúralos en Ficheros › Fases y pasos.
    </p>
    <v-table
      v-else
      density="compact"
    >
      <thead>
        <tr>
          <th class="px-1">
            #
          </th>
          <th class="px-1">
            Servicio
          </th>
          <th class="px-1">
            Fecha
          </th>
          <th class="px-1">
            Estado
          </th>
          <th class="px-1 text-center">
            Confirmar
          </th>
          <th class="px-1">
            Tracking
          </th>
          <th class="px-0">
            <span class="d-sr-only">Comentarios</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <HouseStepItem
          v-for="step in allSteps"
          :key="step.id"
          :house-id="props.houseId"
          :step="step"
          :blocked-by="step.state === 'blocked' ? nextStepName : null"
          @confirm="openDialog(step, 'confirm')"
          @edit-date="openDialog(step, 'date')"
        />
      </tbody>
    </v-table>
    <HouseStepConfirmDialog
      v-model="dialog"
      :house-id="props.houseId"
      :step="selected"
      :mode="dialogMode"
    />
  </v-card>
</template>
