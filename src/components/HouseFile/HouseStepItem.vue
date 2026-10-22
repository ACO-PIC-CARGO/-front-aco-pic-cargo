<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import AcoStepNumber from "@/components/aco/AcoStepNumber.vue";
import HouseStepComments from "./HouseStepComments.vue";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { latestComment, stepDateTimeLabel } from "./houseTrackingFormat";
import type { HouseTrackingStep } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; step: HouseTrackingStep; blockedBy: string | null }>();
const emit = defineEmits<{ confirm: [] }>();

const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const expanded = ref(false);
const lastComment = computed(() => latestComment(props.step));
const commentsId = computed(() => `house-step-${props.step.id}-comments`);
const switchLabel = computed(() => (props.step.state === "confirmed" ? "Confirmado" : "Confirmar"));
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
      />
      <AcoIconTile
        :icon="step.icon"
        :tone="step.state === 'blocked' ? 'neutral' : 'primary'"
      />
      <div class="house-step__body">
        <span class="aco-title-row">{{ step.name }}</span>
        <span class="aco-caption house-step__date">
          <v-icon
            icon="mdi-calendar-month-outline"
            size="16"
          />
          {{ step.confirmed_at ? stepDateTimeLabel(step.confirmed_at, timeZone) : "–" }}
          <v-btn
            v-if="step.state === 'confirmed'"
            icon
            variant="text"
            size="small"
            :aria-label="`Corregir fecha de ${step.name}`"
            @click="emit('confirm')"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip
              activator="parent"
              location="top"
            >
              Corregir fecha
            </v-tooltip>
          </v-btn>
        </span>
      </div>
      <div class="house-step__actions">
        <div>
          <v-switch
            :model-value="step.state === 'confirmed'"
            :label="switchLabel"
            color="success"
            inset
            hide-details
            density="compact"
            :readonly="step.state === 'confirmed'"
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
          :aria-expanded="expanded"
          :aria-controls="commentsId"
          :aria-label="`${expanded ? 'Ocultar' : 'Ver'} comentarios de ${step.name}`"
          @click="expanded = !expanded"
        >
          <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </v-btn>
      </div>
    </div>
    <div
      v-if="lastComment && !expanded"
      class="house-step__last"
    >
      <span class="aco-caption">Comentario {{ lastComment.is_public ? "público" : "interno" }} (último) · {{ lastComment.author ?? "Usuario" }} · {{ stepDateTimeLabel(lastComment.created_at, timeZone) }}</span>
      <p class="aco-body">
        {{ lastComment.comment }}
      </p>
    </div>
    <HouseStepComments
      v-if="expanded"
      :id="commentsId"
      :house-id="houseId"
      :step="step"
    />
  </li>
</template>

<style scoped>
.house-step {
  display: grid;
  gap: var(--aco-space-3);
  padding: var(--aco-space-3) 0;
  border-top: 1px solid rgb(var(--v-theme-border));
}

.house-step__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-3) var(--aco-space-4);
}

.house-step__body {
  display: grid;
  flex: 1 1 200px;
  min-width: 0;
}

.house-step__actions {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

.house-step__date {
  display: inline-flex;
  align-items: center;
  gap: var(--aco-space-1);
}

.house-step__last {
  margin-left: 52px;
  padding: var(--aco-space-3) var(--aco-space-4);
  border-radius: var(--aco-radius-control);
  background: rgb(var(--v-theme-background));
}
</style>
