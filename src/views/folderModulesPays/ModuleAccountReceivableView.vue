<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import moduleAccountReceivableCom from "@/components/folderModulesPays/ModuleAccountReceivableComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "CONTROL DE CUENTAS POR COBRAR ADMINISTRATIVAS";
  nextTick(() => {
    appStore.drawer = false;
  });
});
</script>

<template>
  <v-card>
    <moduleAccountReceivableCom />
  </v-card>
</template>
