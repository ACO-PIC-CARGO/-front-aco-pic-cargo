<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useSubingresoStore } from "@/stores/subingreso";

const SubIngreso = defineAsyncComponent(() => import("../../components/FolderIngresos/ListSubIngresoCompponent.vue"));
const FilterBegend = defineAsyncComponent(() => import("../../components/filtros/FilterSubIngreso.vue"));

const subingresoStore = useSubingresoStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE SUB INGRESOS`;
});
</script>

<template>
  <v-container fluid>
    <SubIngreso />
    <v-navigation-drawer
      v-model="subingresoStore.drawer"
      location="right"

      width="30%"
      temporary
    >
      <FilterBegend />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
