<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListCoinsComponent = defineAsyncComponent(() => import("@/components/FolderCoins/ListaMonedasComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Monedas";
});
</script>

<template>
  <ListCoinsComponent />
</template>

<style></style>
