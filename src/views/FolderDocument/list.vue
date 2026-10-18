<template>
  <ListDocumentsComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListDocumentsComponent: defineAsyncComponent(() =>
      import("@/components/FolderDocument/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "TIPO DE DOCUMENTOS";
  },
};
</script>

<style></style>
