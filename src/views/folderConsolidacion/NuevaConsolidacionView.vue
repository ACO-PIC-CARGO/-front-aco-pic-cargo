<template>
  <nuevaConsolidacion />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    nuevaConsolidacion: defineAsyncComponent(() =>
      import("@/components/folderConsolidacion/newConsolidacion.vue")),
  },
};
</script>

<style></style>
