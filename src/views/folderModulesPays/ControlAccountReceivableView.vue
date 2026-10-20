<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import controlAccountReceivable from "@/components/folderModulesPays/ControlAccountReceivableComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "NUEVA CUENTA POR COBRAR";
  nextTick(() => {
    appStore.drawer = false;
  });
});
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col
          md="8"
          cols="12"
        >
          <controlAccountReceivable tipo="nuevo" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
