<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import listEntitiesCom from "@/components/folderEntities/ListEntities.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = `LISTA DE ${appStore.menuName.toUpperCase()}`;
});
</script>

<template>
  <div>
    <listEntitiesCom />
  </div>
</template>
