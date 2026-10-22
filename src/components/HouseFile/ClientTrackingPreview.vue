<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { clientSteps, dayMonth, stepDateTimeLabel } from "./houseTrackingFormat";

const { phases } = storeToRefs(useHouseTrackingStore());
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const steps = computed(() => clientSteps(phases.value));
const expanded = ref<number[]>([]);

const toggle = (id: number) => {
  expanded.value = expanded.value.includes(id) ? expanded.value.filter((item) => item !== id) : [...expanded.value, id];
};
</script>

<template>
  <section
    class="aco-card client-preview"
    aria-labelledby="client-preview-title"
  >
    <header class="client-preview__header">
      <v-icon
        icon="mdi-eye-outline"
        color="primary"
        size="28"
      />
      <div>
        <h2
          id="client-preview-title"
          class="aco-title-card"
        >
          Vista de Tracking (Cliente)
        </h2>
        <p class="aco-caption">
          Así se verán los servicios seleccionados en el tracking del cliente.
        </p>
      </div>
    </header>
    <p
      v-if="!steps.length"
      class="aco-body client-preview__empty"
    >
      Ningún paso está marcado como visible para el cliente.
    </p>
    <ol
      v-else
      class="client-preview__list"
    >
      <li
        v-for="step in steps"
        :key="step.id"
        class="client-preview__step"
      >
        <div class="client-preview__when">
          <span class="client-preview__number">{{ step.number }}</span>
          <template v-if="step.confirmed_at">
            <span class="aco-title-row">{{ dayMonth(step.confirmed_at, timeZone).day }}</span>
            <span class="aco-caption">{{ dayMonth(step.confirmed_at, timeZone).month }}</span>
          </template>
        </div>
        <div class="client-preview__card">
          <div class="client-preview__row">
            <AcoIconTile
              :icon="step.icon"
              size="sm"
            />
            <div class="client-preview__body">
              <span class="aco-title-row">{{ step.name }}</span>
              <AcoStatusChip
                :tone="step.confirmed_at ? 'success' : 'neutral'"
                :label="step.confirmed_at ? 'Confirmado' : 'Pendiente'"
              />
            </div>
            <v-btn
              icon
              variant="text"
              size="small"
              :aria-expanded="expanded.includes(step.id)"
              :aria-label="`Ver detalle de ${step.name}`"
              @click="toggle(step.id)"
            >
              <v-icon :icon="expanded.includes(step.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
            </v-btn>
          </div>
          <div
            v-if="expanded.includes(step.id)"
            class="client-preview__detail"
          >
            <p class="aco-caption">
              {{ step.confirmed_at ? `Confirmado el ${stepDateTimeLabel(step.confirmed_at, timeZone)}` : "Aún pendiente" }}
            </p>
            <p
              v-for="comment in step.comments"
              :key="comment.id"
              class="aco-body"
            >
              {{ comment.comment }}
            </p>
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.client-preview {
  padding: var(--aco-space-5);
}

.client-preview__header {
  display: flex;
  gap: var(--aco-space-3);
  margin-bottom: var(--aco-space-4);
}

.client-preview__list {
  display: grid;
  gap: var(--aco-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.client-preview__step {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: var(--aco-space-3);
}

.client-preview__when {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 2px;
}

.client-preview__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
}

.client-preview__card {
  padding: var(--aco-space-3);
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: var(--aco-radius-control);
}

.client-preview__row {
  display: flex;
  align-items: center;
  gap: var(--aco-space-3);
}

.client-preview__body {
  display: grid;
  flex: 1;
  gap: var(--aco-space-1);
  justify-items: start;
  min-width: 0;
}

.client-preview__detail {
  display: grid;
  gap: var(--aco-space-2);
  margin-top: var(--aco-space-3);
}

.client-preview__empty {
  color: rgb(var(--v-theme-text-muted));
}
</style>
