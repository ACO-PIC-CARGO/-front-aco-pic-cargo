<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const InsertEnterpriseComponent = defineAsyncComponent(
  () => import("@/components/FolderEnterprise/NuevaEmpresaComponent.vue"),
);
</script>

<template>
  <InsertEnterpriseComponent />
</template>

<style></style>
