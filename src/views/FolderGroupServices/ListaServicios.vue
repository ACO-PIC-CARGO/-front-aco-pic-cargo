<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListGroupservicesComponent = defineAsyncComponent(() => import("@/components/FolderGroupServices/ListaServiciosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Servicios";
});
</script>

<template>
  <ListGroupservicesComponent />
</template>

<style></style>
