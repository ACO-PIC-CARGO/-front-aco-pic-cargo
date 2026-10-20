<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListModalityComponent = defineAsyncComponent(() => import("@/components/FolderModality/ListaModalidadesComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "MODALIDADES (SENTIDOS)";
});
</script>

<template>
  <ListModalityComponent />
</template>

<style></style>
