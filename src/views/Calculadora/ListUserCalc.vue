<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useCalculadorasStore } from "@/stores/calculadoras";

const listUser = defineAsyncComponent(() =>
  import("../../components/Calculadora/ListUserCalcComponent.vue"));

const calculadorasStore = useCalculadorasStore();
const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Usuarios Calculadora";
  console.log("mounted");
  calculadorasStore.cargarEstatus();
});
</script>

<template>
  <v-card>
    <listUser />
  </v-card>
</template>

<style></style>
