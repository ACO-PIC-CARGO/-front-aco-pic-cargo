<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListShipmentComponent = defineAsyncComponent(() => import("@/components/FolderTipoCarga/ListaTiposCargaComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Tipos de Carga";
});
</script>

<template>
  <ListShipmentComponent />
</template>

<style></style>
