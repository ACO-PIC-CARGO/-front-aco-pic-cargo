<template>
  <ListCoinsComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListCoinsComponent: defineAsyncComponent(() =>
      import("@/components/FolderCoins/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Monedas";
  },
};
</script>

<style></style>
