<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useStatesStore } from "@/stores/states";

const StateComponent = defineAsyncComponent(() => import("../../components/State/ListStateComponent.vue"));
const FilterState = defineAsyncComponent(() => import("../../components/filtros/FilterState.vue"));

const statesStore = useStatesStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE ESTADOS`;
});
</script>

<template>
  <v-container fluid>
    <StateComponent />
    <v-navigation-drawer
      v-model="statesStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterState />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
