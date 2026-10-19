<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useEntitiesStore } from "@/stores/entities";

const ListClienteComponentVue = defineAsyncComponent(() =>
  import("@/components/folderEntities/Cliente/ListClienteComponent.vue"));
const FiltroCliente = defineAsyncComponent(() => import("@/components/filtros/FiltroCliente.vue"));

const rootStore = useStore();
const entitiesStore = useEntitiesStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE CLIENTES`;
});
</script>

<template>
  <v-container fluid>
    <v-card>
      <ListClienteComponentVue />
    </v-card>
    <v-navigation-drawer
      v-model="entitiesStore.filtrarProveedor"
      location="right"
      
      width="20%"
      temporary
    >
      <v-card elevation="0">
        <FiltroCliente />
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
