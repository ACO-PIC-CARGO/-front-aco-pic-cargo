<template>
  <listConsolidacion />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    listConsolidacion: defineAsyncComponent(() =>
      import("@/components/folderConsolidacion/lstConsolidacion.vue")),
  },
};
</script>

<style></style>
