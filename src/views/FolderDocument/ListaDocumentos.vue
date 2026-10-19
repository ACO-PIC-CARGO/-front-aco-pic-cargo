<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListDocumentsComponent = defineAsyncComponent(() => import("@/components/FolderDocument/ListaDocumentosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "TIPO DE DOCUMENTOS";
});
</script>

<template>
  <ListDocumentsComponent />
</template>

<style></style>
