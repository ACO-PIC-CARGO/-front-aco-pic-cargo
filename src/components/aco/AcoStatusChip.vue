<script setup lang="ts">
const COLORS = { success: "success-ink", primary: "primary", neutral: "neutral-ink" } as const;

defineProps<{ tone: keyof typeof COLORS; label: string }>();
</script>

<template>
  <v-chip
    size="x-small"
    variant="tonal"
    :color="COLORS[tone]"
    class="font-weight-bold"
  >
    <v-icon
      start
      icon="mdi-circle"
      size="8"
    />
    {{ label }}
  </v-chip>
</template>
