<script setup lang="ts">
import { BOTTOM_BAR_HEIGHT } from "./bottomBar";

const height = `${2 * BOTTOM_BAR_HEIGHT + 32}px`;
</script>

<template>
  <div
    :style="{ height }"
    aria-hidden="true"
  />
</template>
