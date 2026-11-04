<script setup lang="ts">
import { onMounted } from "vue";
import TrafficStatusCatalog from "@/components/folderTraffic/TrafficStatusCatalog.vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Estatus de tráfico";
});
</script>

<template>
  <v-container fluid>
    <TrafficStatusCatalog />
  </v-container>
</template>
