<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListContainersComponent = defineAsyncComponent(() => import("@/components/FolderContainers/ListaContenedoresComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Tipos de Contenedores";
});
</script>

<template>
  <ListContainersComponent />
</template>

<style></style>
