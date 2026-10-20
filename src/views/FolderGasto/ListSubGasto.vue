<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useSubgastoStore } from "@/stores/subgasto";

const SubGasto = defineAsyncComponent(() => import("../../components/FolderGasto/ListSubGastoCompponent.vue"));
const FilterSubGasto = defineAsyncComponent(() => import("../../components/filtros/FilterSubGasto.vue"));

const subgastoStore = useSubgastoStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE SUB GASTO`;
});
</script>

<template>
  <v-container fluid>
    <SubGasto />
    <v-navigation-drawer
      v-model="subgastoStore.drawer"
      location="right"

      width="30%"
      temporary
    >
      <FilterSubGasto />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
