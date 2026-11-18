<script setup lang="ts">
import { computed } from "vue";
import { priorityChipStyle } from "./priorityColor";

const props = defineProps<{ name: string | null; color: string | null }>();

const style = computed(() => priorityChipStyle(props.color));
</script>

<template>
  <span
    v-if="name"
    class="quote-priority-chip"
    :class="{ 'quote-priority-chip--plain': !style }"
    :style="style ?? undefined"
  >
    {{ name }}
  </span>
</template>

<style scoped>
.quote-priority-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
}

.quote-priority-chip--plain {
  border: 1px solid #9ca3af;
  color: #1f2937;
}
</style>
