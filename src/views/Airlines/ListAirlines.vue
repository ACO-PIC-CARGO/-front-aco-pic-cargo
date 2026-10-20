<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useAirlinesStore } from "@/stores/airlines";

const ListAirlinesComponet = defineAsyncComponent(() => import("@/components/Maestros/Airlines/ListAirlinesComponet.vue"));
const FilterAirlinesComponet = defineAsyncComponent(() => import("../../components/filtros/FiltroAirlines.vue"));

const airlinesStore = useAirlinesStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE AEROLÍNEAS`;
});
</script>

<template>
  <v-container fluid>
    <ListAirlinesComponet />
    <v-navigation-drawer
      v-model="airlinesStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterAirlinesComponet :type="airlinesStore.tipo" />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
