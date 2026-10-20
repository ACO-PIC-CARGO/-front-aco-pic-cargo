<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import registroPayForProveedor from "@/components/folderBanks/RegistroPayForProveedorComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "BANCOS - PAGOS - SALIDAS";
});
</script>

<template>
  <registroPayForProveedor tipo="nuevo" />
</template>

<style></style>
