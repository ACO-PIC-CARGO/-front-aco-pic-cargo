<template>
  <v-card>
    <RegistroProfitPricing />
  </v-card>
</template>

<script>
import { mapActions } from "vuex/dist/vuex.common.js";
import RegistroProfitPricing from "../../components/ProfitPricing/RegistroProfitPricing.vue";

export default {
  components: {
    RegistroProfitPricing,
  },
  methods: {
    ...mapActions(["getModality", "getShipment", "getIncoterms"]),
  },
  mounted() {
    Promise.all([this.getModality(), this.getShipment(), this.getIncoterms()]);
  },
};
</script>

<style></style>
