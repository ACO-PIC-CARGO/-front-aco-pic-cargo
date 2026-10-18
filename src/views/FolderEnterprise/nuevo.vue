<template>
  <InsertEnterpriseComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    InsertEnterpriseComponent: defineAsyncComponent(() =>
      import("@/components/FolderEnterprise/nuevo.vue")),
  },
};
</script>

<style></style>
