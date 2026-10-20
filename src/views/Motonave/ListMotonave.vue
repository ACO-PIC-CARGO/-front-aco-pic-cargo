<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useMotonaveStore } from "@/stores/motonave";

const MotonaveComponent = defineAsyncComponent(() => import("../../components/Motonave/ListMotonaveComponent.vue"));
const FilterMotonave = defineAsyncComponent(() => import("../../components/filtros/FilterMotonave.vue"));

const motonaveStore = useMotonaveStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE ESTADOS DE MOTO NAVES`;
});
</script>

<template>
  <v-container fluid>
    <MotonaveComponent />
    <v-navigation-drawer
      v-model="motonaveStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterMotonave />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
