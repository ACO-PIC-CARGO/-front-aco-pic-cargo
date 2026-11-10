<script setup lang="ts">
import { onMounted } from "vue";
import CuentasBancariasListado from "@/components/folderBanks/CuentasBancariasListado.vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Cuentas bancarias";
});
</script>

<template>
  <v-container fluid>
    <CuentasBancariasListado />
  </v-container>
</template>
