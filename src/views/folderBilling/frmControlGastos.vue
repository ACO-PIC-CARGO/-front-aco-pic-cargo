<template>
  <formularioControlGastos />
</template>
<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    formularioControlGastos: defineAsyncComponent(() =>
      import("@/components/folderBilling/frmControlGastos.vue")),
  },
};
</script>
