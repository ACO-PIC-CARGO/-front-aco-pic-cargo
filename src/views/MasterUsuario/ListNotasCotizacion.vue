<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const NotasCotizacion = defineAsyncComponent(() => import("../../components/MasterUsuario/ListNotaCotizacionComponent.vue"));
const FilterNotasCotizacion = defineAsyncComponent(() => import("../../components/filtros/FilterNotasCotizacion.vue"));

const masterusuariosStore = useMasterusuariosStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTADO DE NOTAS DE LA COTIZACIÓN`;
});
</script>

<template>
  <v-container fluid>
    <NotasCotizacion />
    <v-navigation-drawer
      v-model="masterusuariosStore.drawer"
      location="right"
      
      width="50%"
      temporary
    >
      <FilterNotasCotizacion />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
