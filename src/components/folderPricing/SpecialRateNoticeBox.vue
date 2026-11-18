<script setup lang="ts">
import type { SpecialRateNotice } from "./specialRateNotice";

defineProps<{ notice: SpecialRateNotice }>();
</script>

<template>
  <v-sheet
    class="d-flex flex-wrap align-center ga-4 pa-4 my-2 border-warning"
    color="orange-lighten-5"
    rounded="lg"
    border="md"
  >
    <v-icon
      icon="mdi-truck"
      size="56"
      color="warning"
    />
    <div class="flex-grow-1">
      <div class="text-headline-small font-weight-bold text-deep-orange-darken-2">
        {{ notice.title }}
      </div>
      <div>{{ notice.intro }}</div>
      <ul class="pl-6 font-weight-bold">
        <li
          v-for="(condition, index) in notice.conditions"
          :key="index"
        >
          {{ condition }}
        </li>
      </ul>
    </div>
    <v-sheet
      class="d-flex align-center ga-3 pa-3"
      color="deep-orange-darken-3"
      rounded="lg"
      max-width="280"
    >
      <v-icon icon="mdi-information" />
      <span class="font-weight-bold">{{ notice.side_text }}</span>
    </v-sheet>
  </v-sheet>
</template>
