<template>
  <v-card>
    <ControlGastos />
  </v-card>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ControlGastos: defineAsyncComponent(() =>
      import("@/components/folterCargaMasiva/ControlGastosComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "CARGA MASIVA CONTROL DE GASTOS";
  },
};
</script>

<style></style>
