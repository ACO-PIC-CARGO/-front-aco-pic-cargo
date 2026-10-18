<template>
  <ListShipmentComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListShipmentComponent: defineAsyncComponent(() =>
      import("@/components/FolderTipoCarga/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Tipos de Carga";
  },
};
</script>

<style></style>
