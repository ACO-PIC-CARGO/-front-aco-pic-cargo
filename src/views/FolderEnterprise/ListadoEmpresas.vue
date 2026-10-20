<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListEnterpriseComponent = defineAsyncComponent(
  () => import("@/components/FolderEnterprise/ListadoEmpresasComponent.vue"),
);

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "EMPRESAS";
});
</script>

<template>
  <ListEnterpriseComponent />
</template>

<style></style>
