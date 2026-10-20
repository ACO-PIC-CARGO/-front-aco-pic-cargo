<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const rootStore = useStore();

const nuevaProyeccion = defineAsyncComponent(
  () => import("../../components/proyeccion/EditarProyeccionComponent.vue"),
);

onMounted(() => {
  rootStore.state.mainTitle = "VER PROYECCIÓN DE GASTOS";
});
</script>

<template>
  <v-card>
    <nuevaProyeccion />
  </v-card>
</template>

<style></style>
