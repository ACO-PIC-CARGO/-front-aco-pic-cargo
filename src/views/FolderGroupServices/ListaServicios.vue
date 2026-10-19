<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListGroupservicesComponent = defineAsyncComponent(() => import("@/components/FolderGroupServices/ListaServiciosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Servicios";
});
</script>

<template>
  <ListGroupservicesComponent />
</template>

<style></style>
