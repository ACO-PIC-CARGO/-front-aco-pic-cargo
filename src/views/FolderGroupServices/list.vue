<template>
  <ListGroupservicesComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListGroupservicesComponent: defineAsyncComponent(() =>
      import("@/components/FolderGroupServices/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Servicios";
  },
};
</script>

<style></style>
