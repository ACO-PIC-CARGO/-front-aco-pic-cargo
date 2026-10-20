<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useTownStore } from "@/stores/town";

const Town = defineAsyncComponent(() => import("../../components/Town/ListTownComponet.vue"));
const FilterTown = defineAsyncComponent(() => import("../../components/filtros/FilterTown.vue"));

const townStore = useTownStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE DISTRITOS`;
});
</script>

<template>
  <v-container fluid>
    <Town />
    <v-navigation-drawer
      v-model="townStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterTown />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
