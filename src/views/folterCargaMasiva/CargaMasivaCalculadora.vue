<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const CalculadoraComponent = defineAsyncComponent(() =>
  import("../../components/folterCargaMasiva/CalculadoraComponent.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "CARGA MASIVA CALCULADORA";
});
</script>

<template>
  <CalculadoraComponent />
</template>

<style></style>
