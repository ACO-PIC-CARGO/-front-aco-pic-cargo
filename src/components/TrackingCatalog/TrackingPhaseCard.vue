<script setup lang="ts">
import { computed } from "vue";
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import AcoStepNumber from "@/components/aco/AcoStepNumber.vue";
import TrackingMoveButtons from "./TrackingMoveButtons.vue";
import { stepRangeLabel, useTrackingCatalogStore } from "@/stores/trackingCatalog";
import type { TrackingPhase, TrackingStep } from "@/types/trackingCatalog";

const props = defineProps<{ phase: TrackingPhase; isFirst: boolean; isLast: boolean }>();
const emit = defineEmits<{ "edit-phase": []; "add-step": []; "edit-step": [step: TrackingStep] }>();

const store = useTrackingCatalogStore();
const titleId = computed(() => `tracking-phase-${props.phase.id}`);
const rangeLabel = computed(() => stepRangeLabel(props.phase));
</script>

<template>
  <section
    class="aco-card tracking-phase"
    :aria-labelledby="titleId"
  >
    <header class="tracking-phase__header">
      <AcoIconTile
        :icon="phase.icon"
        size="lg"
        :tone="phase.active ? 'solid' : 'neutral'"
      />
      <div class="tracking-phase__heading">
        <h2
          :id="titleId"
          class="aco-title-card"
        >
          {{ phase.name }}
        </h2>
        <p class="aco-caption">
          {{ rangeLabel }}
        </p>
      </div>
      <span
        v-if="!phase.active"
        class="aco-chip aco-chip--neutral"
      >Inactiva</span>
      <div class="tracking-phase__actions">
        <TrackingMoveButtons
          :label="`fase ${phase.name}`"
          :is-first="isFirst"
          :is-last="isLast"
          @move="(direction) => store.movePhase(phase.id, direction)"
        />
        <v-btn
          icon
          variant="text"
          :aria-label="`Editar fase ${phase.name}`"
          @click="emit('edit-phase')"
        >
          <v-icon icon="mdi-pencil-outline" />
          <v-tooltip
            activator="parent"
            location="top"
          >
            Editar fase
          </v-tooltip>
        </v-btn>
      </div>
    </header>

    <ol
      v-if="phase.steps.length"
      class="tracking-phase__steps"
    >
      <li
        v-for="(step, index) in phase.steps"
        :key="step.id"
        class="tracking-step"
      >
        <AcoStepNumber :number="step.number" />
        <AcoIconTile
          :icon="step.icon"
          :tone="step.active ? 'primary' : 'neutral'"
        />
        <div class="tracking-step__body">
          <span class="aco-title-row">{{ step.name }}</span>
          <span
            v-if="!step.active"
            class="aco-chip aco-chip--neutral"
          >Inactivo</span>
        </div>
        <v-switch
          :model-value="step.visible_to_client"
          label="Visible al cliente"
          color="success"
          inset
          hide-details
          density="compact"
          class="tracking-step__visibility"
          @update:model-value="(visible) => store.setStepVisibility(phase.id, step, Boolean(visible))"
        />
        <div class="tracking-step__actions">
          <TrackingMoveButtons
            :label="`paso ${step.name}`"
            :is-first="index === 0"
            :is-last="index === phase.steps.length - 1"
            @move="(direction) => store.moveStep(step.id, direction)"
          />
          <v-btn
            icon
            variant="text"
            :aria-label="`Editar paso ${step.name}`"
            @click="emit('edit-step', step)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip
              activator="parent"
              location="top"
            >
              Editar paso
            </v-tooltip>
          </v-btn>
        </div>
      </li>
    </ol>
    <p
      v-else
      class="tracking-phase__empty aco-body"
    >
      Esta fase aún no tiene pasos. Agrega el primero.
    </p>

    <footer class="tracking-phase__footer">
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-plus"
        @click="emit('add-step')"
      >
        Agregar paso
      </v-btn>
    </footer>
  </section>
</template>

<style scoped>
.tracking-phase {
  padding: var(--aco-space-5);
}

.tracking-phase__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-4);
}

.tracking-phase__heading {
  flex: 1 1 200px;
  min-width: 0;
}

.tracking-phase__actions,
.tracking-step__actions {
  display: inline-flex;
  align-items: center;
}

.tracking-phase__steps {
  margin: var(--aco-space-4) 0 0;
  padding: 0;
  list-style: none;
}

.tracking-step {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-3) var(--aco-space-4);
  padding: var(--aco-space-3) 0;
  border-top: 1px solid rgb(var(--v-theme-border));
}

.tracking-step:not(:last-child)::before {
  content: "";
  position: absolute;
  top: calc(50% + 18px);
  bottom: calc(-50% + 18px);
  left: 17px;
  width: 2px;
  background: rgb(var(--v-theme-primary-soft));
}

.tracking-step__body {
  display: flex;
  flex: 1 1 220px;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-2);
  min-width: 0;
}

.tracking-step__visibility {
  flex: 0 0 auto;
}

.tracking-phase__empty {
  margin-top: var(--aco-space-4);
  padding: var(--aco-space-4);
  border-radius: var(--aco-radius-control);
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-text-muted));
}

.tracking-phase__footer {
  margin-top: var(--aco-space-4);
}
</style>
