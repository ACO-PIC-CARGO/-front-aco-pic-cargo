<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const ListComentariosPredefinidos = defineAsyncComponent(
  () => import("@/components/FolderComentariosPredefinidos/ListaComentariosPredefinidosComponent.vue"),
);
</script>

<template>
  <ListComentariosPredefinidos />
</template>
