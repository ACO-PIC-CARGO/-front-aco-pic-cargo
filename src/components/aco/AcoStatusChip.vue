<script setup lang="ts">
defineProps<{ tone: "success" | "primary" | "neutral"; label: string }>();
</script>

<template>
  <span
    class="aco-chip aco-status-chip"
    :class="`aco-chip--${tone}`"
  >
    <span
      class="aco-status-chip__dot"
      aria-hidden="true"
    />
    {{ label }}
  </span>
</template>

<style scoped>
.aco-status-chip {
  gap: 6px;
}

.aco-status-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
</style>
