<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const BalanceGeneral = defineAsyncComponent(() => import("@/components/balances/BalanceGananciaComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "ESTADO DE GANANCIA Y PERDIDAS";
});
</script>

<template>
  <BalanceGeneral />
</template>

<style></style>
