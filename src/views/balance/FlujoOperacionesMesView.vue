<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const flujoOperacionPorMesComponent = defineAsyncComponent(() => import("@/components/balances/FlujoOperacionPorMes.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "FLUJO PROYECCIÓN MES";
});
</script>

<template>
  <flujoOperacionPorMesComponent />
</template>

<style></style>
