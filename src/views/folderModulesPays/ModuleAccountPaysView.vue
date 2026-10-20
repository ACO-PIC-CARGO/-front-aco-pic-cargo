<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useStore } from "vuex";
import AccountPaysCom from "@/components/folderModulesPays/ModuleAccountPaysComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "CONTROL CUENTAS POR PAGAR ADMINISTRATIVAS";
  nextTick(() => {
    rootStore.state.drawer = false;
  });
});
</script>

<template>
  <v-card>
    <AccountPaysCom />
  </v-card>
</template>
