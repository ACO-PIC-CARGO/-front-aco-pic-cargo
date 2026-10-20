<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const Impuestos = defineAsyncComponent(() => import("@/components/MasterUsuario/ListImpuestoComponent.vue"));
const FilterImpuesto = defineAsyncComponent(() => import("../../components/filtros/FilterImpuesto.vue"));

const masterusuariosStore = useMasterusuariosStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE IMPUESTOS`;
});
</script>

<template>
  <v-container fluid>
    <Impuestos />
    <v-navigation-drawer
      v-model="masterusuariosStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterImpuesto />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
