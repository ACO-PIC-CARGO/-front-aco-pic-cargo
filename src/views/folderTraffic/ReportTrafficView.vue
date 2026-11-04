<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import TrafficReport from "@/components/folderTraffic/TrafficReport.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Control de Tráfico";
});
</script>

<template>
  <TrafficReport />
</template>
