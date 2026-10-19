<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const Posicion = defineAsyncComponent(() => import("../../components/Posicion/EditarPosicionComponet.vue"));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FilterPosicion = defineAsyncComponent(() => import("../../components/filtros/FilterPosicion.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `ROLES DE USUARIOS DEL SISTEMA POSICIÓN`;
});
</script>

<template>
  <v-container fluid>
    <Posicion />
  </v-container>
</template>

<style></style>
