<script setup lang="ts">
import { usePricingStore } from "@/stores/pricing";

const pricingStore = usePricingStore();
</script>

<template>
  <v-textarea
    v-model="pricingStore.datosPrincipales.pricing_notes"
    label="Nueva nota"
    placeholder="Escribe lo que Pricing o Ventas debe saber. Se agrega al historial al guardar."
    rows="3"
    auto-grow
  />
</template>
