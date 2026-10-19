<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const Impuestos = defineAsyncComponent(() => import("@/components/MasterUsuario/ListImpuestoComponent.vue"));
const FilterImpuesto = defineAsyncComponent(() => import("../../components/filtros/FilterImpuesto.vue"));

const masterusuariosStore = useMasterusuariosStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE IMPUESTOS`;
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
