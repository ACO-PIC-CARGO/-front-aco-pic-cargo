<template>
  <ListTypePhoneComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListTypePhoneComponent: defineAsyncComponent(() =>
      import("@/components/FolderTypePhone/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "TIPO DE TELÉFONO";
  },
};
</script>

<style></style>
