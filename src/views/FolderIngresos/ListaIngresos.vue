<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListIngresosComponent = defineAsyncComponent(() => import("@/components/FolderIngresos/ListaIngresosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Tipos de Ingresos";
});
</script>

<template>
  <ListIngresosComponent />
</template>

<style></style>
