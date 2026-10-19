<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { usePositionStore } from "@/stores/position";

const Posicion = defineAsyncComponent(() => import("../../components/Posicion/ListPosicionComponet.vue"));
const FilterPosicion = defineAsyncComponent(() => import("../../components/filtros/FilterPosicion.vue"));

const positionStore = usePositionStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE ROLES DE USUARIOS DEL SISTEMA`;
});
</script>

<template>
  <v-container fluid>
    <Posicion />
    <v-navigation-drawer
      v-model="positionStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterPosicion />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
