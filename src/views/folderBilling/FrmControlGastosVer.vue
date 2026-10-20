<template>
  <formularioControlGastos :editable="false" />
</template>
<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    formularioControlGastos: defineAsyncComponent(() =>
      import("@/components/folderBilling/FrmControlGastosComponent.vue")),
  },
};
</script>
