<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useBegendStore } from "@/stores/begend";

const Begend = defineAsyncComponent(() => import("../../components/Begend/ListBegendComponent.vue"));
const FilterBegend = defineAsyncComponent(() => import("../../components/filtros/FilterBegend.vue"));

const begendStore = useBegendStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE SERVICIOS`;
});
</script>

<template>
  <v-container fluid>
    <Begend />
    <v-navigation-drawer
      v-model="begendStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterBegend />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
