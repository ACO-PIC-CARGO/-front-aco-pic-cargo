<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ListDocumentsComponent = defineAsyncComponent(() => import("@/components/FolderDocument/ListaDocumentosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "TIPO DE DOCUMENTOS";
});
</script>

<template>
  <ListDocumentsComponent />
</template>

<style></style>
