<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import ReportFileDetailsComponent from "@/components/Reports/ReportFileDetailsComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "REPORTE CONTROL DE FILE DETALLADO";
});
</script>

<template>
  <div>
    <ReportFileDetailsComponent status-report="true" />
  </div>
</template>
