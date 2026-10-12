<template>
  <ListTransportComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListTransportComponent: defineAsyncComponent(() =>
      import("@/components/FolderTransport/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "TIPOS DE TRANSPORTE";
  },
};
</script>

<style></style>
