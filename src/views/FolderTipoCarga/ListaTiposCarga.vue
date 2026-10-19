<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListShipmentComponent = defineAsyncComponent(() => import("@/components/FolderTipoCarga/ListaTiposCargaComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Tipos de Carga";
});
</script>

<template>
  <ListShipmentComponent />
</template>

<style></style>
