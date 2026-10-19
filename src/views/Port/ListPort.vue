<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { usePuertoStore } from "@/stores/puerto";

const PuertoComponent = defineAsyncComponent(() => import("../../components/Port/ListPortComponent.vue"));
const FilterPort = defineAsyncComponent(() => import("../../components/filtros/FiltroPuerto.vue"));

const puertoStore = usePuertoStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE PUERTOS Y AEROLÍNEAS`;
});
</script>

<template>
  <v-container fluid>
    <PuertoComponent />
    <v-navigation-drawer
      v-model="puertoStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterPort />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
