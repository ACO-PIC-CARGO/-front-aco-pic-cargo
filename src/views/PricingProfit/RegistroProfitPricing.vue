<script setup lang="ts">
import { onMounted } from "vue";
import RegistroProfitPricing from "../../components/ProfitPricing/RegistroProfitPricing.vue";
import { usePricingStore } from "@/stores/pricing";

const pricingStore = usePricingStore();

onMounted(() => {
  Promise.all([pricingStore.getModality(), pricingStore.getShipment(), pricingStore.getIncoterms()]);
});
</script>

<template>
  <v-card>
    <RegistroProfitPricing />
  </v-card>
</template>

<style></style>
