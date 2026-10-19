<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListGastoComponent = defineAsyncComponent(() => import("@/components/FolderGasto/ListaGastosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Tipos de Gastos";
});
</script>

<template>
  <ListGastoComponent />
</template>

<style></style>
