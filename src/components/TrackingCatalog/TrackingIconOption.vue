<script setup lang="ts">
import AcoIconTile from "@/components/aco/AcoIconTile.vue";
import type { TrackingIcon } from "./trackingIcons";

defineProps<{ option: TrackingIcon; selected: boolean }>();
const emit = defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    class="tracking-icon-option"
    :class="{ 'is-selected': selected }"
    :aria-label="option.label"
    :aria-pressed="selected"
    @click="emit('select')"
  >
    <AcoIconTile
      :icon="option.icon"
      size="sm"
      :tone="selected ? 'solid' : 'primary'"
    />
    <v-icon
      v-if="selected"
      class="tracking-icon-option__check"
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
</template>

<style scoped>
.tracking-icon-option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 48px;
  border: 2px solid transparent;
  border-radius: var(--aco-radius-control);
  background: none;
  cursor: pointer;
  transition: border-color var(--aco-transition);
}

.tracking-icon-option:hover,
.tracking-icon-option.is-selected {
  border-color: rgb(var(--v-theme-primary));
}

.tracking-icon-option__check {
  position: absolute;
  top: 0;
  right: 0;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
}
</style>
