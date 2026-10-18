<template>
  <ReadEnterpriseComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ReadEnterpriseComponent: defineAsyncComponent(() =>
      import("@/components/FolderEnterprise/read.vue")),
  },
};
</script>

<style></style>
