<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";

const ListProveedorComponentVue = defineAsyncComponent(() =>
  import("@/components/folderEntities/Proveedor/ListProveedorComponent.vue"));
const FiltroProveedor = defineAsyncComponent(() => import("@/components/filtros/FiltroProveedor.vue"));

const appStore = useAppStore();
const entitiesStore = useEntitiesStore();

onMounted(() => {
  appStore.mainTitle = "Listado de Proveedores";
});
</script>

<template>
  <v-container fluid>
    <v-card
      flat
      class="bg-transparent"
    >
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
