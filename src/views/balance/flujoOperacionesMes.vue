<template>
  <flujoOperacionPorMesComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    flujoOperacionPorMesComponent: defineAsyncComponent(() =>
      import("../../components/balances/flujoOperacionPorMesComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "FLUJO PROYECCIÓN MES";
  },
};
</script>

<style></style>
