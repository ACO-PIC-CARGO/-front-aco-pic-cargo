<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const listConsolidacion = defineAsyncComponent(() =>
  import("@/components/folderConsolidacion/ListaConsolidacionComponent.vue"));
</script>

<template>
  <listConsolidacion />
</template>

<style></style>
