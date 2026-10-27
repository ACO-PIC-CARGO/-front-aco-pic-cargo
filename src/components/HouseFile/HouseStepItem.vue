<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import HouseStepComments from "./HouseStepComments.vue";
import SendToTrackingButton from "./SendToTrackingButton.vue";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { dateLabel, stepDateTimeLabel, stepSendState } from "./houseTrackingFormat";
import { stepValidationLines } from "./stepValidation";
import type { HouseTrackingStep } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; step: HouseTrackingStep; blockedBy: string | null }>();
const emit = defineEmits<{ confirm: []; "edit-date": [] }>();

const store = useHouseTrackingStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const expanded = ref(props.step.comments.length > 0);
const commentsId = computed(() => `house-step-${props.step.id}-comments`);
const confirmed = computed(() => props.step.state === "confirmed");
const tone = computed(() => (confirmed.value ? "primary" : "neutral"));
const validationLines = computed(() => stepValidationLines(props.step, timeZone.value));
// The switch only asks to confirm; cancelling the click keeps its checked state equal to the confirmation.
function requestConfirm() {
  if (!confirmed.value) emit("confirm");
}
const switchLabel = computed(() => {
  if (confirmed.value) return `${props.step.name} confirmado`;
  if (props.blockedBy) return `Confirmar ${props.step.name}. Primero confirma «${props.blockedBy}»`;
  return `Confirmar ${props.step.name}`;
});
</script>

<template>
  <tr>
    <td class="px-1">
      <v-avatar
        size="24"
        :color="tone"
        class="text-label-small font-weight-bold"
      >
        {{ step.number }}
      </v-avatar>
    </td>
    <td class="px-1">
      <div class="d-flex align-center ga-2 py-1">
        <v-icon
          :icon="step.icon"
          :color="tone"
          size="20"
        />
        <span class="text-body-medium font-weight-medium">{{ step.name }}</span>
      </div>
    </td>
    <td class="px-1 text-no-wrap">
      <v-btn
        v-if="confirmed && step.confirmed_at"
        variant="text"
        size="small"
        color="primary"
        class="text-none px-1"
        :aria-label="`Corregir fecha de ${step.name}`"
        @click="emit('confirm')"
      >
        {{ dateLabel(step.confirmed_at, timeZone) }}
        <v-tooltip
          activator="parent"
          location="top"
        >
          Confirmado el {{ stepDateTimeLabel(step.confirmed_at, timeZone) }}. Haz clic para corregir.
        </v-tooltip>
      </v-btn>
      <v-btn
        v-else
        variant="text"
        size="small"
        :color="step.scheduled_at ? undefined : 'primary'"
        :class="['text-none px-1', { 'text-medium-emphasis': step.scheduled_at }]"
        :prepend-icon="step.scheduled_at ? undefined : 'mdi-calendar-plus'"
        :aria-label="step.scheduled_at ? `Cambiar fecha estimada de ${step.name}` : `Poner fecha a ${step.name}`"
        @click="emit('edit-date')"
      >
        {{ step.scheduled_at ? dateLabel(step.scheduled_at, timeZone) : "Poner fecha" }}
        <v-tooltip
          v-if="step.scheduled_at"
          activator="parent"
          location="top"
        >
          Fecha estimada. Haz clic para cambiarla.
        </v-tooltip>
      </v-btn>
    </td>
    <td class="px-1">
      <AcoStatusChip
        :tone="confirmed ? 'success' : 'neutral'"
        :label="confirmed ? 'Confirmado' : 'Pendiente'"
      />
    </td>
    <td class="px-1 text-center">
      <div class="d-inline-flex">
        <v-switch
          :model-value="confirmed"
          :aria-label="switchLabel"
          color="primary"
          inset
          hide-details
          density="compact"
          :readonly="confirmed"
          :disabled="step.state === 'blocked'"
          @click.prevent="requestConfirm"
        />
        <v-tooltip
          v-if="blockedBy"
          activator="parent"
          location="top"
        >
          Primero confirma «{{ blockedBy }}»
        </v-tooltip>
      </div>
    </td>
    <td class="px-1">
      <SendToTrackingButton
        :state="stepSendState(step)"
        :sent-at="step.sent_at"
        blocked-hint="Confirma el paso para enviarlo."
        :confirm-text="`¿Enviar «${step.name}» al tracking del cliente?`"
        :send="() => store.sendStep(houseId, step.id)"
        :withdraw-confirm-text="`¿Retirar «${step.name}» del tracking del cliente? Sus comentarios también se retiran.`"
        :withdraw="() => store.withdrawStep(houseId, step.id)"
      />
    </td>
    <td class="px-0">
      <v-btn
        icon
        variant="text"
        size="x-small"
        :aria-expanded="expanded"
        :aria-controls="commentsId"
        :aria-label="`${expanded ? 'Ocultar' : 'Ver'} comentarios de ${step.name}`"
        @click="expanded = !expanded"
      >
        <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
      </v-btn>
    </td>
  </tr>
  <tr v-if="validationLines.length">
    <td />
    <td
      colspan="6"
      class="px-1 pb-2"
    >
      <div class="d-flex flex-wrap align-center ga-4 text-body-small">
        <span
          v-for="line in validationLines"
          :key="line.label"
          class="d-inline-flex align-center ga-1"
          :class="line.warning ? 'text-warning-strong text-body-medium font-weight-bold' : 'text-medium-emphasis'"
        >
          <v-icon
            :icon="line.icon"
            :size="line.warning ? 20 : 16"
          />
          {{ line.label }}
        </span>
      </div>
    </td>
  </tr>
  <tr v-if="expanded">
    <td
      :id="commentsId"
      colspan="7"
      class="pb-2"
    >
      <HouseStepComments
        :house-id="houseId"
        :step="step"
      />
    </td>
  </tr>
</template>
