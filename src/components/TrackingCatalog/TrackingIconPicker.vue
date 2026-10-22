<script setup lang="ts">
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import { TRACKING_ICONS } from "./trackingIcons";

const icon = defineModel<string>({ required: true });
</script>

<template>
  <fieldset class="tracking-icon-picker">
    <legend class="aco-title-row">
      Icono
    </legend>
    <div class="tracking-icon-picker__grid">
      <button
        v-for="option in TRACKING_ICONS"
        :key="option.icon"
        type="button"
        class="tracking-icon-picker__option"
        :class="{ 'is-selected': icon === option.icon }"
        :aria-label="option.label"
        :aria-pressed="icon === option.icon"
        @click="icon = option.icon"
      >
        <AcoIconTile
          :icon="option.icon"
          size="sm"
          :tone="icon === option.icon ? 'solid' : 'primary'"
        />
        <v-icon
          v-if="icon === option.icon"
          class="tracking-icon-picker__check"
          icon="mdi-check-circle"
          size="16"
          color="success-ink"
        />
        <v-tooltip
          activator="parent"
          location="top"
        >
          {{ option.label }}
        </v-tooltip>
      </button>
    </div>
  </fieldset>
</template>

<style scoped>
.tracking-icon-picker {
  margin: var(--aco-space-4) 0;
  border: 0;
  padding: 0;
}

.tracking-icon-picker legend {
  margin-bottom: var(--aco-space-2);
}

.tracking-icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: var(--aco-space-2);
}

.tracking-icon-picker__option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  border: 2px solid transparent;
  border-radius: var(--aco-radius-control);
  background: none;
  cursor: pointer;
  transition: border-color var(--aco-transition);
}

.tracking-icon-picker__option:hover,
.tracking-icon-picker__option.is-selected {
  border-color: rgb(var(--v-theme-primary));
}

.tracking-icon-picker__check {
  position: absolute;
  top: 0;
  right: 0;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
}
</style>
