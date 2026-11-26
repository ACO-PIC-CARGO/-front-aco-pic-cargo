<script setup lang="ts">
import { useId } from "vue";

// Campo del expediente máster con la etiqueta encima (inline: etiqueta a la izquierda).
defineProps<{ label: string; inline?: boolean }>();
const id = useId();
</script>

<template>
  <div :class="['master-field', { 'master-field--inline': inline }]">
    <label
      :for="id"
      class="master-field__label"
    >{{ label }}</label>
    <div class="master-field__control">
      <slot :id="id" />
    </div>
  </div>
</template>

<style scoped>
.master-field__label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}
.master-field--inline {
  display: flex;
  align-items: center;
  gap: 12px;
}
.master-field--inline .master-field__label {
  flex: 0 0 120px;
  margin-bottom: 0;
}
.master-field--inline .master-field__control {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
