<template>
  <ListIncotermComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListIncotermComponent: defineAsyncComponent(() =>
      import("@/components/FolderIncoterm/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Incoterm";
  },
};
</script>

<style></style>
