<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import CheckDebsComponent from "../../components/folderRequests/CheckDebsComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Abonos para confirmar";
});
</script>

<template>
  <div>
    <CheckDebsComponent />
  </div>
</template>
