<template>
  <ListSexComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListSexComponent: defineAsyncComponent(() =>
      import("@/components/FolderSex/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Géneros";
  },
};
</script>

<style></style>
