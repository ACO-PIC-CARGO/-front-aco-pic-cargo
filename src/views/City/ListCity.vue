<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useCityStore } from "@/stores/city";

const City = defineAsyncComponent(() => import("../../components/City/ListCityComponet.vue"));
const FilterCity = defineAsyncComponent(() => import("../../components/filtros/FilterCity.vue"));

const cityStore = useCityStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE CIUDADES`;
});
</script>

<template>
  <v-container fluid>
    <City />
    <v-navigation-drawer
      v-model="cityStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterCity />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
