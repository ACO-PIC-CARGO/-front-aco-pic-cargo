<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { usePuertoStore } from "@/stores/puerto";

const PuertoComponent = defineAsyncComponent(() => import("../../components/Port/ListPortComponent.vue"));
const FilterPort = defineAsyncComponent(() => import("../../components/filtros/FiltroPuerto.vue"));

const puertoStore = usePuertoStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE PUERTOS Y AEROLÍNEAS`;
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
