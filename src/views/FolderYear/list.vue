<template>
  <ListYearComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListYearComponent: defineAsyncComponent(() =>
      import("@/components/FolderYear/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Años";
  },
};
</script>

<style></style>
