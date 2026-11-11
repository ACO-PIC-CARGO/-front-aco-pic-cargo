<script setup lang="ts">
import { onMounted } from "vue";
import TipoProveedorCatalog from "@/components/TipoProveedor/TipoProveedorCatalog.vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Tipo de Proveedor";
});
</script>

<template>
  <v-container fluid>
    <TipoProveedorCatalog />
  </v-container>
</template>
