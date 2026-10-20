<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

const nuevaProyeccion = defineAsyncComponent(
  () => import("../../components/proyeccion/VerProyeccionComponent.vue"),
);

onMounted(() => {
  appStore.mainTitle = "VER PROYECCIÓN DE GASTOS";
});
</script>

<template>
  <v-card>
    <nuevaProyeccion />
  </v-card>
</template>

<style></style>
