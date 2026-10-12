<template>
  <ListModalityComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListModalityComponent: defineAsyncComponent(() =>
      import("@/components/FolderModality/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "MODALIDADES (SENTIDOS)";
  },
};
</script>

<style></style>
