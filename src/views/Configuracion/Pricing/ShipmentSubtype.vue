<script setup lang="ts">
import { onMounted } from "vue";
import ShipmentSubtypeCatalog from "@/components/Configuracion/Pricing/ShipmentSubtypeCatalog.vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Sub tipo de embarque";
});
</script>

<template>
  <v-container fluid>
    <ShipmentSubtypeCatalog />
  </v-container>
</template>
