<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import listControlGastosCom from "@/components/folderBilling/ListadoFacturacion.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "LISTA DE FACTURAS";
});
</script>

<template>
  <div>
    <listControlGastosCom />
  </div>
</template>
