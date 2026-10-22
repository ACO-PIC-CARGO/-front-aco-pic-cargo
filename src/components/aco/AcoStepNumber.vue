<script setup lang="ts">
withDefaults(defineProps<{ number: number | null; muted?: boolean; size?: "sm" | "md" }>(), { size: "md" });
</script>

<template>
  <span
    class="aco-step-number"
    :class="[`aco-step-number--${size}`, { 'aco-step-number--off': number === null || muted }]"
  >
    {{ number ?? "—" }}
  </span>
</template>

<style scoped>
.aco-step-number {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
}

.aco-step-number--md {
  width: 36px;
  height: 36px;
  font-size: 16px;
}

.aco-step-number--sm {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

.aco-step-number--off {
  background: rgb(var(--v-theme-neutral));
  color: rgb(var(--v-theme-on-neutral));
}
</style>
