<template>
  <ListPerformanceComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListPerformanceComponent: defineAsyncComponent(() =>
      import("@/components/FolderPerformance/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Tipos de Documentos Comerciales";
  },
};
</script>

<style></style>
