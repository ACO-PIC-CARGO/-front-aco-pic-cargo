<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import controlAccountPaysCom from "@/components/folderModulesPays/ControlAccountPaysComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "NUEVA CUENTA POR PAGAR";
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
          <controlAccountPaysCom tipo="nuevo" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
