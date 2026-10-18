<template>
  <ListGastoComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListGastoComponent: defineAsyncComponent(() =>
      import("@/components/FolderGasto/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Tipos de Gastos";
  },
};
</script>

<style></style>
