<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const flujoOperacionPorMesComponent = defineAsyncComponent(() => import("@/components/balances/FlujoOperacionPorMes.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "FLUJO PROYECCIÓN MES";
});
</script>

<template>
  <flujoOperacionPorMesComponent />
</template>

<style></style>
