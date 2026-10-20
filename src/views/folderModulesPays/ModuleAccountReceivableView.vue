<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useStore } from "vuex";
import moduleAccountReceivableCom from "@/components/folderModulesPays/ModuleAccountReceivableComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "CONTROL DE CUENTAS POR COBRAR ADMINISTRATIVAS";
  nextTick(() => {
    rootStore.state.drawer = false;
  });
});
</script>

<template>
  <v-card>
    <moduleAccountReceivableCom />
  </v-card>
</template>
