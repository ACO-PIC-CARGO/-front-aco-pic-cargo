<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

const nuevaProyeccion = defineAsyncComponent(
  () => import("../../components/proyeccion/NuevaProyeccionCXPComponent.vue"),
);

onMounted(() => {
  appStore.mainTitle = "REGISTRO DE NUEVA PROYECCIÓN GASTOS";
});
</script>

<template>
  <v-card>
    <nuevaProyeccion />
  </v-card>
</template>

<style></style>
