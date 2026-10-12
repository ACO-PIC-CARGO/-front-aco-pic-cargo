<template>
  <ListMarketingComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListMarketingComponent: defineAsyncComponent(() =>
      import("@/components/FolderMarketing/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "TIPO DE MARKETING";
  },
};
</script>

<style></style>
