<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const Posicion = defineAsyncComponent(() => import("../../components/Posicion/VerPosicionComponet.vue"));

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `ROLES DE USUARIOS DEL SISTEMA – Modo Vista`;
});
</script>

<template>
  <v-container>
    <Posicion />
  </v-container>
</template>

<style></style>
