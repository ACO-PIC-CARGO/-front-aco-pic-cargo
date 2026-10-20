<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListSexComponent = defineAsyncComponent(() => import("@/components/FolderSex/ListaGenerosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Géneros";
});
</script>

<template>
  <ListSexComponent />
</template>

<style></style>
