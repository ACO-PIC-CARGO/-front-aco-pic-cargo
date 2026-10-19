<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const Posicion = defineAsyncComponent(() => import("../../components/Posicion/VerPosicionComponet.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `ROLES DE USUARIOS DEL SISTEMA – Modo Vista`;
});
</script>

<template>
  <v-container>
    <Posicion />
  </v-container>
</template>

<style></style>
