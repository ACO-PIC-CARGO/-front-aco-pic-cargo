<script setup lang="ts">
defineProps<{ number: number | null }>();
</script>

<template>
  <span
    class="aco-step-number"
    :class="{ 'aco-step-number--off': number === null }"
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 16px;
  font-weight: 700;
}

.aco-step-number--off {
  background: rgb(var(--v-theme-neutral));
  color: rgb(var(--v-theme-on-neutral));
}
</style>
