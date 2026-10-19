<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListMultiplicadorComponent = defineAsyncComponent(() => import("@/components/FolderMultiplicador/ListaMultiplicadoresComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Multiplicadores";
});
</script>

<template>
  <ListMultiplicadorComponent />
</template>

<style></style>
