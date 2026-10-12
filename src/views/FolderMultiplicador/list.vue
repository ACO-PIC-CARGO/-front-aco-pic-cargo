<template>
  <ListMultiplicadorComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListMultiplicadorComponent: defineAsyncComponent(() =>
      import("@/components/FolderMultiplicador/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Multiplicadores";
  },
};
</script>

<style></style>
