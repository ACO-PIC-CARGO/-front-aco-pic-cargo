<template>
  <BalanceGeneral />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    BalanceGeneral: defineAsyncComponent(() =>
      import("../../components/balances/balanceGanancia.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "ESTADO DE GANANCIA Y PERDIDAS";
  },
};
</script>

<style></style>
