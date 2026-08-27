<template>
  <v-card>
    <AccountPaysCom />
  </v-card>
</template>

<script>
import AccountPaysCom from "@/components/folderModulesPays/moduleAccountPays";
export default {
  name: "moduleAccountPays",
  components: {
    AccountPaysCom,
  },
  mounted() {
    this.$store.state.mainTitle = "CONTROL CUENTAS POR PAGAR";
  },
};
</script>