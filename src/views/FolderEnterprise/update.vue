<template>
  <UpdateEnterpriseComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    UpdateEnterpriseComponent: defineAsyncComponent(() =>
      import("@/components/FolderEnterprise/update.vue")),
  },
};
</script>

<style></style>
