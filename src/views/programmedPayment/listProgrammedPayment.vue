<template>
  <LitProgrammedPaymentView />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  name: "listProgrammedPaymentView",
  components: {
    LitProgrammedPaymentView: defineAsyncComponent(() =>
      import("../../components/ProgrammedPayment/listProgrammedPayment.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "LISTADO DE PAGOS PROGRAMADOS";
  },
};
</script>

<style></style>
