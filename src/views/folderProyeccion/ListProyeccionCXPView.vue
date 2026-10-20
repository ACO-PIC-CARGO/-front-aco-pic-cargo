<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const rootStore = useStore();

const listProyeccionCXP = defineAsyncComponent(
  () => import("../../components/proyeccion/ProyeccionCxPComponent.vue"),
);

onMounted(() => {
  rootStore.state.mainTitle = "PROYECCIÓN DE GASTOS";
});
</script>

<template>
  <v-card class="pa-3">
    <listProyeccionCXP />
  </v-card>
</template>

<style></style>
