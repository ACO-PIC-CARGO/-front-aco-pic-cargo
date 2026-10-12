<template>
  <ListContainersComponent />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListContainersComponent: defineAsyncComponent(() =>
      import("@/components/FolderContainers/list.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Tipos de Contenedores";
  },
};
</script>

<style></style>
