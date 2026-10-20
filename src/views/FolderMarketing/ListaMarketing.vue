<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListMarketingComponent = defineAsyncComponent(() => import("@/components/FolderMarketing/ListaMarketingComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "TIPO DE MARKETING";
});
</script>

<template>
  <ListMarketingComponent />
</template>

<style></style>
