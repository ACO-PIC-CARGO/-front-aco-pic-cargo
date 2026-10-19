<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";
import { useEntitiesStore } from "@/stores/entities";

const ListProveedorComponentVue = defineAsyncComponent(() =>
  import("@/components/folderEntities/Proveedor/ListProveedorComponent.vue"));
const FiltroProveedor = defineAsyncComponent(() => import("@/components/filtros/FiltroProveedor.vue"));

const rootStore = useStore();
const entitiesStore = useEntitiesStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTADO DE PROVEEDORES`;
});
</script>

<template>
  <v-container fluid>
    <v-card>
      <ListProveedorComponentVue />
    </v-card>
    <v-navigation-drawer
      v-model="entitiesStore.filtrarProveedor"
      location="right"

      width="20%"
      temporary
    >
      <v-card elevation="0">
        <FiltroProveedor />
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
