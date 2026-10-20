<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListContainersComponent = defineAsyncComponent(() => import("@/components/FolderContainers/ListaContenedoresComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Tipos de Contenedores";
});
</script>

<template>
  <ListContainersComponent />
</template>

<style></style>
