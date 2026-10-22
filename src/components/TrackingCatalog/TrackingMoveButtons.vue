<script setup lang="ts">
import type { MoveDirection } from "@/types/trackingCatalog";

defineProps<{ label: string; isFirst: boolean; isLast: boolean }>();
const emit = defineEmits<{ move: [direction: MoveDirection] }>();
</script>

<template>
  <div class="tracking-move-buttons">
    <v-btn
      icon
      variant="text"
      :disabled="isFirst"
      :aria-label="`Subir ${label}`"
      @click="emit('move', 'up')"
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
      :aria-label="`Bajar ${label}`"
      @click="emit('move', 'down')"
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
