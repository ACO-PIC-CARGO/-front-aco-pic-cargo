<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import ReportFileComponent from "@/components/Reports/ReportFileComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "REPORTE CONTROL DE FILE";
});
</script>

<template>
  <div>
    <ReportFileComponent status-report="true" />
  </div>
</template>
