<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import registroPayForProveedor from "@/components/folderBanks/RegistroPayForProveedorComponent.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "BANCOS - PAGOS - SALIDAS";
});
</script>

<template>
  <registroPayForProveedor tipo="nuevo" />
</template>

<style></style>
