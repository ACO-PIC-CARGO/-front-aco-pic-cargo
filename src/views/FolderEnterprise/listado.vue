<template>
  <ListEnterpriseComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListEnterpriseComponent: defineAsyncComponent(() =>
      import("@/components/FolderEnterprise/listado.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "EMPRESAS";
  },
};
</script>

<style></style>
