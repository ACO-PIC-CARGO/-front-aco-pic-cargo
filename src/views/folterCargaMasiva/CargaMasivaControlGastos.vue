<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const ControlGastos = defineAsyncComponent(() =>
  import("@/components/folterCargaMasiva/ControlGastosComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "CARGA MASIVA CONTROL DE GASTOS";
});
</script>

<template>
  <v-card>
    <ControlGastos />
  </v-card>
</template>

<style></style>
