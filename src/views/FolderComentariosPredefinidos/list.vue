<template>
  <ListComentariosPredefinidos />
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListComentariosPredefinidos: defineAsyncComponent(() => import("@/components/FolderComentariosPredefinidos/list.vue")),
  }
}
</script>