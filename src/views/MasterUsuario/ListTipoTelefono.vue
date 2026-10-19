<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const TipoTelefono = defineAsyncComponent(() => import("../../components/MasterUsuario/ListTipoTelefonoComponet.vue"));
const FilterTipoTelefono = defineAsyncComponent(() => import("../../components/filtros/FilterTipoTelefono.vue"));

const masterusuariosStore = useMasterusuariosStore();
const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE TIPO DE TELÉFONO`;
});
</script>

<template>
  <v-container fluid>
    <TipoTelefono />
    <v-navigation-drawer
      v-model="masterusuariosStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterTipoTelefono />
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
