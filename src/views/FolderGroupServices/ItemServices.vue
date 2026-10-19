<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useItemServicesStore } from "@/stores/itemServices";

const ListItemServiceComponet = defineAsyncComponent(() => import("../../components/FolderGroupServices/ListItemServiceComponet.vue"));
const FilterTown = defineAsyncComponent(() => import("../../components/filtros/FilterGrupoServices.vue"));

const itemServicesStore = useItemServicesStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE DETALLES DE SERVICIO`;
});
</script>

<template>
  <v-container fluid>
    <ListItemServiceComponet />
    <v-navigation-drawer
      v-model="itemServicesStore.drawer"
      location="right"

      width="30%"
      temporary
    >
      <FilterTown />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
