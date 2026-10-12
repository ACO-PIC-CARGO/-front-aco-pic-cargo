<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <EstatusDefectoComponent />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  name: 'EstatusDefecto',
  components: {
    EstatusDefectoComponent: defineAsyncComponent(() => import('@/components/FolderConfig/EstatusDefectoComponent.vue')),
  },
  data() {
    return {};
  },
};
</script>

<style scoped>
</style>
