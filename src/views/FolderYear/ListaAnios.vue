<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListYearComponent = defineAsyncComponent(() => import("@/components/FolderYear/ListaAniosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Años";
});
</script>

<template>
  <ListYearComponent />
</template>

<style></style>
