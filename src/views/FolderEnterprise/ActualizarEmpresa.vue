<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const UpdateEnterpriseComponent = defineAsyncComponent(
  () => import("@/components/FolderEnterprise/ActualizarEmpresaComponent.vue"),
);
</script>

<template>
  <UpdateEnterpriseComponent />
</template>

<style></style>
