<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import ReportFileComponent from "@/components/Reports/ReportFileComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "REPORTE CONTROL DE FILE";
});
</script>

<template>
  <div>
    <ReportFileComponent status-report="true" />
  </div>
</template>
