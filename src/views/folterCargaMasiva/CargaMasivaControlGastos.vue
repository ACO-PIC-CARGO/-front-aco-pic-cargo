<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const ControlGastos = defineAsyncComponent(() =>
  import("@/components/folterCargaMasiva/ControlGastosComponent.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "CARGA MASIVA CONTROL DE GASTOS";
});
</script>

<template>
  <v-card>
    <ControlGastos />
  </v-card>
</template>

<style></style>
