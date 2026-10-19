<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import listEntitiesCom from "@/components/folderEntities/ListEntities.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = `LISTA DE ${rootStore.state.menuName.toUpperCase()}`;
});
</script>

<template>
  <div>
    <listEntitiesCom />
  </div>
</template>
