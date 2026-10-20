<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const nuevaConsolidacion = defineAsyncComponent(() =>
  import("@/components/folderConsolidacion/NuevaConsolidacionComponent.vue"));
</script>

<template>
  <nuevaConsolidacion />
</template>

<style></style>
