<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import ReportFileDetailsComponent from "@/components/Reports/ReportFileDetailsComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "REPORTE CONTROL DE FILE DETALLADO";
});
</script>

<template>
  <div>
    <ReportFileDetailsComponent status-report="true" />
  </div>
</template>
