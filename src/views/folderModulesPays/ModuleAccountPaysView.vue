<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import AccountPaysCom from "@/components/folderModulesPays/ModuleAccountPaysComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "CONTROL CUENTAS POR PAGAR ADMINISTRATIVAS";
  nextTick(() => {
    appStore.drawer = false;
  });
});
</script>

<template>
  <v-card>
    <AccountPaysCom />
  </v-card>
</template>
