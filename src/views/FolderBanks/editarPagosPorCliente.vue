<template>
  <v-container fluid>
    <verEditarPayForCliente :verflag="false" />
  </v-container>
</template>

<script>
import verEditarPayForCliente from "@/components/folderBanks/verEditarPayForCliente";

export default {
  components: {
    verEditarPayForCliente,
  },
};
</script>

<style></style>
