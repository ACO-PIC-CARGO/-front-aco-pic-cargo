<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import AcoStepNumber from "@/components/aco/AcoStepNumber.vue";
import HouseStepComments from "./HouseStepComments.vue";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { dateLabel, stepDateTimeLabel } from "./houseTrackingFormat";
import type { HouseTrackingStep } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; step: HouseTrackingStep; blockedBy: string | null }>();
const emit = defineEmits<{ confirm: [] }>();

const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const expanded = ref(props.step.comments.length > 0);
const commentsId = computed(() => `house-step-${props.step.id}-comments`);
const confirmed = computed(() => props.step.state === "confirmed");
const shownDate = computed(() => (props.step.confirmed_at ? dateLabel(props.step.confirmed_at, timeZone.value) : "-"));
const confirmedAtLabel = computed(() =>
  props.step.confirmed_at ? stepDateTimeLabel(props.step.confirmed_at, timeZone.value) : "",
);
</script>

<template>
  <li
    class="house-step"
    :class="`house-step--${step.state}`"
  >
    <div class="house-step__row">
      <AcoStepNumber
        :number="step.number"
        :muted="step.state === 'blocked'"
        size="sm"
        class="house-step__number"
      />
      <div class="house-step__service">
        <v-icon
          :icon="step.icon"
          color="primary"
          size="26"
        />
        <span class="aco-title-row">{{ step.name }}</span>
      </div>
      <button
        v-if="confirmed"
        type="button"
        class="house-step__date is-editable"
        :aria-label="`Corregir fecha de ${step.name}`"
        @click="emit('confirm')"
      >
        <v-icon
          icon="mdi-calendar-blank-outline"
          size="18"
        />
        {{ shownDate }}
        <v-tooltip
          activator="parent"
          location="top"
        >
          Confirmado el {{ confirmedAtLabel }}. Haz clic para corregir.
        </v-tooltip>
      </button>
      <span
        v-else
        class="house-step__date"
      >
        <v-icon
          icon="mdi-calendar-blank-outline"
          size="18"
        />
        {{ shownDate }}
      </span>
      <AcoStatusChip
        class="house-step__status"
        :tone="confirmed ? 'success' : 'neutral'"
        :label="confirmed ? 'Confirmado' : 'Pendiente'"
      />
      <div class="house-step__switch">
        <v-switch
          :model-value="confirmed"
          :aria-label="confirmed ? `${step.name} confirmado` : `Confirmar ${step.name}`"
          color="primary"
          inset
          hide-details
          density="compact"
          :readonly="confirmed"
          :disabled="step.state === 'blocked'"
          @update:model-value="emit('confirm')"
        />
        <v-tooltip
          v-if="blockedBy"
          activator="parent"
          location="top"
        >
          Primero confirma «{{ blockedBy }}»
        </v-tooltip>
      </div>
      <v-btn
        icon
        variant="text"
        size="small"
        :aria-expanded="expanded"
        :aria-controls="commentsId"
        :aria-label="`${expanded ? 'Ocultar' : 'Ver'} comentarios de ${step.name}`"
        @click="expanded = !expanded"
      >
        <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
      </v-btn>
    </div>
    <HouseStepComments
      v-if="expanded"
      :id="commentsId"
      class="house-step__comments"
      :house-id="houseId"
      :step="step"
    />
  </li>
</template>

<style scoped>
.house-step {
  position: relative;
  padding: var(--aco-space-2) 0;
  border-top: 1px solid rgb(var(--v-theme-border));
}

.house-step:not(:last-child)::before {
  content: "";
  position: absolute;
  top: 36px;
  bottom: -8px;
  left: 13px;
  width: 2px;
  background: rgb(var(--v-theme-primary-soft));
}

.house-step__row {
  display: grid;
  grid-template-columns: var(--house-step-columns);
  align-items: center;
  gap: var(--aco-space-3);
}

.house-step__number {
  position: relative;
  z-index: 1;
}

.house-step__service {
  display: flex;
  align-items: center;
  gap: var(--aco-space-3);
  min-width: 0;
}

.house-step__date {
  display: inline-flex;
  align-items: center;
  gap: var(--aco-space-2);
  min-height: 36px;
  padding: 0 var(--aco-space-3);
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: var(--aco-radius-control);
  background: rgb(var(--v-theme-surface));
  font-size: 13px;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface));
}

.house-step__date.is-editable {
  cursor: pointer;
  transition: border-color var(--aco-transition);
}

.house-step__date.is-editable:hover {
  border-color: rgb(var(--v-theme-primary));
}

.house-step__status {
  justify-self: start;
}

.house-step__switch {
  display: flex;
  justify-content: center;
}

.house-step__comments {
  margin: var(--aco-space-2) 0 var(--aco-space-1) calc(28px + var(--aco-space-3));
}

@media (max-width: 760px) {
  .house-step__row {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }

  .house-step__date,
  .house-step__status {
    grid-column: 2;
  }
}
</style>
