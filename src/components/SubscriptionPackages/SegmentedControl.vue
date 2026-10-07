<template>
  <div
    class="segmented"
    :class="{ 'segmented--disabled': disabled }"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="segmented__option"
      :class="{ 'segmented__option--active': option.value === value }"
      :aria-pressed="String(option.value === value)"
      :disabled="disabled"
      @click="$emit('input', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: "SegmentedControl",
  props: {
    value: { type: [String, Number, Boolean], default: null },
    options: { type: Array, required: true },
    label: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
};
</script>

<style scoped>
.segmented {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.segmented__option {
  min-width: 76px;
  min-height: 34px;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--planes-text-muted);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.segmented__option:not(.segmented__option--active):not(:disabled):hover {
  color: var(--planes-text);
}

.segmented__option--active {
  background: var(--planes-accent);
  color: var(--planes-accent-ink);
  font-weight: 600;
}

.segmented__option:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 3px;
}

.segmented--disabled {
  opacity: 0.5;
}

.segmented__option:disabled {
  cursor: not-allowed;
}
</style>
