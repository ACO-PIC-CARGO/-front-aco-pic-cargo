<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import ListMetodosPagoProveedorComponent from "@/components/MasterUsuario/ListMetodosPagoProveedorComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "MÉTODOS DE PAGO AL PROVEEDOR";
});
</script>

<template>
  <v-container fluid>
    <ListMetodosPagoProveedorComponent />
  </v-container>
</template>
