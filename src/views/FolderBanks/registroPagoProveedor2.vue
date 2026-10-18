<template>
  <registroPayForProveedor tipo="nuevo" />
</template>

<script>
import registroPayForProveedor from "@/components/folderBanks/registroPayForProveedor.vue";

export default {
  components: {
    registroPayForProveedor,
  },
  mounted() {
    this.$store.state.mainTitle = "BANCOS - PAGOS - SALIDAS";
  },
};
</script>

<style></style>
