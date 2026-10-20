<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListTypePhoneComponent = defineAsyncComponent(() => import("@/components/FolderTypePhone/ListaTiposTelefonoComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "TIPO DE TELÉFONO";
});
</script>

<template>
  <ListTypePhoneComponent />
</template>

<style></style>
