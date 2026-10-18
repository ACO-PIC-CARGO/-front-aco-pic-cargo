<template>
  <ListIngresosComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListIngresosComponent: defineAsyncComponent(() =>
      import("@/components/FolderIngresos/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Tipos de Ingresos";
  },
};
</script>

<style></style>
