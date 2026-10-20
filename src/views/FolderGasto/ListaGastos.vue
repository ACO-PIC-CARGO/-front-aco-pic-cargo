<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListGastoComponent = defineAsyncComponent(() => import("@/components/FolderGasto/ListaGastosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Tipos de Gastos";
});
</script>

<template>
  <ListGastoComponent />
</template>

<style></style>
