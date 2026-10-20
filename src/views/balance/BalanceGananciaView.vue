<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const BalanceGeneral = defineAsyncComponent(() => import("@/components/balances/BalanceGananciaComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "ESTADO DE GANANCIA Y PERDIDAS";
});
</script>

<template>
  <BalanceGeneral />
</template>

<style></style>
