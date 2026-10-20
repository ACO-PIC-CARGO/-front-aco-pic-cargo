<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListIncotermComponent = defineAsyncComponent(() => import("@/components/FolderIncoterm/ListaIncotermsComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Incoterm";
});
</script>

<template>
  <ListIncotermComponent />
</template>

<style></style>
