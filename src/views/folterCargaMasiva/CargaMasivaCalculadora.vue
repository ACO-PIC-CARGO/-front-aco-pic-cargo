<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const CalculadoraComponent = defineAsyncComponent(() =>
  import("../../components/folterCargaMasiva/CalculadoraComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "CARGA MASIVA CALCULADORA";
});
</script>

<template>
  <CalculadoraComponent />
</template>

<style></style>
