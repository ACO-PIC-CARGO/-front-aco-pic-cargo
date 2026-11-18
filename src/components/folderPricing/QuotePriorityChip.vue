<script setup lang="ts">
import { computed } from "vue";
import { LIGHT_COLOR_BORDER_COLOR, LIGHT_COLOR_TEXT, priorityChipStyle } from "./priorityColor";

const props = defineProps<{ name: string | null; color: string | null }>();

const style = computed(() => priorityChipStyle(props.color));
const plainStyle = { border: `1px solid ${LIGHT_COLOR_BORDER_COLOR}`, color: LIGHT_COLOR_TEXT };
</script>

<template>
  <span
    v-if="name"
    class="quote-priority-chip"
    :style="style ?? plainStyle"
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
</style>
