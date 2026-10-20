<template>
  <div>
    <listControlGastosCom></listControlGastosCom>
  </div>
</template>
<script>
import listControlGastosCom from "@/components/folderBilling/ListadoFacturacion.vue";
export default {
  name: "listEntities",
  components: {
    listControlGastosCom,
  },
  mounted() {
    this.$store.state.mainTitle = "LISTA DE FACTURAS";
  },
  data() {
    return {};
  },
};
</script>
