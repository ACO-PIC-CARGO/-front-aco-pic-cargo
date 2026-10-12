<template>
  <CalculadoraComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    CalculadoraComponent: defineAsyncComponent(() =>
      import("../../components/folterCargaMasiva/CalculadoraComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "CARGA MASIVA CALCULADORA";
  },
};
</script>

<style></style>
