<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

const listProyeccionCXP = defineAsyncComponent(
  () => import("../../components/proyeccion/ProyeccionCxPComponent.vue"),
);

onMounted(() => {
  appStore.mainTitle = "PROYECCIÓN DE GASTOS";
});
</script>

<template>
  <v-card class="pa-3">
    <listProyeccionCXP />
  </v-card>
</template>

<style></style>
