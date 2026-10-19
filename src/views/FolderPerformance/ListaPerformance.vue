<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListPerformanceComponent = defineAsyncComponent(() => import("@/components/FolderPerformance/ListaPerformanceComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Tipos de Documentos Comerciales";
});
</script>

<template>
  <ListPerformanceComponent />
</template>

<style></style>
