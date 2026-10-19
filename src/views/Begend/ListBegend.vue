<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useBegendStore } from "@/stores/begend";

const Begend = defineAsyncComponent(() => import("../../components/Begend/ListBegendComponent.vue"));
const FilterBegend = defineAsyncComponent(() => import("../../components/filtros/FilterBegend.vue"));

const begendStore = useBegendStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE SERVICIOS`;
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
