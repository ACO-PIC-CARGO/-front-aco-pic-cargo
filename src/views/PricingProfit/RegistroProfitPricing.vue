<template>
  <v-card>
    <RegistroProfitPricing />
  </v-card>
</template>

<script>
import RegistroProfitPricing from "../../components/ProfitPricing/RegistroProfitPricing.vue";
import { mapActions as mapPiniaActions } from "pinia";
import { usePricingStore } from "@/stores/pricing";

export default {
  components: {
    RegistroProfitPricing,
  },
  methods: {
    ...mapPiniaActions(usePricingStore, ["getModality", "getShipment", "getIncoterms"]),
  },
  mounted() {
    Promise.all([this.getModality(), this.getShipment(), this.getIncoterms()]);
  },
};
</script>

<style></style>
