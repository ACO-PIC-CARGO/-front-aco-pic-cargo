<template>
  <ListBankComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListBankComponent: defineAsyncComponent(() =>
      import("@/components/folderBanks/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Banco";
  },
};
</script>

<style></style>
