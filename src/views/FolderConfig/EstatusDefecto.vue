<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const EstatusDefectoComponent = defineAsyncComponent(() => import("@/components/FolderConfig/EstatusDefectoComponent.vue"));
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <EstatusDefectoComponent />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
</style>
