<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListMultiplicadorComponent = defineAsyncComponent(() => import("@/components/FolderMultiplicador/ListaMultiplicadoresComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Multiplicadores";
});
</script>

<template>
  <ListMultiplicadorComponent />
</template>

<style></style>
