<script setup lang="ts">
import { onMounted } from "vue";
import ConfiguracionOpcionCalculadoraComponent from "../../components/Calculadora/ConfiguracionOpcionCalculadoraComponent.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";

const calculadorasStore = useCalculadorasStore();

onMounted(async () => {
  await calculadorasStore.opcionListado();
});
</script>

<template>
  <v-card>
    <ConfiguracionOpcionCalculadoraComponent />
  </v-card>
</template>

<style></style>
