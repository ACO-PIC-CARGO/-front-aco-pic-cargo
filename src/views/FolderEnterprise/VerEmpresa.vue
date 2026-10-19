<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const ReadEnterpriseComponent = defineAsyncComponent(
  () => import("@/components/FolderEnterprise/VerEmpresaComponent.vue"),
);
</script>

<template>
  <ReadEnterpriseComponent />
</template>

<style></style>
