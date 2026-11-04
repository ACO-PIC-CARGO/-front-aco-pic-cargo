<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import TrafficList from "@/components/folderTraffic/TrafficList.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "EXPEDIENTES DE TRÁFICO";
});
</script>

<template>
  <TrafficList />
</template>
