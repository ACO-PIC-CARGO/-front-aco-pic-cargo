<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import HouseStepItem from "./HouseStepItem.vue";
import HouseStepConfirmDialog from "./HouseStepConfirmDialog.vue";
import HouseStepWeightCheckDialog from "./HouseStepWeightCheckDialog.vue";
import TrackingLinkButton from "./TrackingLinkButton.vue";
import { useHousesStore } from "@/stores/houses";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { needsWeightCheck, quotedValue } from "./weightCheck";
import { quoteValidityBadge } from "./stepValidation";
import type { HouseTrackingStep, StepDialogMode, WeightCheck } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; loadError: string }>();
const emit = defineEmits<{ retry: [] }>();

const housesStore = useHousesStore();
const store = useHouseTrackingStore();
const { phases, loading } = storeToRefs(store);
const dialog = ref(false);
const selectedId = ref<number | null>(null);
const dialogMode = ref<StepDialogMode>("confirm");
const weightDialog = ref(false);
const weightCheck = ref<WeightCheck | null>(null);
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const allSteps = computed(() => phases.value.flatMap((phase) => phase.steps));
const quoteBadge = computed(() => quoteValidityBadge(allSteps.value, timeZone.value));
const selected = computed(() => allSteps.value.find((step) => step.id === selectedId.value) ?? null);
const nextStepName = computed(() => allSteps.value.find((step) => step.state === "next")?.name ?? null);

function openDialog(step: HouseTrackingStep, mode: StepDialogMode) {
  selectedId.value = step.id;
  dialogMode.value = mode;
  weightCheck.value = null;
  if (needsWeightCheck(step, mode)) weightDialog.value = true;
  else dialog.value = true;
}

function continueAfterWeightCheck(check: WeightCheck) {
  weightCheck.value = check;
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
    <div class="d-flex flex-wrap align-center justify-space-between ga-2">
      <h2
        id="house-step-list-title"
        class="text-title-medium font-weight-bold ma-0"
      >
        Servicios a Realizar
      </h2>
      <TrackingLinkButton :house-id="props.houseId" />
    </div>
    <div class="d-flex flex-wrap align-center ga-2 my-2">
      <v-chip
        prepend-icon="mdi-web"
        variant="outlined"
        size="small"
        label
      >
        Incoterm <strong class="ms-1">{{ housesStore.house.incoterms || "—" }}</strong>
      </v-chip>
      <v-chip
        v-if="quoteBadge"
        :prepend-icon="quoteBadge.warning ? 'mdi-file-alert-outline' : 'mdi-file-check-outline'"
        :color="quoteBadge.warning ? 'warning' : undefined"
        variant="tonal"
        size="small"
        label
      >
        {{ quoteBadge.label }}
      </v-chip>
      <v-alert
        density="compact"
        variant="tonal"
        color="primary"
        icon="mdi-information-outline"
        class="flex-grow-1 text-body-small"
        :class="{ 'house-step-list__notice--own-line': quoteBadge }"
        text="Confirma cada paso en orden y usa «Enviar a tracking» para que tu cliente lo vea. Tu cliente también ve el próximo paso con su fecha."
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
      :validation="weightCheck"
    />
    <HouseStepWeightCheckDialog
      v-model="weightDialog"
      :quoted-weight="quotedValue(housesStore.house.peso)"
      :quoted-volume="quotedValue(housesStore.house.volumen)"
      @confirmed="continueAfterWeightCheck"
    />
  </v-card>
</template>

<style scoped>
.house-step-list__notice--own-line {
  flex-basis: 100%;
}
</style>
