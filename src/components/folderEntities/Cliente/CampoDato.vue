<script setup lang="ts">
// One labelled datum of the client: its value while reading, the slotted input while editing.
defineProps<{ label: string; value?: string | number | null; editing?: boolean; wide?: boolean; required?: boolean }>();
</script>

<template>
  <div
    class="cli-field"
    :class="{ 'cli-field--wide': wide, 'cli-field--editing': editing }"
  >
    <div class="cli-field__label">
      {{ label }}<span
        v-if="editing && required"
        class="cli-field__required"
        aria-hidden="true"
      > *</span>
    </div>
    <slot v-if="editing" />
    <div
      v-else
      class="cli-field__value"
      :class="{ 'cli-field__value--muted': !$slots.value && !value && value !== 0 }"
    >
      <slot name="value">
        {{ value || value === 0 ? value : "—" }}
      </slot>
    </div>
  </div>
</template>
