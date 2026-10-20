<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListPerformanceComponent = defineAsyncComponent(() => import("@/components/FolderPerformance/ListaPerformanceComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Tipos de Documentos Comerciales";
});
</script>

<template>
  <ListPerformanceComponent />
</template>

<style></style>
