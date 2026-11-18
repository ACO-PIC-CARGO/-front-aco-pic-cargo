<script setup lang="ts">
import { computed } from "vue";
import { BOTTOM_BAR_HEIGHT, BOTTOM_SHEET_HEIGHT, openBottomBars } from "./bottomBar";

const height = computed(() => (openBottomBars.size ? `calc(${BOTTOM_SHEET_HEIGHT} + 32px)` : `${2 * BOTTOM_BAR_HEIGHT + 32}px`));
</script>

<template>
  <div
    :style="{ height }"
    aria-hidden="true"
  />
</template>
