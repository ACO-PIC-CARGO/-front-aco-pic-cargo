<script setup lang="ts">
import { ref, watch } from "vue";
import type { MoveDirection } from "@/types/trackingCatalog";

const props = defineProps<{ label: string; isFirst: boolean; isLast: boolean; busy: boolean }>();
const emit = defineEmits<{ move: [direction: MoveDirection] }>();

const pending = ref<MoveDirection | null>(null);
watch(
  () => props.busy,
  (busy) => {
    if (!busy) pending.value = null;
  },
);

function move(direction: MoveDirection) {
  pending.value = direction;
  emit("move", direction);
}
</script>

<template>
  <div class="tracking-move-buttons">
    <v-btn
      icon
      variant="text"
      :disabled="isFirst"
      :loading="pending === 'up'"
      :aria-label="`Subir ${label}`"
      @click="move('up')"
    >
      <v-icon icon="mdi-arrow-up" />
      <v-tooltip
        activator="parent"
        location="top"
      >
        Subir
      </v-tooltip>
    </v-btn>
    <v-btn
      icon
      variant="text"
      :disabled="isLast"
      :loading="pending === 'down'"
      :aria-label="`Bajar ${label}`"
      @click="move('down')"
    >
      <v-icon icon="mdi-arrow-down" />
      <v-tooltip
        activator="parent"
        location="top"
      >
        Bajar
      </v-tooltip>
    </v-btn>
  </div>
</template>

<style scoped>
.tracking-move-buttons {
  display: inline-flex;
}
</style>
