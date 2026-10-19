<script setup lang="ts">
import { useCalculadorasStore } from "@/stores/calculadoras";

withDefaults(defineProps<{ type?: string; idModality?: number }>(), {
  type: "FCL",
  idModality: 1,
});

const calculadorasStore = useCalculadorasStore();

const headers = [
  { title: "Modalidad", key: "modality" },
  { title: "Sección", key: "nombre" },
];
</script>

<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="calculadorasStore.lstTipoCosto"
    />
  </v-container>
</template>

<style></style>
