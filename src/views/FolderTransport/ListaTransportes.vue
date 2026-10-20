<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListTransportComponent = defineAsyncComponent(() => import("@/components/FolderTransport/ListaTransportesComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "TIPOS DE TRANSPORTE";
});
</script>

<template>
  <ListTransportComponent />
</template>

<style></style>
