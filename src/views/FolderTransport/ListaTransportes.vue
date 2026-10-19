<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ListTransportComponent = defineAsyncComponent(() => import("@/components/FolderTransport/ListaTransportesComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "TIPOS DE TRANSPORTE";
});
</script>

<template>
  <ListTransportComponent />
</template>

<style></style>
