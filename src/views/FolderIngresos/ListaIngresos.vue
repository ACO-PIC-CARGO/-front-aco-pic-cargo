<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListIngresosComponent = defineAsyncComponent(() => import("@/components/FolderIngresos/ListaIngresosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Tipos de Ingresos";
});
</script>

<template>
  <ListIngresosComponent />
</template>

<style></style>
